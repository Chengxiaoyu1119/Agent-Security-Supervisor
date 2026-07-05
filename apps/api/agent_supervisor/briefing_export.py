"""Compatibility wrapper for moved module `agent_supervisor.briefing_export`."""

import sys

from .domains.reports import briefing_export as _impl
from .domains.reports.briefing_export import *  # noqa: F401,F403

sys.modules[__name__] = _impl
