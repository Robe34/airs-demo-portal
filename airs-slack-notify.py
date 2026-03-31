#!/usr/bin/env python3.12
"""
AIRS Release Notes → Slack Notifier

Scrapes the 4 live Prisma AIRS "Features Introduced" pages, extracts the
most recent features per pillar, diffs against the last posted state (hash),
shows a preview, and posts a rich Slack message on confirmation.

Usage:
  python3.12 airs-slack-notify.py           # diff check + preview + confirm
  python3.12 airs-slack-notify.py --force   # skip diff, always post
"""

import re
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")
STATE_FILE = Path(__file__).parent / "airs-docs-pdfs" / ".last-seen.json"

PILLARS = [
    {
        "name": "AI Runtime Firewall",
        "emoji": "🔥",
        "url": "https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/features-introduced/ai-runtime-security-network-intercept",
    },
    {
        "name": "AI Runtime API",
        "emoji": "🔌",
        "url": "https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/features-introduced/ai-runtime-security-api-intercept",
    },
    {
        "name": "AI Model Security",
        "emoji": "🛡️",
        "url": "https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/features-introduced/ai-model-security",
    },
    {
        "name": "AI Red Teaming",
        "emoji": "🎯",
        "url": "https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/features-introduced/ai-red-teaming",
    },
]

FEATURES_INDEX_URL = "https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/features-introduced"


# ── Scraping ───────────────────────────────────────────────────────────────────

def fetch_page(url: str) -> BeautifulSoup:
    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def parse_features(soup: BeautifulSoup) -> list[dict]:
    """Extract all feature entries from a pillar page, sorted newest first."""
    features = []
    for div in soup.select('div.topic.concept[id^="concept-"], div[id^="concept-"]'):
        title_el = div.select_one("h2.title")
        date_el = div.select_one("tt.ph.tt, tt")
        if not title_el:
            continue

        title = title_el.get_text(strip=True)
        date_str = date_el.get_text(strip=True) if date_el else ""

        # Description: first 2 sentences from the section body
        desc_parts = []
        section = div.select_one("section.section, div.body")
        if section:
            for p in section.select("div.p, p"):
                t = " ".join(p.get_text().split())  # collapse all whitespace
                if t and len(t) > 20:
                    desc_parts.append(t)
                    break  # first meaningful paragraph only

        features.append({
            "title": title,
            "date": date_str,
            "desc": desc_parts[0] if desc_parts else "",
            "sort_key": parse_date_key(date_str),
        })

    # Sort newest first
    features.sort(key=lambda f: f["sort_key"], reverse=True)
    return features


def parse_date_key(date_str: str) -> tuple:
    """Convert 'March 2026' → (2026, 3) for sorting."""
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }
    parts = date_str.lower().split()
    try:
        month = months.get(parts[0], 0)
        year = int(parts[1]) if len(parts) > 1 else 0
        return (year, month)
    except (IndexError, ValueError):
        return (0, 0)


