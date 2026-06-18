"""Deprecated one-off migration script.

This file is intentionally kept as a non-mutating placeholder because earlier
versions contained local absolute paths and file-overwrite operations. Router
splitting has already been completed in apps.api.agent_supervisor.routers.
"""

from __future__ import annotations


def main() -> None:
    print("split_main.py is deprecated; API routers are already split.")


if __name__ == "__main__":
    main()
