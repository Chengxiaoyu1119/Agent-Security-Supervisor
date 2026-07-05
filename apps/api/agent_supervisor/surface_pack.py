"""Compatibility wrapper for moved module `agent_supervisor.surface_pack`."""

import sys

from .domains.reports import surface_pack as _impl
from .domains.reports.surface_pack import *  # noqa: F401,F403

sys.modules[__name__] = _impl
