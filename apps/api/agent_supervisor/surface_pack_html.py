"""Compatibility wrapper for moved module `agent_supervisor.surface_pack_html`."""

import sys

from .domains.reports import surface_pack_html as _impl
from .domains.reports.surface_pack_html import *  # noqa: F401,F403

sys.modules[__name__] = _impl
