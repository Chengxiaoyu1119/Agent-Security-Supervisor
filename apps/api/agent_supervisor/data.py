from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any, cast

from .database import record_policy_version
from .paths import RUNTIME_DIR

CONFIG_DIR = Path(__file__).parent / "config"
POLICY_OVERRIDES_PATH = RUNTIME_DIR / "policy_overrides.json"
POLICY_SETTINGS_PATH = RUNTIME_DIR / "policy_settings.json"
POLICY_EDITABLE_FIELDS = {"enabled", "name", "description", "decision", "layer", "risk_controls"}
DEFAULT_POLICY_SETTINGS: dict[str, Any] = {
    "anomaly_review_threshold": 55,
    "anomaly_reject_threshold": 85,
    "approval_sla_minutes": 30,
    "high_risk_auto_escalation": True,
}


def _load_json(filename: str) -> Any:
    with open(CONFIG_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def _load_json_list(filename: str) -> list[dict[str, Any]]:
    data = _load_json(filename)
    if not isinstance(data, list):
        raise TypeError(f"{filename} must contain a JSON list")
    return cast(list[dict[str, Any]], data)


def _load_json_dict(filename: str) -> dict[str, Any]:
    data = _load_json(filename)
    if not isinstance(data, dict):
        raise TypeError(f"{filename} must contain a JSON object")
    return cast(dict[str, Any], data)


def _load_policy_overrides() -> dict[str, dict[str, Any]]:
    if not POLICY_OVERRIDES_PATH.exists():
        return {}
    try:
        raw = json.loads(POLICY_OVERRIDES_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    if not isinstance(raw, dict):
        return {}
    overrides: dict[str, dict[str, Any]] = {}
    for key, value in raw.items():
        policy_id = str(key)
        if isinstance(value, (bool, int, str)):
            overrides[policy_id] = {"enabled": value}
        elif isinstance(value, dict):
            clean = {field: item for field, item in value.items() if field in POLICY_EDITABLE_FIELDS}
            if "enabled" in clean:
                clean["enabled"] = bool(clean["enabled"])
            overrides[policy_id] = clean
    return overrides


def _save_policy_overrides(overrides: dict[str, dict[str, Any]]) -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = POLICY_OVERRIDES_PATH.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(overrides, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(POLICY_OVERRIDES_PATH)


def _load_policy_settings() -> dict[str, Any]:
    if not POLICY_SETTINGS_PATH.exists():
        return dict(DEFAULT_POLICY_SETTINGS)
    try:
        raw = json.loads(POLICY_SETTINGS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return dict(DEFAULT_POLICY_SETTINGS)
    if not isinstance(raw, dict):
        return dict(DEFAULT_POLICY_SETTINGS)
    settings = {**DEFAULT_POLICY_SETTINGS, **raw}
    settings["anomaly_review_threshold"] = _clamp_int(settings.get("anomaly_review_threshold"), 1, 100)
    settings["anomaly_reject_threshold"] = _clamp_int(settings.get("anomaly_reject_threshold"), 1, 100)
    if settings["anomaly_reject_threshold"] < settings["anomaly_review_threshold"]:
        settings["anomaly_reject_threshold"] = settings["anomaly_review_threshold"]
    settings["approval_sla_minutes"] = _clamp_int(settings.get("approval_sla_minutes"), 1, 24 * 60)
    settings["high_risk_auto_escalation"] = bool(settings.get("high_risk_auto_escalation", True))
    return settings


def _save_policy_settings(settings: dict[str, Any]) -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = POLICY_SETTINGS_PATH.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(settings, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(POLICY_SETTINGS_PATH)


def _clamp_int(value: Any, min_value: int, max_value: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = min_value
    return max(min_value, min(max_value, number))


def get_attack_surfaces() -> list[dict[str, Any]]:
    return deepcopy(_load_json_list("attack_surfaces.json"))


def get_student_competition_attack_map() -> list[dict[str, Any]]:
    return deepcopy(_load_json_list("student_competition_attack_map.json"))


def _enrich_policy(policy: dict[str, Any], impacts: dict[str, Any]) -> dict[str, Any]:
    return {**policy, **impacts.get(policy["id"], {})}


def get_policies() -> list[dict[str, Any]]:
    policies = _load_json_list("policies.json")
    impacts = _load_json_dict("policy_impact.json")
    overrides = _load_policy_overrides()
    enriched = []
    for policy in policies:
        override = overrides.get(policy["id"], {})
        merged = {**policy, **override}
        merged["enabled"] = bool(merged.get("enabled", policy["enabled"]))
        enriched.append(_enrich_policy(merged, impacts))
    return enriched


def get_scenarios() -> list[dict[str, Any]]:
    return deepcopy(_load_json_list("scenarios.json"))


def set_policy_enabled(policy_id: str, enabled: bool) -> dict[str, Any]:
    return update_policy(policy_id, {"enabled": enabled}, operator="security-admin", comment="策略启停")


def update_policy(
    policy_id: str,
    updates: dict[str, Any],
    *,
    operator: str = "security-admin",
    comment: str = "",
) -> dict[str, Any]:
    policies = _load_json_list("policies.json")
    overrides = _load_policy_overrides()
    for policy in policies:
        if policy["id"] == policy_id:
            before = next(item for item in get_policies() if item["id"] == policy_id)
            current_override = overrides.get(policy_id, {})
            clean_updates = {key: value for key, value in updates.items() if key in POLICY_EDITABLE_FIELDS}
            if "enabled" in clean_updates:
                clean_updates["enabled"] = bool(clean_updates["enabled"])
            if "risk_controls" in clean_updates and not isinstance(clean_updates["risk_controls"], list):
                clean_updates.pop("risk_controls")
            overrides[policy_id] = {**current_override, **clean_updates}
            _save_policy_overrides(overrides)
            impacts = _load_json_dict("policy_impact.json")
            after = _enrich_policy({**policy, **overrides[policy_id]}, impacts)
            record_policy_version(
                policy_id=policy_id,
                before=before,
                after=after,
                operator=operator,
                comment=comment or "策略配置更新",
            )
            return after
    raise KeyError(f"Policy not found: {policy_id}")


def is_policy_enabled(policy_id: str) -> bool:
    policies = _load_json_list("policies.json")
    overrides = _load_policy_overrides()
    for policy in policies:
        if policy["id"] == policy_id:
            return bool(overrides.get(policy_id, {}).get("enabled", policy["enabled"]))
    return False


def get_policy_settings() -> dict[str, Any]:
    return _load_policy_settings()


def update_policy_settings(updates: dict[str, Any]) -> dict[str, Any]:
    before = _load_policy_settings()
    settings = {**before, **{key: value for key, value in updates.items() if key in DEFAULT_POLICY_SETTINGS}}
    settings["anomaly_review_threshold"] = _clamp_int(settings.get("anomaly_review_threshold"), 1, 100)
    settings["anomaly_reject_threshold"] = _clamp_int(settings.get("anomaly_reject_threshold"), 1, 100)
    if settings["anomaly_reject_threshold"] < settings["anomaly_review_threshold"]:
        settings["anomaly_reject_threshold"] = settings["anomaly_review_threshold"]
    settings["approval_sla_minutes"] = _clamp_int(settings.get("approval_sla_minutes"), 1, 24 * 60)
    settings["high_risk_auto_escalation"] = bool(settings.get("high_risk_auto_escalation", True))
    _save_policy_settings(settings)
    record_policy_version(
        policy_id="__runtime_settings__",
        before=before,
        after=settings,
        operator=str(updates.get("operator", "security-admin")),
        comment=str(updates.get("comment", "运行阈值更新")),
    )
    return settings


def find_scenario(scenario_id: str) -> dict[str, Any]:
    scenarios = _load_json_list("scenarios.json")
    for scenario in scenarios:
        if scenario["id"] == scenario_id:
            return deepcopy(scenario)
    raise KeyError(f"Scenario not found: {scenario_id}")
