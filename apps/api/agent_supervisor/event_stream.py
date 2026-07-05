"""Compatibility wrapper for moved module `agent_supervisor.event_stream`."""

import sys

from .domains.runtime import event_stream as _impl
from .domains.runtime.event_stream import *  # noqa: F401,F403

sys.modules[__name__] = _impl
