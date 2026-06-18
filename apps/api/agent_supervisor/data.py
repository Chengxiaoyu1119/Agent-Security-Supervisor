from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

CONFIG_DIR = Path(__file__).parent / "config"

def _load_json(filename: str) -> list | dict:
    with open(CONFIG_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_json(filename: str, data: list | dict) -> None:
    with open(CONFIG_DIR / filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_attack_surfaces() -> list[dict]:
    return deepcopy(_load_json("attack_surfaces.json"))

def get_student_competition_attack_map() -> list[dict]:
    return deepcopy(_load_json("student_competition_attack_map.json"))

def _enrich_policy(policy: dict, impacts: dict) -> dict:
    return {**policy, **impacts.get(policy["id"], {})}

def get_policies() -> list[dict]:
    policies = _load_json("policies.json")
    impacts = _load_json("policy_impact.json")
    return [_enrich_policy(p, impacts) for p in policies]

def get_scenarios() -> list[dict]:
    return deepcopy(_load_json("scenarios.json"))

def set_policy_enabled(policy_id: str, enabled: bool) -> dict:
    policies = _load_json("policies.json")
    for policy in policies:
        if policy["id"] == policy_id:
            policy["enabled"] = enabled
            _save_json("policies.json", policies)
            impacts = _load_json("policy_impact.json")
            return _enrich_policy(policy, impacts)
    raise KeyError(f"Policy not found: {policy_id}")

def is_policy_enabled(policy_id: str) -> bool:
    policies = _load_json("policies.json")
    for policy in policies:
        if policy["id"] == policy_id:
            return policy["enabled"]
    return False

def find_scenario(scenario_id: str) -> dict:
    scenarios = _load_json("scenarios.json")
    for scenario in scenarios:
        if scenario["id"] == scenario_id:
            return deepcopy(scenario)
    raise KeyError(f"Scenario not found: {scenario_id}")
