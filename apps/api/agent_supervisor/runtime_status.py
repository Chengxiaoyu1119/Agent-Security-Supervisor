"""Compatibility wrapper for moved module `agent_supervisor.runtime_status`."""

import sys

from .domains.runtime import runtime_status as _impl
from .domains.runtime.runtime_status import *  # noqa: F401,F403

sys.modules[__name__] = _impl
