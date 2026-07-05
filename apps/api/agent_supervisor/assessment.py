"""Compatibility wrapper for moved module `agent_supervisor.assessment`."""

import sys

from .domains.evaluations import assessment as _impl
from .domains.evaluations.assessment import *  # noqa: F401,F403

sys.modules[__name__] = _impl
