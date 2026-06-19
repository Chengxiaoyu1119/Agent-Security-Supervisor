from __future__ import annotations

from typing import Any

from .benign_cases_group1 import BENIGN_CASE_GROUP_1
from .benign_cases_group2 import BENIGN_CASE_GROUP_2

BENIGN_CASES: list[dict[str, Any]] = [
    *BENIGN_CASE_GROUP_1,
    *BENIGN_CASE_GROUP_2,
]