def first_two_sentences(text: str) -> str:
    """Return the first 2 complete sentences from a block of text."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return " ".join(sentences[:2])


def get_latest_date(features: list[dict]) -> str:
    """Return the date of the most recent feature."""
    return features[0]["date"] if features else "Unknown"


def get_recent_features(features: list[dict], max_count: int = 5) -> list[dict]:
    """Return the top N most recent features across all release dates."""
    return features[:max_count]


# ── State / diffing ────────────────────────────────────────────────────────────

def compute_hash(data: dict) -> str:
    serialized = json.dumps(data, sort_keys=True)
    return hashlib.sha256(serialized.encode()).hexdigest()


def load_last_seen() -> dict:
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {}


def save_last_seen(hash_val: str):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump({
            "hash": hash_val,
            "posted_at": datetime.now(timezone.utc).isoformat(),
        }, f, indent=2)


# ── Slack ──────────────────────────────────────────────────────────────────────

def build_slack_blocks(pillar_data: list[dict], scraped_at: str) -> list:
    blocks = []

    # Header
    blocks.append({
        "type": "header",
        "text": {"type": "plain_text", "text": "Prisma AIRS — Latest Release Notes"}
    })

    blocks.append({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": f"Review the Prisma AIRS release notes to learn about all the new features across 4 pillars.\n*Scraped:* {scraped_at}"
        }
    })

    blocks.append({"type": "divider"})

    for pillar in pillar_data:
        if not pillar["features"]:
            continue

        latest_date = get_latest_date(pillar["features"])
        recent = get_recent_features(pillar["features"])

        # Pillar header
        bullets = ""
        for f in recent:
            summary = first_two_sentences(f["desc"]) if f["desc"] else ""
            desc = f" — {summary}" if summary else ""
            date_tag = f" `{f['date']}`" if f["date"] else ""
            bullets += f"• *{f['title']}*{date_tag}{desc}\n"

        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"{pillar['emoji']} *{pillar['name']}* — {latest_date}\n"
                    f"<{pillar['url']}|View full release notes>\n\n"
                    f"{bullets.strip()}"
                )
            }
        })

        blocks.append({"type": "divider"})

    # Footer
    blocks.append({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": (
                f"📄 <{FEATURES_INDEX_URL}|View all Prisma AIRS Features Introduced>\n"
                f"🐛 <https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/known-issues|Known Issues>\n"
                f"✅ <https://docs.paloaltonetworks.com/ai-runtime-security/release-notes/addressed-issues|Addressed Issues>"
            )
        }
    })

    return blocks


def post_to_slack(blocks: list):
    if not SLACK_WEBHOOK_URL:
        raise ValueError("SLACK_WEBHOOK_URL not set in .env")
    resp = requests.post(SLACK_WEBHOOK_URL, json={"blocks": blocks}, timeout=10)
    if resp.status_code != 200:
        raise RuntimeError(f"Slack returned {resp.status_code}: {resp.text}")


# ── Preview ────────────────────────────────────────────────────────────────────

def print_preview(pillar_data: list[dict]):
    print("\n" + "=" * 65)
    print("PREVIEW — What will be posted to Slack:")
    print("=" * 65)
    for pillar in pillar_data:
        if not pillar["features"]:
            print(f"\n{pillar['emoji']} {pillar['name']}: (no features found)")
            continue
        latest_date = get_latest_date(pillar["features"])
        recent = get_recent_features(pillar["features"])
        print(f"\n{pillar['emoji']} {pillar['name']} — {latest_date}")
        for f in recent:
            summary = first_two_sentences(f["desc"]) if f["desc"] else ""
            date_tag = f" [{f['date']}]" if f["date"] else ""
            print(f"   • {f['title']}{date_tag}")
            if summary:
                print(f"     {summary}")
    print("\n" + "=" * 65 + "\n")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    force = "--force" in sys.argv
    yes = "--yes" in sys.argv

    print("Fetching Prisma AIRS release notes from docs.paloaltonetworks.com...")

    pillar_data = []
    all_features_combined = {}

    for pillar in PILLARS:
        print(f"  {pillar['emoji']} {pillar['name']}...", end=" ", flush=True)
        try:
            soup = fetch_page(pillar["url"])
            features = parse_features(soup)
            print(f"{len(features)} features found, latest: {get_latest_date(features)}")
            pillar_data.append({**pillar, "features": features})
            all_features_combined[pillar["name"]] = [
                {"title": f["title"], "date": f["date"]} for f in features[:10]
            ]
        except Exception as e:
            print(f"ERROR: {e}")
            pillar_data.append({**pillar, "features": []})

    # Diff check
    current_hash = compute_hash(all_features_combined)
    last_seen = load_last_seen()

    if not force and last_seen.get("hash") == current_hash:
        print("\nNo new features detected since last post.")
        print("Use --force to post anyway.")
        sys.exit(0)

    if last_seen.get("hash"):
        print("\nChanges detected since last post!")
    else:
        print("\nNo previous state — treating as new.")

    # Preview
    scraped_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    print_preview(pillar_data)

    # Confirm (skip if --yes or running non-interactively)
    if not yes:
        answer = input("Post this to Slack? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted. Nothing was posted.")
            sys.exit(0)

    # Post
    print("Posting to Slack...")
    blocks = build_slack_blocks(pillar_data, scraped_at)
    post_to_slack(blocks)
    print("Posted successfully!")

    save_last_seen(current_hash)
    print(f"State saved to {STATE_FILE}")


if __name__ == "__main__":
    main()
