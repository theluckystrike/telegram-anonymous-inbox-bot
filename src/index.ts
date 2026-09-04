import { Bot, Context, InlineKeyboard } from "grammy";
import { Env as KitEnv, PRO_STARS, ProSpec, displayName, isPrivate, makeFetch, preparedShare, proButton, sendInvoice } from "./kit.ts";
import { Store } from "./db.ts";
import { APP_HTML, buildShareText, validateInitData } from "./webapp.ts";
import { isRealSender, isSourcePayload, publicCard, storyText } from "./logic.ts";
import { langOf, t } from "./i18n.ts";
export { Store };

const MORE_TEXT = "More free tools by the same maker:\n🔒 @WhisperLockBot — locked messages only one person can open\n⏰ @NudgeRemindBot — reminders that arrive on time\n📮 @AnonInboxProBot — anonymous inbox via your link\n🧾 @SplitTabsBot — split group expenses\n🔥 @HabitStreakProBot — habit streaks with daily check-ins";
const BOT = "AnonInboxProBot";
const FREE_REPLIES = 3;
const MAX_LEN = 1000;
interface Env extends KitEnv { STORE: DurableObjectNamespace<Store>; }
const store = (env: Env) => env.STORE.get(env.STORE.idFromName("main"));
const link = (uid: number) => `https://t.me/${BOT}?start=u${uid}`;
const SHARE_TEXT = "Get anonymous messages from anyone, right inside Telegram.";
const shareUrl = () => `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${BOT}?start=share`)}&text=${encodeURIComponent(SHARE_TEXT)}`;
const shareLinkUrl = (uid: number) => `https://t.me/share/url?url=${encodeURIComponent(link(uid))}&text=${encodeURIComponent("Send me an anonymous message:")}`;
/** t.me/share/url pre-filled with a public-answer card as the text and the owner's
 * personal link as the url; used for both the "Share" and "Post to channel/group"
 * buttons since anon registers no inline mode (no switch_inline_query target). */
const cardShareUrl = (card: string, uid: number) => `https://t.me/share/url?url=${encodeURIComponent(link(uid))}&text=${encodeURIComponent(card)}`;
const proDeepLink = () => `https://t.me/${BOT}?start=pro`;

/** Telegram Star invoices can only be sent in a private chat with the bot. Anon is
 * private-only by nature (onText already gates on isPrivate), but /pro's own paths
 * (command, "pro" callback, /start pro) were not gated, so a tap in a group where
 * this bot was ever added would silently fail. */
async function sendProInGroup(ctx: Context, lang: string | undefined): Promise<void> {
  await ctx.reply("Pro purchases happen in a private chat.", { reply_markup: new InlineKeyboard().url(t(lang, "btn_openAnonPrivate"), proDeepLink()) });
}

const PRO: ProSpec = {
  title: "AnonInbox Pro",
  description: "Sender hints on every message (name initial, sent time, has username) and unlimited replies. One-time payment.",
  payload: "anon-pro",
  thanks: "✅ Pro unlocked: sender hints and unlimited replies. Thank you.\n\n/more — more free tools",
};

function ownerCard(uid: number, lang: string | undefined): { text: string; kb: InlineKeyboard } {
  const text = t(lang, "start", { link: link(uid) });
  // No switchInline button here: this bot registers no inline_query handler, so
  // Telegram's inline picker would open and spin forever. The URL button below
  // covers the same "share my link" job and actually works.
  const kb = new InlineKeyboard()
    .url(t(lang, "btn_shareMyLink"), shareLinkUrl(uid)).row()
    .url(t(lang, "btn_shareBot"), shareUrl()).row().text(t(lang, "btn_unlockPro"), "pro");
  return { text, kb };
}

/** Sends the owner card (the /start "activation screen": link + share button). Shared
 * by /start's no-args path, /link, the session-less onText fallback, and "Get your own
 * inbox" — one function, so the card is never built or sent two different ways. */
async function sendOwnerCard(ctx: Context, uid: number, lang: string | undefined): Promise<void> {
  const c = ownerCard(uid, lang);
  await ctx.reply(c.text, { parse_mode: "Markdown", reply_markup: c.kb });
}

