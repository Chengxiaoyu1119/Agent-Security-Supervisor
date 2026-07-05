"""Compatibility wrapper for moved module `agent_supervisor.attack_chains`."""

import sys

from .domains.attacks import attack_chains as _impl
from .domains.attacks.attack_chains import *  # noqa: F401,F403

sys.modules[__name__] = _impl
