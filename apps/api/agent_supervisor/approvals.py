"""Compatibility wrapper for moved module `agent_supervisor.approvals`."""

import sys

from .domains.governance import approvals as _impl
from .domains.governance.approvals import *  # noqa: F401,F403

sys.modules[__name__] = _impl
