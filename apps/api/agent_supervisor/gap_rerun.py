"""Compatibility wrapper for moved module `agent_supervisor.gap_rerun`."""

import sys

from .domains.evaluations import gap_rerun as _impl
from .domains.evaluations.gap_rerun import *  # noqa: F401,F403

sys.modules[__name__] = _impl
