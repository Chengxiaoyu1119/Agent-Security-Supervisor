"""Compatibility wrapper for moved module `agent_supervisor.openclaw_plugin_templates`."""

import sys

from .adapters.integrations import openclaw_plugin_templates as _impl
from .adapters.integrations.openclaw_plugin_templates import *  # noqa: F401,F403

sys.modules[__name__] = _impl