async function onStart(ctx: Context, env: Env): Promise<void> {
  if (!ctx.from) return;
  const from = ctx.from;
  const lang = langOf(from.language_code);
  await store(env).touchUser(from.id, from.username, displayName(from));
  const arg = String(ctx.match ?? "");
  if (arg === "pro") { if (!isPrivate(ctx)) { await sendProInGroup(ctx, lang); return; } await sendInvoice(ctx, PRO); return; }
  const m = arg.match(/^u(\d{5,15})$/);
  if (m && Number(m[1]) !== from.id) {
    const owner = await store(env).getUser(Number(m[1]));
    if (!owner) { await ctx.reply("That link is not active."); return; }
    await store(env).linkOpen(owner.id, from.id);
    await store(env).setSession(from.id, "send", owner.id);
    await ctx.reply(t(lang, "writeMessagePrompt", { name: owner.name }));
    return;
  }
  if (isSourcePayload(arg)) await store(env).addSource(from.id, arg);
  await sendOwnerCard(ctx, from.id, lang);
}

const MAX_PER_HOUR = 20;

async function deliverAnon(ctx: Context, env: Env, fromId: number, ownerId: number, body: string): Promise<void> {
  const lang = langOf(ctx.from?.language_code);
  if (await store(env).isBlocked(ownerId, fromId)) { await store(env).clearSession(fromId); await ctx.reply("✅ Sent anonymously."); return; } // silent drop: blocked senders learn nothing
  if ((await store(env).sentLastHour(fromId)) >= MAX_PER_HOUR) { await ctx.reply(t(lang, "rateLimited", { n: MAX_PER_HOUR })); return; }
  await store(env).track(fromId, "action");
  const id = await store(env).addMessage(ownerId, fromId, body);
  const kb = new InlineKeyboard().text("↩️ Reply", `rp:${id}`).text("🔍 Hint", `hint:${id}`).text("🚫 Block", `blk:${id}`)
    .row().text("📣 Answer publicly", `pub:${id}`);
  // Plain text: body is user-provided and must never go through parse_mode.
  await ctx.api.sendMessage(ownerId, `📨 Anonymous message\n\n${body}`, { reply_markup: kb });
  await store(env).clearSession(fromId);
  const kb2 = new InlineKeyboard().text("Send another", `again:${ownerId}`).row().text("Get your own inbox", "mine");
  await ctx.reply("✅ Sent anonymously.", { reply_markup: kb2 });
}

async function deliverReply(ctx: Context, env: Env, fromId: number, msgId: number, body: string): Promise<void> {
  const lang = langOf(ctx.from?.language_code);
  const m = await store(env).getMessage(msgId);
  if (!m || m.owner_id !== fromId) { await ctx.reply("That message is gone."); return; }
  const owner = await store(env).getUser(m.owner_id);
  if (!owner?.pro && (await store(env).repliesToday(m.owner_id)) >= FREE_REPLIES) {
    await ctx.reply(t(lang, "replyLimited", { n: FREE_REPLIES }), { reply_markup: proButton() });
    return;
  }
  await store(env).markReplied(msgId);
  await store(env).clearSession(fromId);
  await ctx.api.sendMessage(m.sender_id, `↩️ ${owner?.name ?? "They"} replied to your anonymous message:\n\n${body}`, { reply_markup: new InlineKeyboard().text("Send another", `again:${m.owner_id}`) });
  await ctx.reply("✅ Reply sent.");
}

/** Owner has chosen to answer a delivered message publicly (the NGL-style loop): store
 * the answer, then hand the owner a ready-to-forward card plus two share buttons — the
 * card carries no sender identity, only the question, the owner's answer, and their link. */
async function deliverPublic(ctx: Context, env: Env, fromId: number, msgId: number, answer: string): Promise<void> {
  const m = await store(env).getMessage(msgId);
  await store(env).clearSession(fromId);
  if (!m || m.owner_id !== fromId) { await ctx.reply("That message is gone."); return; }
  const owner = await store(env).getUser(fromId);
  await store(env).setAnswer(msgId, answer);
  const card = publicCard(m.body, owner?.name ?? "Me", answer, link(fromId));
  const url = cardShareUrl(card, fromId);
  const kb = new InlineKeyboard().url("📤 Share", url).row().url("Post to channel/group", url);
  await ctx.reply(card, { reply_markup: kb });
}

