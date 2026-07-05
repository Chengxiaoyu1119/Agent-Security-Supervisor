"""Compatibility wrapper for moved module `agent_supervisor.openai_proxy`."""

import sys

from .adapters.proxy import openai_proxy as _impl
from .adapters.proxy.openai_proxy import *  # noqa: F401,F403

sys.modules[__name__] = _impl
