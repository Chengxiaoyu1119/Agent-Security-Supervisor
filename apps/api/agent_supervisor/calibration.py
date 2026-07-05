"""Compatibility wrapper for moved module `agent_supervisor.calibration`."""

import sys

from .domains.evaluations import calibration as _impl
from .domains.evaluations.calibration import *  # noqa: F401,F403

sys.modules[__name__] = _impl
