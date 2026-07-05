"""Compatibility wrapper for moved module `agent_supervisor.integrity`."""

import sys

from .domains.governance import integrity as _impl
from .domains.governance.integrity import *  # noqa: F401,F403

sys.modules[__name__] = _impl
