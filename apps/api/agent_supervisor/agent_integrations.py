"""Compatibility wrapper for moved module `agent_supervisor.agent_integrations`."""

import sys

from .adapters.integrations import agent_integrations as _impl
from .adapters.integrations.agent_integrations import *  # noqa: F401,F403

sys.modules[__name__] = _impl
