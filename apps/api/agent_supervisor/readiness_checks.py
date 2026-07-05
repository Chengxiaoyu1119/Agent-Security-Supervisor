"""Compatibility wrapper for moved module `agent_supervisor.readiness_checks`."""

import sys

from .domains.reports import readiness_checks as _impl
from .domains.reports.readiness_checks import *  # noqa: F401,F403

sys.modules[__name__] = _impl
