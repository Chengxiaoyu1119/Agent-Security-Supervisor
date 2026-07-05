"""Compatibility wrapper for moved module `agent_supervisor.ablation`."""

import sys

from .domains.evaluations import ablation as _impl
from .domains.evaluations.ablation import *  # noqa: F401,F403

sys.modules[__name__] = _impl
