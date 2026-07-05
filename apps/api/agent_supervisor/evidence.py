"""Compatibility wrapper for moved module `agent_supervisor.evidence`."""

import sys

from .domains.evaluations import evidence as _impl
from .domains.evaluations.evidence import *  # noqa: F401,F403

sys.modules[__name__] = _impl
