import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGuestResult } from "../src/guest.ts";
import { buildGuestGroupReply, buildGuestReply } from "../src/guestReply.ts";
import { langOf, t } from "../src/i18n.ts";

const BOT = "AnonInboxProBot";
const GENERIC = "Anonymous messages, right inside Telegram.";
const PERSONALIZED = "Your anonymous inbox is live.\nhttps://t.me/AnonInboxProBot?start=u42";
const LINK = "https://t.me/AnonInboxProBot?start=u42";

test("unknown sender gets the generic pitch, no parse_mode, both default buttons in a group", () => {
  const r = buildGuestReply(BOT, null, PERSONALIZED, GENERIC);
  assert.equal(r.text, GENERIC);
  assert.ok(r.title.length > 0);
  const res = buildGuestResult(r, BOT, "supergroup");
  assert.equal("parse_mode" in res.input_message_content, false);
  assert.equal(res.reply_markup?.inline_keyboard.length, 2);
});

test("a sender who already has an inbox gets their own link back, not the generic pitch", () => {
  const r = buildGuestReply(BOT, LINK, PERSONALIZED, GENERIC);
  assert.equal(r.text, PERSONALIZED);
  assert.notEqual(r.text, GENERIC);
  assert.match(r.description ?? "", /AnonInboxProBot\?start=u42/);
});

test("only Open in a private chat (no group to add to)", () => {
  const r = buildGuestReply(BOT, null, PERSONALIZED, GENERIC);
  const res = buildGuestResult(r, BOT, "private");
  assert.equal(res.reply_markup?.inline_keyboard.length, 1);
});

test("group reply never carries a personal link, even when the summoner is a known owner", () => {
  const groupPitch = "AnonInbox — anyone in this group can get their own anonymous inbox.";
  const r = buildGuestGroupReply(BOT, groupPitch);
  assert.equal(r.text, groupPitch);
  assert.notEqual(r.text, PERSONALIZED);
  assert.ok(!r.text.includes("https://t.me/AnonInboxProBot?start=u"));
  assert.ok(!(r.description ?? "").includes("start=u"));
});

test("guestGroupPitch is translated in all 11 languages and distinct from the DM start copy", () => {
  const LANGS = ["en", "ru", "es", "pt", "id", "de", "tr", "uk", "fa", "ar", "hi"];
  for (const lang of LANGS) {
    const groupPitch = t(lang, "guestGroupPitch");
    assert.ok(groupPitch.length > 0, `${lang}: guestGroupPitch is empty`);
    assert.notEqual(groupPitch, "guestGroupPitch", `${lang}: fell through to the raw key`);
    const startCopy = t(lang, "start", { link: "https://t.me/AnonInboxProBot?start=u42" });
    assert.notEqual(groupPitch, startCopy, `${lang}: group pitch reuses DM start copy`);
  }
  assert.equal(langOf("xx"), "en");
});
