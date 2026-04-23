"""Shared knowledge-base markdown reader.

All KB files are YAML-frontmatter markdown. This module normalizes reading
them so build_deck.py and any future scripts share one parser.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


@dataclass
class KBDoc:
    path: Path
    frontmatter: dict
    body: str

    def section(self, heading: str) -> str:
        """Return text under a `## heading` until the next `## ` or EOF."""
        pattern = re.compile(
            rf"^##\s+{re.escape(heading)}\s*$(.*?)(?=^##\s+|\Z)",
            re.MULTILINE | re.DOTALL,
        )
        m = pattern.search(self.body)
        return m.group(1).strip() if m else ""


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    raw, body = m.group(1), m.group(2)
    fm = {}
    for line in raw.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, body


def load(kb_path: str | Path) -> KBDoc:
    p = Path(kb_path)
    text = p.read_text(encoding="utf-8")
    fm, body = _parse_frontmatter(text)
    return KBDoc(path=p, frontmatter=fm, body=body)


def kb_root(skill_dir: Path) -> Path:
    """Resolve knowledge-base/ given the skill directory.

    Skill lives at <repo>/.claude/skills/sales-deck, so KB is three parents up.
    """
    return skill_dir.parent.parent.parent / "knowledge-base"


if __name__ == "__main__":
    import sys

    skill_dir = Path(__file__).resolve().parent.parent
    kb = kb_root(skill_dir)
    print(f"KB root: {kb}")
    for md in sorted(kb.rglob("*.md")):
        try:
            doc = load(md)
            print(f"  {md.relative_to(kb)}  fm-keys={list(doc.frontmatter)}  body={len(doc.body)}ch")
        except Exception as e:  # noqa: BLE001
            print(f"  {md.relative_to(kb)}  ERROR: {e}", file=sys.stderr)