async function onText(ctx: Context, env: Env): Promise<void> {
  if (!isPrivate(ctx) || !ctx.from || ctx.message?.via_bot) return;
  const from = ctx.from;
  const lang = langOf(from.language_code);
  const text = (ctx.message?.text ?? "").trim();
  await store(env).touchUser(from.id, from.username, displayName(from));
  const s = await store(env).getSession(from.id);
  if (!s) { await sendOwnerCard(ctx, from.id, lang); return; }
  if (text.length > MAX_LEN) { await ctx.reply(t(lang, "tooLong", { len: text.length, max: MAX_LEN })); return; }
  if (s.kind === "send") await deliverAnon(ctx, env, from.id, s.target, text);
  else if (s.kind === "pub") await deliverPublic(ctx, env, from.id, s.target, text);
  else await deliverReply(ctx, env, from.id, s.target, text);
}

async function onHint(ctx: Context, env: Env, id: number): Promise<void> {
  if (!ctx.from) return;
  const fromId = ctx.from.id;
  const lang = langOf(ctx.from.language_code);
  const m = await store(env).getMessage(id);
  const me = await store(env).getUser(fromId);
  if (!m || m.owner_id !== fromId) { await ctx.answerCallbackQuery({ text: "Message not found." }); return; }
  if (!me?.pro) { await store(env).track(fromId, "pro_prompt"); await ctx.answerCallbackQuery({ text: `Hints are a Pro feature (one-time ${PRO_STARS} ⭐). Tap Unlock Pro.`, show_alert: true }); await ctx.reply("Unlock sender hints:", { reply_markup: proButton(t(lang, "btn_unlockProStars", { stars: PRO_STARS })) }); return; }
  const s = await store(env).getUser(m.sender_id);
  const initial = (s?.name ?? "?").replace(/^@/, "").charAt(0).toUpperCase();
  const sentAt = new Date(m.created * 1000).toISOString().slice(11, 16);
  await ctx.answerCallbackQuery({ text: `🔍 Hint\nName starts with: ${initial}\nHas username: ${s?.username ? "yes" : "no"}\nSent: ${sentAt} UTC\nMessages from them to you: ${await countFrom(env, m)}`, show_alert: true });
}
const countFrom = (env: Env, m: { owner_id: number; sender_id: number }): Promise<number> => store(env).countFrom(m.owner_id, m.sender_id);

