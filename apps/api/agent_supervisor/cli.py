"""Compatibility wrapper for moved module `agent_supervisor.cli`."""

import sys

from .commands import cli as _impl
from .commands.cli import *  # noqa: F401,F403

sys.modules[__name__] = _impl
