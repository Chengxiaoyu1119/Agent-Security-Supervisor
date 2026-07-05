"""Compatibility wrapper for moved module `agent_supervisor.model_adapter`."""

import sys

from .adapters.models import model_adapter as _impl
from .adapters.models.model_adapter import *  # noqa: F401,F403
from .adapters.models.model_adapter import _provider_priority as _provider_priority

sys.modules[__name__] = _impl
