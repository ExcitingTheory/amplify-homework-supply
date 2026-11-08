"""Protocol fixture only; deliberately does not pretend to run Stanza."""
import json
import sys
import time

chunks = 0
for line in sys.stdin:
    message = json.loads(line)
    if message["type"] == "start":
        print(json.dumps({"type": "ready", "version": "stanza-wordfreq-v1"}), flush=True)
    elif message["type"] == "chunk":
        if "CRASH" in message["text"]:
            sys.exit(2)
        if "HANG" in message["text"]:
            time.sleep(20)
        if "MALFORMED" in message["text"]:
            print("not-json", flush=True)
            continue
        chunks += 1
        print(json.dumps({"type": "chunk", "index": chunks}), flush=True)
    elif message["type"] == "finish":
        print(json.dumps({
            "type": "result", "version": "stanza-wordfreq-v1",
            "chunks": chunks, "candidates": [],
        }), flush=True)
