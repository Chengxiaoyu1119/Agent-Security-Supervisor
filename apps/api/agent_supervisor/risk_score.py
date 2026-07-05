"""Compatibility wrapper for moved module `agent_supervisor.risk_score`."""

import sys

from .domains.governance import risk_score as _impl
from .domains.governance.risk_score import *  # noqa: F401,F403

sys.modules[__name__] = _impl
