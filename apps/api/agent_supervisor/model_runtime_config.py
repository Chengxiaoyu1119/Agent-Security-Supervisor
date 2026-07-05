"""Compatibility wrapper for moved module `agent_supervisor.model_runtime_config`."""

import sys

from .adapters.models import model_runtime_config as _impl
from .adapters.models.model_runtime_config import *  # noqa: F401,F403

sys.modules[__name__] = _impl
