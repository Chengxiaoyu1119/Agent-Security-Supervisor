"""Deprecated one-off migration script.

This file is intentionally kept as a non-mutating placeholder because earlier
versions contained local absolute paths and file-overwrite operations. Router
splitting has already been completed in backend.zhian.routers.
"""

from __future__ import annotations


def main() -> None:
    print("split_main.py is deprecated; backend routers are already split.")


if __name__ == "__main__":
    main()
