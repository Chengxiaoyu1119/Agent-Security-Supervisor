from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any, cast

from .paths import RUNTIME_DIR

CONFIG_DIR = Path(__file__).parent / "config"
POLICY_OVERRIDES_PATH = RUNTIME_DIR / "policy_overrides.json"


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


def _load_policy_overrides() -> dict[str, bool]:
    if not POLICY_OVERRIDES_PATH.exists():
        return {}
    try:
        raw = json.loads(POLICY_OVERRIDES_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    if not isinstance(raw, dict):
        return {}
    return {str(key): bool(value) for key, value in raw.items()}


def _save_policy_overrides(overrides: dict[str, bool]) -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = POLICY_OVERRIDES_PATH.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(overrides, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(POLICY_OVERRIDES_PATH)


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
    return [_enrich_policy({**policy, "enabled": overrides.get(policy["id"], policy["enabled"])}, impacts) for policy in policies]


def get_scenarios() -> list[dict[str, Any]]:
    return deepcopy(_load_json_list("scenarios.json"))


def set_policy_enabled(policy_id: str, enabled: bool) -> dict[str, Any]:
    policies = _load_json_list("policies.json")
    overrides = _load_policy_overrides()
    for policy in policies:
        if policy["id"] == policy_id:
            overrides[policy_id] = enabled
            _save_policy_overrides(overrides)
            impacts = _load_json_dict("policy_impact.json")
            return _enrich_policy({**policy, "enabled": enabled}, impacts)
    raise KeyError(f"Policy not found: {policy_id}")


def is_policy_enabled(policy_id: str) -> bool:
    policies = _load_json_list("policies.json")
    overrides = _load_policy_overrides()
    for policy in policies:
        if policy["id"] == policy_id:
            return overrides.get(policy_id, policy["enabled"])
    return False


def find_scenario(scenario_id: str) -> dict[str, Any]:
    scenarios = _load_json_list("scenarios.json")
    for scenario in scenarios:
        if scenario["id"] == scenario_id:
            return deepcopy(scenario)
    raise KeyError(f"Scenario not found: {scenario_id}")
