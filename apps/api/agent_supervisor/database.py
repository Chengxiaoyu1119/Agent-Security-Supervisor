"""Compatibility wrapper for moved module `agent_supervisor.database`."""

import sys

from .storage import database as _impl
from .storage.database import *  # noqa: F401,F403

sys.modules[__name__] = _impl
