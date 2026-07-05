"""Compatibility wrapper for moved module `agent_supervisor.roadmap`."""

import sys

from .domains.reports import roadmap as _impl
from .domains.reports.roadmap import *  # noqa: F401,F403

sys.modules[__name__] = _impl
