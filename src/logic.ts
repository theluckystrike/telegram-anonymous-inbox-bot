/** Pure helpers: real-sender guard + deep-link source attribution. */

/** Telegram's pseudo-user id for "sent by a group's anonymous admin". */
export const GROUP_ANON_ID = 1087968824;
/** Other pseudo-senders: @Channel_Bot (posts made on behalf of a linked channel in
 * its discussion group) and 777000 (Telegram's own service notifications). */
const PSEUDO_IDS = new Set([GROUP_ANON_ID, 136817688, 777000]);

/** True for a message worth treating as a real person: not an anonymous-admin or
 * channel pseudo-user, and not a message relayed via another bot's inline result. */
export function isRealSender(fromId: number | undefined, viaBot: unknown): boolean {
  return fromId !== undefined && !PSEUDO_IDS.has(fromId) && !viaBot;
}

/** Deep-link `/start` payloads we attribute as an acquisition source, e.g. "site", "x". */
export const SOURCE_RE = /^[a-z]{2,12}$/;
export const isSourcePayload = (payload: string): boolean => SOURCE_RE.test(payload);

/** Ready-to-paste 2-line text for /story: a hook line plus the owner's personal link,
 * short enough to drop straight into a bio or story caption. */
export function storyText(personalLink: string): string {
  return `Send me anonymous messages 👇\n${personalLink}`;
}

// Code-point aware (never cuts a surrogate pair in half, unlike a raw .slice()) —
// same approach as split's truncateForUrl (split/src/parse.ts).
const truncate = (s: string, max: number): string => {
  const c = Array.from(s);
  return c.length <= max ? s : c.slice(0, max - 1).join("") + "…";
};

/** Shrinks `s` via a bounded, code-point-aware binary search until `wrap(candidate)`
 * URL-encodes to at most `maxEncoded` chars, or `s` is empty. Never cuts a surrogate
 * pair in half. */
function shrinkToFit(s: string, wrap: (candidate: string) => string, maxEncoded: number): string {
  if (encodeURIComponent(wrap(s)).length <= maxEncoded) return s;
  const chars = Array.from(s);
  let lo = 0, hi = chars.length;
  for (let i = 0; i < 20 && lo < hi; i++) {
    const mid = Math.ceil((lo + hi) / 2);
    const cand = mid >= chars.length ? s : mid === 0 ? "" : chars.slice(0, mid - 1).join("") + "…";
    if (encodeURIComponent(wrap(cand)).length <= maxEncoded) lo = mid; else hi = mid - 1;
  }
  return lo >= chars.length ? s : lo === 0 ? "" : chars.slice(0, lo - 1).join("") + "…";
}

/** Builds the ready-to-forward "answered publicly" card: the anonymous question, the
 * owner's answer, and their personal link. The question is capped at 300 code points and
 * the answer at 500; if the card would still exceed 1000 chars once URL-encoded (the limit
 * a t.me/share/url `text` param must fit) — which a non-Latin question can reach on its own,
 * since encodeURIComponent can expand a character 3-6x — the answer is shrunk first via a
 * bounded binary search, and if that alone isn't enough (answer already empty) the question
 * is shrunk the same way, so the card always fits a share link and never throws on a cut
 * that would otherwise land inside an emoji or other surrogate pair. */
export function publicCard(question: string, name: string, answer: string, link: string): string {
  const build = (q: string, a: string): string => `❓ Anonymous asked:\n${q}\n\n💬 ${name}:\n${a}\n\n— ask me anonymously: ${link}`;
  const q0 = truncate(question, 300);
  const a0 = truncate(answer, 500);
  if (encodeURIComponent(build(q0, a0)).length <= 1000) return build(q0, a0);
  const a1 = shrinkToFit(a0, (cand) => build(q0, cand), 1000);
  if (encodeURIComponent(build(q0, a1)).length <= 1000) return build(q0, a1);
  const q1 = shrinkToFit(q0, (cand) => build(cand, a1), 1000);
  return build(q1, a1);
}
