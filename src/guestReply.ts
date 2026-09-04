/** Pure Guest Mode reply builder for AnonInbox. No I/O, no cross-dir imports beyond
 * guest.ts (dependency-free), so this runs under plain `node --test`.
 *
 * Every guest reply is the localized pitch — but AnonInbox's whole product is a personal
 * link, so when the summoning sender already has an inbox (a `users` row from a real
 * /start) the reply includes THEIR link instead of the generic pitch. The lookup that
 * decides which branch fires is read-only and lives in index.ts; this function only
 * turns `knownLink` into the right GuestReply, so both branches are unit-testable here.
 */
import type { GuestReply } from "./guest.ts";

export function buildGuestReply(botUsername: string, knownLink: string | null, personalizedTextPlain: string, genericTextPlain: string): GuestReply {
  if (knownLink) {
    return { title: "📮 Your AnonInbox link", description: knownLink, text: personalizedTextPlain };
  }
  return {
    title: "📮 AnonInbox — anonymous messages, right inside Telegram",
    description: "Open @" + botUsername + " to get your own link",
    text: genericTextPlain,
  };
}

/** Group/supergroup variant: the reply is visible to a whole room, not the summoner
 * alone, so it must never carry a personal inbox link or DM-framed copy ("Messages land
 * right here" is false in a group — they land in the owner's private chat). Always the
 * generic, localized what-this-does pitch, regardless of whether the summoner has an
 * inbox of their own. */
export function buildGuestGroupReply(botUsername: string, groupPitchTextPlain: string): GuestReply {
  return {
    title: "📮 AnonInbox — anonymous messages, right inside Telegram",
    description: "Open @" + botUsername + " to get your own link",
    text: groupPitchTextPlain,
  };
}
