from __future__ import annotations

import json
import queue
import threading
from datetime import datetime, timezone
from typing import Any, Generator
from uuid import uuid4

SUBSCRIBERS: set[queue.Queue[dict[str, Any]]] = set()
SUBSCRIBERS_LOCK = threading.Lock()


def publish_runtime_event(event_type: str, payload: dict[str, Any]) -> None:
    event = {
        "id": str(uuid4()),
        "type": event_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }
    with SUBSCRIBERS_LOCK:
        subscribers = list(SUBSCRIBERS)
    for subscriber in subscribers:
        try:
            subscriber.put_nowait(event)
        except queue.Full:
            continue


def stream_runtime_events() -> Generator[str, None, None]:
    subscriber: queue.Queue[dict[str, Any]] = queue.Queue(maxsize=200)
    with SUBSCRIBERS_LOCK:
        SUBSCRIBERS.add(subscriber)
    try:
        yield "retry: 1500\n\n"
        while True:
            try:
                event = subscriber.get(timeout=15)
                payload = json.dumps(event, ensure_ascii=False)
                yield f"id: {event['id']}\nevent: {event['type']}\ndata: {payload}\n\n"
            except queue.Empty:
                yield ": keepalive\n\n"
    finally:
        with SUBSCRIBERS_LOCK:
            SUBSCRIBERS.discard(subscriber)
