"""Compatibility wrapper for moved module `agent_supervisor.memory_governance`."""

import sys

from .domains.runtime import memory_governance as _impl
from .domains.runtime.memory_governance import *  # noqa: F401,F403

sys.modules[__name__] = _impl
