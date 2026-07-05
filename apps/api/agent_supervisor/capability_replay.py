"""Compatibility wrapper for moved module `agent_supervisor.capability_replay`."""

import sys

from .domains.attacks import capability_replay as _impl
from .domains.attacks.capability_replay import *  # noqa: F401,F403

sys.modules[__name__] = _impl
