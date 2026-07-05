"""Compatibility wrapper for moved module `agent_supervisor.tools`."""

import sys

from .domains.runtime import tools as _impl
from .domains.runtime.tools import *  # noqa: F401,F403

sys.modules[__name__] = _impl
