"""Compatibility wrapper for moved module `agent_supervisor.data`."""

import sys

from .storage import data as _impl
from .storage.data import *  # noqa: F401,F403

_load_json, _load_json_dict, _load_json_list, _load_policy_overrides = (_impl._load_json, _impl._load_json_dict, _impl._load_json_list, _impl._load_policy_overrides)

sys.modules[__name__] = _impl
