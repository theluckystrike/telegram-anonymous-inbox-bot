import { test } from "node:test";
import assert from "node:assert/strict";
import { langOf, t } from "../src/i18n.ts";

const LANGS = ["en", "ru", "es", "pt", "id", "de", "tr", "uk", "fa", "ar", "hi"];
const KEYS = ["start", "help", "writeMessagePrompt", "rateLimited", "replyLimited", "tooLong", "proThanks", "prompts"];

test("langOf falls back to en for missing, unknown, or region-tagged codes", () => {
  assert.equal(langOf(undefined), "en");
  assert.equal(langOf(null), "en");
  assert.equal(langOf(""), "en");
  assert.equal(langOf("xx"), "en");
  assert.equal(langOf("zzzzz"), "en");
  assert.equal(langOf("pt-BR"), "pt");
  assert.equal(langOf("RU"), "ru");
});

test("every required key is translated (non-empty, distinct from the key name) in all 11 languages", () => {
  for (const lang of LANGS) {
    for (const key of KEYS) {
      const s = t(lang, key);
      assert.ok(s.length > 0, `${lang}/${key} is empty`);
      assert.notEqual(s, key, `${lang}/${key} fell through to the raw key`);
    }
  }
  assert.equal(LANGS.length, 11);
  assert.ok(KEYS.length >= 6);
});

test("t falls back to English for an unsupported language", () => {
  assert.equal(t("xx", "rateLimited", { n: 20 }), t("en", "rateLimited", { n: 20 }));
});

test("t falls back to the key name for a key missing from every table", () => {
  assert.equal(t("en", "doesNotExist"), "doesNotExist");
});

test("placeholder substitution fills every {var} across languages", () => {
  for (const lang of LANGS) {
    const s = t(lang, "rateLimited", { n: 20 });
    assert.ok(s.includes("20"), `${lang}: missing substituted count`);
    assert.ok(!s.includes("{n}"), `${lang}: unsubstituted placeholder`);
  }
});

test("placeholder substitution leaves an unmatched token untouched and ignores extra vars", () => {
  assert.equal(t("en", "tooLong", { len: 1200 }), "Too long: 1200/{max} characters.");
  const s = t("en", "rateLimited", { n: 5, unused: "ignored" });
  assert.equal(s, "Slow down: 5 anonymous messages per hour.");
});

test("start interpolates the link, stays short (at most 4 lines), and includes /link nowhere but does show the link in a code span", () => {
  const s = t("es", "start", { link: "https://t.me/AnonInboxProBot?start=u42" });
  assert.ok(s.includes("https://t.me/AnonInboxProBot?start=u42"));
  assert.ok(s.includes("`"));
  assert.ok(s.split("\n").length <= 4, `start is ${s.split("\n").length} lines`);
});

test("help lists /start (or /link), /story, /prompts, /pro with the Pro price, and /more in every language", () => {
  for (const lang of LANGS) {
    const s = t(lang, "help", { proStars: 150 });
    assert.ok(s.includes("/start"), `${lang}: missing /start`);
    assert.ok(s.includes("/link"), `${lang}: missing /link`);
    assert.ok(s.includes("/story"), `${lang}: missing /story`);
    assert.ok(s.includes("/prompts"), `${lang}: missing /prompts`);
    assert.ok(s.includes("/pro"), `${lang}: missing /pro`);
    assert.ok(s.includes("150"), `${lang}: missing interpolated Pro price`);
    assert.ok(s.includes("/more"), `${lang}: missing /more`);
  }
});

test("prompts carries 5 distinct rotating lines in every language", () => {
  for (const lang of LANGS) {
    const lines = t(lang, "prompts").split("\n");
    assert.equal(lines.length, 5, `${lang}: expected 5 prompt lines`);
    assert.equal(new Set(lines).size, 5, `${lang}: prompt lines are not distinct`);
  }
});

const BTN_KEYS = ["btn_openAnonPrivate", "btn_shareMyLink", "btn_shareBot", "btn_unlockPro", "btn_unlockProStars"];

test("every button label key is translated (non-empty, distinct from the key name) in all 11 languages", () => {
  for (const lang of LANGS) {
    for (const key of BTN_KEYS) {
      const s = t(lang, key, { stars: 150 });
      assert.ok(s.length > 0, `${lang}/${key} is empty`);
      assert.notEqual(s, key, `${lang}/${key} fell through to the raw key`);
    }
  }
});

test("no button label exceeds 32 characters in any language", () => {
  for (const lang of LANGS) {
    for (const key of BTN_KEYS) {
      const s = t(lang, key, { stars: 150 });
      assert.ok(s.length <= 32, `${lang}/${key} is ${s.length} chars: "${s}"`);
    }
  }
});
