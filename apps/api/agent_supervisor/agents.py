"""Compatibility wrapper for moved module `agent_supervisor.agents`."""

import sys

from .domains.attacks import agents as _impl
from .domains.attacks.agents import *  # noqa: F401,F403

sys.modules[__name__] = _impl
