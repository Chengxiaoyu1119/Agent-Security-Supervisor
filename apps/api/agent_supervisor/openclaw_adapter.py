"""Compatibility wrapper for moved module `agent_supervisor.openclaw_adapter`."""

import sys

from .adapters.integrations import openclaw_adapter as _impl
from .adapters.integrations.openclaw_adapter import *  # noqa: F401,F403

sys.modules[__name__] = _impl
