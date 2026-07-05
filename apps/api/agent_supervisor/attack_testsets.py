"""Compatibility wrapper for moved module `agent_supervisor.attack_testsets`."""

import sys

from .domains.attacks import attack_testsets as _impl
from .domains.attacks.attack_testsets import *  # noqa: F401,F403

sys.modules[__name__] = _impl
