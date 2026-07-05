"""Compatibility wrapper for moved module `agent_supervisor.target_lab`."""

import sys

from .domains.attacks import target_lab as _impl
from .domains.attacks.target_lab import *  # noqa: F401,F403

sys.modules[__name__] = _impl
