"""Compatibility wrapper for moved module `agent_supervisor.attack_lab`."""

import sys

from .domains.attacks import attack_lab as _impl
from .domains.attacks.attack_lab import *  # noqa: F401,F403

sys.modules[__name__] = _impl
