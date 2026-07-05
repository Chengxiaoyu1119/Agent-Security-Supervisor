"""Compatibility wrapper for moved module `agent_supervisor.correlation`."""

import sys

from .domains.governance import correlation as _impl
from .domains.governance.correlation import *  # noqa: F401,F403

sys.modules[__name__] = _impl
