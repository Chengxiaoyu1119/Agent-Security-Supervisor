"""Compatibility wrapper for moved module `agent_supervisor.anomaly`."""

import sys

from .domains.governance import anomaly as _impl
from .domains.governance.anomaly import *  # noqa: F401,F403

sys.modules[__name__] = _impl
