"""Compatibility wrapper for moved module `agent_supervisor.events`."""

import sys

from .domains.runtime import events as _impl
from .domains.runtime.events import *  # noqa: F401,F403

sys.modules[__name__] = _impl
