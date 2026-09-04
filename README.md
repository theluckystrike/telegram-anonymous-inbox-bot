# AnonInboxProBot — anonymous inbox bot for Telegram

**Try it:** [@AnonInboxProBot](https://t.me/AnonInboxProBot) · [tg.zovo.one/bots/anon/](https://tg.zovo.one/bots/anon/)

## What it does

AnonInboxProBot gives you a personal t.me link you can share anywhere. Anyone who opens it and sends a message reaches your Telegram inbox without either side seeing the other's identity. You reply through the bot's Reply button and it forwards your answer back anonymously. If a message gets abusive, Block silently stops that sender from reaching you again. Senders are capped at 1,000 characters and 20 messages per hour to limit abuse. Free tier: 3 replies a day. Pro adds unlimited replies and sender hints.

## Use it without adding the bot

Type `@AnonInboxProBot` in **any** Telegram chat, even one the bot has never been added to. It answers with a pitch card (and the sender's own inbox link, if we already know them) — anonymous inboxes need a real account, so this one's a pitch rather than a live answer.

Both **Inline Mode** and **Guest Chat Mode** need to be turned on for the bot in [@BotFather](https://t.me/BotFather) (Bot Settings → Mode Settings) — turn Inline Mode on first, then Guest Chat Mode. Without both, only the classic `@Bot query` inline surface works.

## Self-host

```bash
pnpm i
wrangler secret put BOT_TOKEN
wrangler secret put WEBHOOK_SECRET
wrangler deploy
curl -G "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://<your-worker>.workers.dev/webhook" \
  --data-urlencode "secret_token=$WEBHOOK_SECRET" \
  --data-urlencode 'allowed_updates=["message","callback_query","guest_message","inline_query","chosen_inline_result"]'
```

## Stack

[grammY](https://grammy.dev/) on Cloudflare Workers, state in a Durable Object backed by SQLite, Pro upgrades billed with Telegram Stars.

---
Part of Tiny Telegram Tools — https://tg.zovo.one/
