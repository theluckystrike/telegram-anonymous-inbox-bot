# AnonInboxProBot — anonymous inbox bot for Telegram

**Try it:** [@AnonInboxProBot](https://t.me/AnonInboxProBot) · [tg.zovo.one/bots/anon/](https://tg.zovo.one/bots/anon/)

## What it does

AnonInboxProBot gives you a personal t.me link you can share anywhere. Anyone who opens it and sends a message reaches your Telegram inbox without either side seeing the other's identity. You reply through the bot's Reply button and it forwards your answer back anonymously. If a message gets abusive, Block silently stops that sender from reaching you again. Senders are capped at 1,000 characters and 20 messages per hour to limit abuse. Free tier: 3 replies a day. Pro adds unlimited replies and sender hints.

## Self-host

```bash
pnpm i
wrangler secret put BOT_TOKEN
wrangler secret put WEBHOOK_SECRET
wrangler deploy
curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://<your-worker>.workers.dev/webhook&secret_token=$WEBHOOK_SECRET"
```

## Stack

[grammY](https://grammy.dev/) on Cloudflare Workers, state in a Durable Object backed by SQLite, Pro upgrades billed with Telegram Stars.

---
Part of Tiny Telegram Tools — https://tg.zovo.one/
