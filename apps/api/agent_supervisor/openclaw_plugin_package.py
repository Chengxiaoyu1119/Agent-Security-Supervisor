"""Compatibility wrapper for moved module `agent_supervisor.openclaw_plugin_package`."""

import sys

from .adapters.integrations import openclaw_plugin_package as _impl
from .adapters.integrations.openclaw_plugin_package import *  # noqa: F401,F403

sys.modules[__name__] = _impl
