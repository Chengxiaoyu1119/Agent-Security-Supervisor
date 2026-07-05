"""Compatibility wrapper for moved module `agent_supervisor.proxy_security`."""

import sys

from .adapters.proxy import proxy_security as _impl
from .adapters.proxy.proxy_security import *  # noqa: F401,F403

sys.modules[__name__] = _impl
