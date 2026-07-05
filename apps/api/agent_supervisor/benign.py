"""Compatibility wrapper for moved module `agent_supervisor.benign`."""

import sys

from .domains.evaluations import benign as _impl
from .domains.evaluations.benign import *  # noqa: F401,F403

sys.modules[__name__] = _impl
