"""
SafeSpace AI - Telegram Drill Bot
----------------------------------
Sends harmless, simulated "scam" messages to whoever chats with the bot.
The user picks whether they think it's a scam:

  - Correctly flags it  -> bot congratulates them, explains the red flags.
  - Falls for it (taps the trap button) -> bot reveals it was a drill and
    sends them a link back into the SafeSpace app to review what they missed.

No real personal data is ever requested or stored. Every "scam" is fake and
clearly revealed as a drill in the bot's own replies.

Setup:
  1. pip install -r requirements.txt
  2. Copy .env.example to .env and fill in BOT_TOKEN (from @BotFather)
     and APP_URL.
  3. python drill_bot.py
"""

import json
import logging
import os
import random
import sys
from pathlib import Path

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

# ---------------------------------------------------------------------------
# CONFIG - loaded from environment / .env (never hardcode your token)
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv  # optional: pip install python-dotenv

    load_dotenv()
except ImportError:
    pass

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
APP_URL = os.getenv("APP_URL", "https://your-safespace-link.example.com")

STATS_FILE = Path(__file__).with_name("stats.json")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
# python-telegram-bot's HTTP layer is noisy at INFO
logging.getLogger("httpx").setLevel(logging.WARNING)
log = logging.getLogger("drill_bot")

# ---------------------------------------------------------------------------
# Persistent stats: {user_id: {"name", "safe", "scammed", "streak", "best_streak"}}
# ---------------------------------------------------------------------------


def load_stats() -> dict:
    if STATS_FILE.exists():
        try:
            return json.loads(STATS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            log.warning("Could not read %s, starting fresh", STATS_FILE)
    return {}


def save_stats() -> None:
    try:
        STATS_FILE.write_text(
            json.dumps(stats, indent=2, ensure_ascii=False), encoding="utf-8"
        )
    except OSError:
        log.exception("Could not save stats")


stats: dict = load_stats()


def get_entry(user) -> dict:
    entry = stats.setdefault(
        str(user.id),
        {"name": user.first_name, "safe": 0, "scammed": 0, "streak": 0, "best_streak": 0},
    )
    entry["name"] = user.first_name  # keep name fresh if they change it
    return entry


# ---------------------------------------------------------------------------
# Drill scenarios - all fictional, all clearly revealed afterward
# ---------------------------------------------------------------------------
SCENARIOS = [
    {
        "text": (
            "⚠️ BANK SECURITY ALERT\n\n"
            "We've detected unusual activity on your account. "
            "Your card will be frozen in 10 minutes unless you verify your "
            "PIN and OTP now."
        ),
        "reason": (
            "Real banks NEVER ask for your PIN or one-time password. "
            "The countdown is a pressure tactic to stop you from thinking it through."
        ),
    },
    {
        "text": (
            "🎉 CONGRATULATIONS!\n\n"
            "You've been selected to win a $500 gift card! "
            "Claim it in the next 60 minutes before it expires."
        ),
        "reason": (
            "You can't win a contest you never entered. Urgency + "
            "unexpected prize is a classic lottery scam pattern."
        ),
    },
    {
        "text": (
            "📱 Hey it's Mum, I lost my phone so this is a new number. "
            "I need you to send some money for an emergency right now, "
            "I can't talk on the phone."
        ),
        "reason": (
            "Impersonation scams rely on you not double-checking. Always "
            "call the person back on their known number before sending anything."
        ),
    },
    {
        "text": (
            "📦 DELIVERY FAILED\n\n"
            "Your package couldn't be delivered. Pay a $2.99 customs fee "
            "within 24 hours to reschedule, or it will be returned."
        ),
        "reason": (
            "Small 'fees' on fake delivery links are designed to feel too "
            "minor to question, while quietly harvesting your card details."
        ),
    },
    {
        "text": (
            "💻 TECH SUPPORT\n\n"
            "This is Microsoft Security. We've detected a virus on your "
            "device. Call this number immediately or your files will be deleted."
        ),
        "reason": (
            "Microsoft never contacts users directly like this. Unsolicited "
            "'tech support' calls or messages are almost always a scam."
        ),
    },
    {
        "text": (
            "💼 JOB OFFER\n\n"
            "Hi! We saw your profile and want to offer you a part-time role: "
            "$300/day for simple 'like and subscribe' tasks. Just pay a $30 "
            "registration deposit to activate your account."
        ),
        "reason": (
            "Legitimate employers pay YOU — they never ask for a deposit. "
            "Easy money for trivial tasks is the hook of task/job scams."
        ),
    },
    {
        "text": (
            "🪙 CRYPTO GIVEAWAY\n\n"
            "Elon is giving back to the community! Send 0.1 BTC to this "
            "wallet and receive 0.5 BTC back instantly. Limited slots!"
        ),
        "reason": (
            "Nobody doubles your money for free. 'Send crypto, get more back' "
            "is always a scam — transactions are irreversible."
        ),
    },
    {
        "text": (
            "🔐 ACCOUNT VERIFICATION\n\n"
            "Your Telegram account will be suspended due to policy violations. "
            "Verify your identity here: telegram-verify-support.com/login"
        ),
        "reason": (
            "Look at the link — that's not telegram.org. Fake 'official' "
            "warnings with lookalike URLs are phishing for your login."
        ),
    },
]

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Welcome to SafeSpace Drill Mode!\n\n"
        "I'll send you fake (harmless) scam messages so you can practice "
        "spotting them. Nothing here is real, and I never ask for real "
        "personal info.\n\n"
        "Commands:\n"
        "/drill - get a random scam drill\n"
        "/stats - see your safe vs scammed count\n"
        "/leaderboard - see who's sharpest\n"
        "/help - how it works"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🛡 How Drill Mode works:\n\n"
        "1. Send /drill and I'll show you a message that LOOKS like a scam "
        "someone might really receive.\n"
        "2. Decide: flag it as a scam, or trust it.\n"
        "3. Either way, I'll explain the red flags so you learn the pattern.\n\n"
        "Everything is simulated. No real links, no real payments, no real "
        "data collected — just practice."
    )


