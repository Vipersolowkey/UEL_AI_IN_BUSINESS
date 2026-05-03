"""Quick manual checks for guest-app concierge (JSON endpoint). Run: python backend/scripts/test_concierge_chat.py"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:8000/api/v1/guest-app/concierge-chat"
BOOKING = "ORT-2026-0003"


def ask(message: str, history: list) -> dict:
    body = json.dumps(
        {"booking_ref": BOOKING, "message": message, "history": history},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> int:
    history: list = []
    questions = [
        "What time is checkout for my stay?",
        "Tôi muốn dọn phòng sau 14h, có được không?",
        "I need two extra bath towels please.",
        "Roughly what will my total bill be — room plus extras?",
    ]
    lines: list[str] = []
    for q in questions:
        try:
            out = ask(q, history)
        except urllib.error.HTTPError as e:
            lines.append(f"Q: {q}\nHTTP {e.code} {e.read().decode('utf-8', errors='replace')}\n---\n")
            Path(__file__).with_name("test_concierge_last_run.txt").write_text("\n".join(lines), encoding="utf-8")
            return 1
        except OSError as e:
            Path(__file__).with_name("test_concierge_last_run.txt").write_text(f"Backend unreachable: {e}", encoding="utf-8")
            return 1
        reply = out.get("reply", "")
        model = out.get("model_used", "")
        block = f"Q: {q}\nmodel: {model}\nA: {reply}\n---\n"
        lines.append(block)
        history.append({"role": "user", "content": q})
        history.append({"role": "assistant", "content": reply})
    out_path = Path(__file__).with_name("test_concierge_last_run.txt")
    out_path.write_text("\n".join(lines), encoding="utf-8")
    # Also print ASCII-safe summary to console
    print(f"Wrote {len(questions)} Q/A blocks to {out_path}")
    for i, q in enumerate(questions, 1):
        print(f"  {i}. Q len={len(q)} -> ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
