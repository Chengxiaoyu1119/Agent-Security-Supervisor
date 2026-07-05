"""Compatibility wrapper for moved module `agent_supervisor.datasets`."""

import sys

from .domains.evaluations import datasets as _impl
from .domains.evaluations.datasets import *  # noqa: F401,F403

sys.modules[__name__] = _impl
