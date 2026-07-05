"""Compatibility wrapper for moved module `agent_supervisor.benign_workflows`."""

import sys

from .domains.evaluations import benign_workflows as _impl
from .domains.evaluations.benign_workflows import *  # noqa: F401,F403

sys.modules[__name__] = _impl
