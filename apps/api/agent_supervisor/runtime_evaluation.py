"""Compatibility wrapper for moved module `agent_supervisor.runtime_evaluation`."""

import sys

from .domains.runtime import runtime_evaluation as _impl
from .domains.runtime.runtime_evaluation import *  # noqa: F401,F403

sys.modules[__name__] = _impl
