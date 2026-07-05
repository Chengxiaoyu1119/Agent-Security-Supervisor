"""Compatibility wrapper for moved module `agent_supervisor.penetration_lab`."""

import sys

from .domains.attacks import penetration_lab as _impl
from .domains.attacks.penetration_lab import *  # noqa: F401,F403

sys.modules[__name__] = _impl