async def drill(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Cycle through scenarios without repeats until the user has seen them all
    seen = context.user_data.setdefault("seen", [])
    remaining = [i for i in range(len(SCENARIOS)) if i not in seen]
    if not remaining:
        seen.clear()
        remaining = list(range(len(SCENARIOS)))
    idx = random.choice(remaining)
    seen.append(idx)

    # Scenario index rides along in the callback data, so answers always
    # match the message they belong to (even with multiple drills open).
    keyboard = InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("🚩 This is a scam", callback_data=f"report:{idx}")],
            [InlineKeyboardButton("✅ Trust it / tap here", callback_data=f"fall:{idx}")],
        ]
    )
    await update.message.reply_text(SCENARIOS[idx]["text"], reply_markup=keyboard)


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    try:
        action, idx_str = query.data.split(":")
        reason = SCENARIOS[int(idx_str)]["reason"]
    except (ValueError, IndexError):
        await query.edit_message_text("⚠️ This drill expired — send /drill for a new one.")
        return

    entry = get_entry(query.from_user)

    if action == "report":
        entry["safe"] += 1
        entry["streak"] += 1
        entry["best_streak"] = max(entry["best_streak"], entry["streak"])
        await query.edit_message_text(
            f"{query.message.text}\n\n"
            f"✅ CORRECT — this was a drill.\n{reason}\n\n"
            f"🔥 Safe streak: {entry['streak']}"
            + (f" (best: {entry['best_streak']})" if entry["best_streak"] > entry["streak"] else "")
        )
    else:  # "fall"
        entry["scammed"] += 1
        entry["streak"] = 0
        await query.edit_message_text(
            f"{query.message.text}\n\n"
            f"⚠️ This was a SIMULATED scam — not real, nothing was sent "
            f"anywhere. Here's what gave it away:\n{reason}"
        )
        await query.message.reply_text(
            "Tap below to review this drill in the SafeSpace app:",
            reply_markup=InlineKeyboardMarkup(
                [[InlineKeyboardButton("Open SafeSpace to review", url=APP_URL)]]
            ),
        )

    save_stats()


async def stats_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    entry = stats.get(str(update.effective_user.id))
    if not entry:
        await update.message.reply_text("No drills yet — send /drill to start!")
        return
    total = entry["safe"] + entry["scammed"]
    accuracy = round(100 * entry["safe"] / total) if total else 0
    await update.message.reply_text(
        f"📊 Your drill record:\n"
        f"✅ Safe: {entry['safe']}\n"
        f"⚠️ Scammed: {entry['scammed']}\n"
        f"🎯 Accuracy: {accuracy}%\n"
        f"🔥 Best streak: {entry['best_streak']}"
    )


async def leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not stats:
        await update.message.reply_text("No drills run yet. Try /drill first!")
        return

    fame = sorted(stats.values(), key=lambda e: e["safe"], reverse=True)[:5]
    shame = sorted(stats.values(), key=lambda e: e["scammed"], reverse=True)[:5]

    fame_lines = "\n".join(
        f"{i + 1}. {e['name']} — {e['safe']} safe" for i, e in enumerate(fame)
    )
    shame_lines = "\n".join(
        f"{i + 1}. {e['name']} — {e['scammed']} scammed" for i, e in enumerate(shame)
    )

    await update.message.reply_text(
        f"🏆 HALL OF FAME\n{fame_lines}\n\n💀 HALL OF SHAME\n{shame_lines}"
    )


async def on_error(update: object, context: ContextTypes.DEFAULT_TYPE):
    log.error("Update caused an error", exc_info=context.error)


def main():
    if not BOT_TOKEN:
        sys.exit(
            "BOT_TOKEN is not set.\n"
            "Copy .env.example to .env and paste the token from @BotFather, "
            "or run:  BOT_TOKEN=123:abc python drill_bot.py"
        )

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("drill", drill))
    app.add_handler(CommandHandler("stats", stats_cmd))
    app.add_handler(CommandHandler("leaderboard", leaderboard))
    app.add_handler(CallbackQueryHandler(button))
    app.add_error_handler(on_error)

    log.info("SafeSpace Drill Bot is running — press Ctrl+C to stop")
    app.run_polling()


if __name__ == "__main__":
    main()
