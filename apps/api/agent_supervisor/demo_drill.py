"""Compatibility wrapper for moved module `agent_supervisor.demo_drill`."""

import sys

from .domains.evaluations import demo_drill as _impl
from .domains.evaluations.demo_drill import *  # noqa: F401,F403

sys.modules[__name__] = _impl
