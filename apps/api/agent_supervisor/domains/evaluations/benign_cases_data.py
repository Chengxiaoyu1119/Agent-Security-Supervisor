from __future__ import annotations

from typing import Any

from apps.api.agent_supervisor.domains.evaluations.benign_cases_group1 import BENIGN_CASE_GROUP_1
from apps.api.agent_supervisor.domains.evaluations.benign_cases_group2 import BENIGN_CASE_GROUP_2

BENIGN_CASES: list[dict[str, Any]] = [
    *BENIGN_CASE_GROUP_1,
    *BENIGN_CASE_GROUP_2,
]
