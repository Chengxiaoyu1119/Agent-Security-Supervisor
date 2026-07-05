"""Compatibility wrapper for moved module `agent_supervisor.readiness`."""

import sys

from .domains.reports import readiness as _impl
from .domains.reports.readiness import *  # noqa: F401,F403

sys.modules[__name__] = _impl
