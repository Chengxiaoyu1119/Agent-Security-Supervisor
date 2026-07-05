"""Compatibility wrapper for moved module `agent_supervisor.benign_cases_group1`."""

import sys

from .domains.evaluations import benign_cases_group1 as _impl
from .domains.evaluations.benign_cases_group1 import *  # noqa: F401,F403

sys.modules[__name__] = _impl
