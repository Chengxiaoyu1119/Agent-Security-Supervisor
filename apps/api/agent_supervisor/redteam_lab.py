"""Compatibility wrapper for moved module `agent_supervisor.redteam_lab`."""

import sys

from .domains.attacks import redteam_lab as _impl
from .domains.attacks.redteam_lab import *  # noqa: F401,F403

sys.modules[__name__] = _impl
