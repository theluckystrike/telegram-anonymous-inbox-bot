import { test } from "node:test";
import assert from "node:assert/strict";
import { GROUP_ANON_ID, isRealSender, isSourcePayload, publicCard, storyText } from "../src/logic.ts";

test("start arg regex", () => {
  const re = /^u(\d{5,15})$/;
  assert.equal("u8906429503".match(re)?.[1], "8906429503");
  assert.equal("pro".match(re), null);
  assert.equal("u12".match(re), null);
});
test("real-sender guard rejects anonymous admin and via_bot", () => {
  assert.equal(isRealSender(42, undefined), true);
  assert.equal(isRealSender(GROUP_ANON_ID, undefined), false);
  assert.equal(isRealSender(42, true), false);
  assert.equal(isRealSender(undefined, undefined), false);
});
test("source payload regex", () => {
  assert.equal(isSourcePayload("site"), true);
  assert.equal(isSourcePayload("list"), true);
  assert.equal(isSourcePayload("x"), false);
  assert.equal(isSourcePayload("toolongsourcename"), false);
  assert.equal(isSourcePayload("Site"), false);
  assert.equal(isSourcePayload("pro"), true); // caller must special-case "pro" before recording
});
test("source payload rejects deep-link owner-id payloads", () => {
  assert.equal(isSourcePayload("u8906429503"), false);
  assert.equal(isSourcePayload(""), false);
});
test("real-sender guard accepts a private-chat sender with no username", () => {
  assert.equal(isRealSender(123456789, undefined), true);
  assert.equal(isRealSender(1087968824, false), false);
});
test("real-sender guard also rejects channel-post and Telegram-service pseudo-users", () => {
  assert.equal(isRealSender(136817688, undefined), false); // @Channel_Bot
  assert.equal(isRealSender(777000, undefined), false); // Telegram service notifications
});
test("story text is two lines and carries the personal link", () => {
  const t = storyText("https://t.me/AnonInboxProBot?start=u42");
  const lines = t.split("\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[1], "https://t.me/AnonInboxProBot?start=u42");
});
test("publicCard includes the question, answerer name, answer, and link", () => {
  const c = publicCard("What is your favorite color?", "@ann", "Blue, obviously.", "https://t.me/AnonInboxProBot?start=u42");
  assert.match(c, /^❓ Anonymous asked:\nWhat is your favorite color\?\n\n💬 @ann:\nBlue, obviously\.\n\n— ask me anonymously: https:\/\/t\.me\/AnonInboxProBot\?start=u42$/);
});
test("publicCard truncates a long question to 300 chars", () => {
  const q = "x".repeat(400);
  const c = publicCard(q, "Ann", "ok", "https://t.me/x");
  const line = c.split("\n")[1];
  assert.ok(line.length <= 300, `question line is ${line.length} chars`);
  assert.ok(line.endsWith("…"));
});
test("publicCard truncates a long answer to 500 chars", () => {
  const a = "y".repeat(600);
  const c = publicCard("Q?", "Ann", a, "https://t.me/x");
  const lines = c.split("\n");
  const answerLine = lines[4];
  assert.ok(answerLine.length <= 500, `answer line is ${answerLine.length} chars`);
  assert.ok(answerLine.endsWith("…"));
});
test("publicCard keeps the url-encoded share text within 1000 chars even with a max-length question and answer", () => {
  const q = "q".repeat(300);
  const a = "a".repeat(500);
  const c = publicCard(q, "SomeoneWithALongName", a, "https://t.me/AnonInboxProBot?start=u123456789");
  assert.ok(encodeURIComponent(c).length <= 1000, `encoded length is ${encodeURIComponent(c).length}`);
  // Plain ASCII at the cap doesn't even need to shrink — the link is never sacrificed.
  assert.ok(c.includes(q));
  assert.ok(c.endsWith("https://t.me/AnonInboxProBot?start=u123456789"));
});
test("publicCard fits within 1000 encoded chars for short, everyday inputs", () => {
  const c = publicCard("Hi!", "Bob", "Hello there.", "https://t.me/AnonInboxProBot?start=u1");
  assert.ok(encodeURIComponent(c).length <= 1000);
});
test("publicCard never throws when a code-unit cut would land inside an emoji (surrogate pair)", () => {
  // "a".repeat(298) + 5 emoji: a naive UTF-16 slice(0, 299) lands mid-surrogate-pair.
  const q = "a".repeat(298) + "😀".repeat(5);
  assert.doesNotThrow(() => publicCard(q, "Ann", "ok", "https://t.me/AnonInboxProBot?start=u1"));
  const c = publicCard(q, "Ann", "ok", "https://t.me/AnonInboxProBot?start=u1");
  assert.ok(encodeURIComponent(c).length <= 1000);
  // Every truncated code point is intact — no lone (unpaired) surrogate anywhere in the card.
  const loneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
  assert.equal(loneSurrogate.test(c), false);
});
test("publicCard shrinks a long non-Latin question (not just the answer) to stay under the 1000-char encoded budget", () => {
  const q = "привет".repeat(50).slice(0, 300); // 300 Cyrillic chars, empty answer
  assert.equal(q.length, 300);
  const c = publicCard(q, "Ann", "", "https://t.me/AnonInboxProBot?start=u1");
  assert.ok(encodeURIComponent(c).length <= 1000, `encoded length is ${encodeURIComponent(c).length}`);
  assert.doesNotThrow(() => encodeURIComponent(c));
});
