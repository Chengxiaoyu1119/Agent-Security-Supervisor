"""Compatibility wrapper for moved module `agent_supervisor.external_agent_demo`."""

import sys

from .adapters.integrations import external_agent_demo as _impl
from .adapters.integrations.external_agent_demo import *  # noqa: F401,F403

sys.modules[__name__] = _impl
