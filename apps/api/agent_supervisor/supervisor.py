"""Compatibility wrapper for moved module `agent_supervisor.supervisor`."""

import sys

from .domains.governance import supervisor as _impl
from .domains.governance.supervisor import *  # noqa: F401,F403

sys.modules[__name__] = _impl
