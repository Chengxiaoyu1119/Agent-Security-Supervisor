"""Compatibility wrapper for moved module `agent_supervisor.main_models`."""

import sys

from .schemas import main_models as _impl
from .schemas.main_models import *  # noqa: F401,F403

sys.modules[__name__] = _impl