function buildBot(env: Env): Bot {
  const bot = new Bot(env.BOT_TOKEN);
  // Real-sender guard: only real messages (never channel posts), never the anonymous-admin
  // pseudo-user, never a message relayed via another bot's inline result.
  const m = bot.on("message").filter((ctx) => isRealSender(ctx.from.id, ctx.message.via_bot));
  m.command("more", (ctx) => ctx.reply(MORE_TEXT));
  m.command("start", async (ctx) => { await store(env).track(ctx.from.id, "start"); await onStart(ctx, env); });
  // /link is BotFather's advertised alias for "show my inbox link" — same owner-card
  // handler /start uses when it has no deep-link args, just entered a different way.
  m.command(["link", "inbox"], (ctx) => sendOwnerCard(ctx, ctx.from.id, langOf(ctx.from.language_code)));
  // Full command reference, distinct from the owner card: /start stays a short
  // activation screen (link + one button), /help lists every command that exists.
  m.command("help", (ctx) => ctx.reply(t(langOf(ctx.from.language_code), "help", { proStars: PRO_STARS }), { parse_mode: "Markdown" }));
  // Plain text: ready to paste straight into a bio or story caption, no formatting to strip.
  m.command("story", (ctx) => ctx.reply(storyText(link(ctx.from.id))));
  // 5 rotating prompts an owner can paste alongside their link, to drive opens.
  m.command("prompts", (ctx) => ctx.reply(t(langOf(ctx.from.language_code), "prompts")));
  // Reimplemented rather than kit.ts's wirePro: its successful_payment handler sends
  // spec.thanks verbatim with no hook to localize it, and kit.ts is not ours to edit.
  bot.command("pro", async (ctx) => { if (!isPrivate(ctx)) { await sendProInGroup(ctx, langOf(ctx.from?.language_code)); return; } await sendInvoice(ctx, PRO, PRO.payload, (s) => store(env).track(ctx.from!.id, s)); });
  bot.callbackQuery("pro", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!isPrivate(ctx)) { await sendProInGroup(ctx, langOf(ctx.from?.language_code)); return; }
    await sendInvoice(ctx, PRO, PRO.payload, (s) => store(env).track(ctx.from!.id, s));
  });
  bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));
  bot.on("message:successful_payment", async (ctx) => {
    const sp = ctx.message.successful_payment;
    await store(env).setPro(ctx.from!.id, sp.telegram_payment_charge_id);
    await store(env).track(ctx.from!.id, "paid");
    await ctx.reply(t(langOf(ctx.from?.language_code), "proThanks"));
  });
  bot.callbackQuery(/^rp:(\d+)$/, async (ctx) => {
    await store(env).setSession(ctx.from.id, "reply", Number(ctx.match[1]));
    await ctx.answerCallbackQuery(); await ctx.reply("✍️ Write your reply. The sender stays anonymous to you; you are shown by name to them.");
  });
  bot.callbackQuery(/^hint:(\d+)$/, (ctx) => onHint(ctx, env, Number(ctx.match[1])));
  bot.callbackQuery(/^pub:(\d+)$/, async (ctx) => {
    const msg = await store(env).getMessage(Number(ctx.match[1]));
    if (!msg || msg.owner_id !== ctx.from.id) { await ctx.answerCallbackQuery({ text: "Message not found." }); return; }
    await store(env).setSession(ctx.from.id, "pub", msg.id);
    await ctx.answerCallbackQuery();
    await ctx.reply("✍️ Write your public answer. It will be turned into a shareable card with the question, your answer, and your link — no sender identity.");
  });
  bot.callbackQuery(/^blk:(\d+)$/, async (ctx) => {
    const msg = await store(env).getMessage(Number(ctx.match[1]));
    if (!msg || msg.owner_id !== ctx.from.id) { await ctx.answerCallbackQuery({ text: "Message not found." }); return; }
    await store(env).block(msg.owner_id, msg.sender_id);
    await ctx.answerCallbackQuery({ text: "🚫 Blocked. Their future messages are dropped silently.", show_alert: true });
  });
  bot.callbackQuery(/^again:(\d+)$/, async (ctx) => {
    await store(env).setSession(ctx.from.id, "send", Number(ctx.match[1]));
    await ctx.answerCallbackQuery(); await ctx.reply("✍️ Write your next anonymous message.");
  });
  bot.callbackQuery("mine", async (ctx) => { await ctx.answerCallbackQuery(); await sendOwnerCard(ctx, ctx.from.id, langOf(ctx.from.language_code)); });
  bot.on("message:text", (ctx) => onText(ctx, env));
  return bot;
}

async function api(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json({ error: "Open this page from Telegram." }, { status: 401 });
  const u = await store(env).touchUser(user.id, user.username, displayName(user));
  const messages = await store(env).inbox(u.id);
  return Response.json({ link: link(u.id), pro: u.pro, total: await store(env).inboxCount(u.id), opens: await store(env).ownerOpens(u.id), messages });
}
/** POST /api/share: registers a Bot API "prepared" inline message (savePreparedInlineMessage)
 * so the Mini App can hand its id to tg.shareMessage(id) for a native chat/group/channel share. */
async function apiShare(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json({ error: "Open this page from Telegram." }, { status: 401 });
  try {
    const share = await preparedShare(env, user.id, buildShareText(SHARE_TEXT, BOT, "shared"), `https://t.me/${BOT}`);
    await store(env).recordShare(user.id, "chat");
    return Response.json(share);
  } catch { return Response.json({ error: "Share unavailable." }, { status: 502 }); }
}

/** POST /api/share-story: records a "share to story" click. Telegram gives no server
 * callback for tg.shareToStory, so the client fires this right before calling it. */
async function apiShareStory(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json({ error: "Open this page from Telegram." }, { status: 401 });
  await store(env).recordShare(user.id, "story");
  return Response.json({ ok: true });
}

const botFetch = makeFetch<Env>(buildBot, (env) => store(env).stats());
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (path === "/app") return new Response(APP_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (path === "/api/share" && req.method === "POST") return apiShare(req, env);
    if (path === "/api/share-story" && req.method === "POST") return apiShareStory(req, env);
    if (path === "/api/inbox" && req.method === "POST") return api(req, env);
    return botFetch(req, env);
  },
};
