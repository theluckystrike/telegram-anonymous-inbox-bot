import { BaseStore, FleetStats, now } from "./kit.ts";

export interface Msg { id: number; owner_id: number; sender_id: number; body: string; created: number; }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (user_id INTEGER PRIMARY KEY, kind TEXT NOT NULL, target INTEGER NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, sender_id INTEGER NOT NULL,
  body TEXT NOT NULL, created INTEGER NOT NULL, replied INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS msg_owner ON messages(owner_id, created);
CREATE TABLE IF NOT EXISTS link_opens (owner_id INTEGER NOT NULL, visitor_id INTEGER NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS blocks (owner_id INTEGER NOT NULL, sender_id INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (owner_id, sender_id));
CREATE TABLE IF NOT EXISTS sources (user_id INTEGER PRIMARY KEY, src TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS answers (msg_id INTEGER PRIMARY KEY, answer TEXT NOT NULL, ts INTEGER NOT NULL);`;

export class Store extends BaseStore {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) { super(ctx, env, SCHEMA); }

  async setSession(userId: number, kind: "send" | "reply" | "pub", target: number): Promise<void> {
    this.run("INSERT INTO sessions (user_id, kind, target, created) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(user_id) DO UPDATE SET kind = ?2, target = ?3, created = ?4",
      userId, kind, target, now());
  }
  async getSession(userId: number): Promise<{ kind: string; target: number } | null> {
    return this.one("SELECT kind, target FROM sessions WHERE user_id = ?1 AND created > ?2", userId, now() - 3600);
  }
  async clearSession(userId: number): Promise<void> { this.run("DELETE FROM sessions WHERE user_id = ?1", userId); }
  async linkOpen(ownerId: number, visitorId: number): Promise<void> {
    this.run("INSERT INTO link_opens (owner_id, visitor_id, created) VALUES (?1, ?2, ?3)", ownerId, visitorId, now());
  }
  async addMessage(ownerId: number, senderId: number, body: string): Promise<number> {
    this.run("INSERT INTO messages (owner_id, sender_id, body, created) VALUES (?1, ?2, ?3, ?4)", ownerId, senderId, body, now());
    return this.lastId();
  }
  async getMessage(id: number): Promise<Msg | null> { return this.one<Msg>("SELECT id, owner_id, sender_id, body, created FROM messages WHERE id = ?1", id); }
  async markReplied(id: number): Promise<void> { this.run("UPDATE messages SET replied = 1 WHERE id = ?1", id); }
  async repliesToday(ownerId: number): Promise<number> {
    const r = this.one<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE owner_id = ?1 AND replied = 1 AND created > ?2", ownerId, now() - 86_400);
    return r?.n ?? 0;
  }
  async inboxCount(ownerId: number): Promise<number> {
    return (this.one<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE owner_id = ?1", ownerId) ?? { n: 0 }).n;
  }
  async countFrom(ownerId: number, senderId: number): Promise<number> {
    return (this.one<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE owner_id = ?1 AND sender_id = ?2", ownerId, senderId) ?? { n: 0 }).n;
  }
  async block(ownerId: number, senderId: number): Promise<void> {
    this.run("INSERT OR IGNORE INTO blocks (owner_id, sender_id, created) VALUES (?1, ?2, ?3)", ownerId, senderId, now());
  }
  async isBlocked(ownerId: number, senderId: number): Promise<boolean> {
    return !!this.one("SELECT 1 AS x FROM blocks WHERE owner_id = ?1 AND sender_id = ?2", ownerId, senderId);
  }
  async sentLastHour(senderId: number): Promise<number> {
    return (this.one<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE sender_id = ?1 AND created > ?2", senderId, now() - 3600) ?? { n: 0 }).n;
  }
  async inbox(ownerId: number): Promise<{ id: number; body: string; created: number; replied: number; answer: string | null }[]> {
    return this.all(
      `SELECT m.id, m.body, m.created, m.replied, a.answer AS answer FROM messages m
       LEFT JOIN answers a ON a.msg_id = m.id WHERE m.owner_id = ?1 ORDER BY m.created DESC LIMIT 30`, ownerId);
  }
  async ownerOpens(ownerId: number): Promise<number> {
    return (this.one<{ n: number }>("SELECT COUNT(*) AS n FROM link_opens WHERE owner_id = ?1", ownerId) ?? { n: 0 }).n;
  }
  /** First-touch attribution for a deep-link source payload (e.g. ?start=site). */
  async addSource(userId: number, src: string): Promise<void> {
    this.run("INSERT OR IGNORE INTO sources (user_id, src, ts) VALUES (?1, ?2, ?3)", userId, src, now());
  }
  /** Owner has decided to answer this message publicly; upsert so re-answering replaces it. */
  async setAnswer(msgId: number, answer: string): Promise<void> {
    this.run("INSERT INTO answers (msg_id, answer, ts) VALUES (?1, ?2, ?3) ON CONFLICT(msg_id) DO UPDATE SET answer = ?2, ts = ?3", msgId, answer, now());
  }
  async getAnswer(msgId: number): Promise<string | null> {
    return (this.one<{ answer: string }>("SELECT answer FROM answers WHERE msg_id = ?1", msgId))?.answer ?? null;
  }
  async stats(): Promise<FleetStats> {
    const m = this.one<{ n: number; r: number | null }>(`SELECT COUNT(*) AS n, SUM(replied) AS r FROM messages WHERE ${this.notTestUser("sender_id")}`);
    const l = this.one<{ n: number }>(`SELECT COUNT(*) AS n FROM link_opens WHERE ${this.notTestUser("visitor_id")}`);
    const sr = this.all<{ src: string; n: number }>(`SELECT src, COUNT(*) AS n FROM sources WHERE ${this.notTestUser("user_id")} GROUP BY src`);
    const s: Record<string, number> = {};
    for (const r of sr) s["src_" + r.src] = r.n;
    const pa = this.one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM answers a JOIN messages m ON m.id = a.msg_id WHERE ${this.notTestUser("m.owner_id")}`);
    return { ...this.userStats(), ...s, events: m?.n ?? 0, replies: m?.r ?? 0, link_opens: l?.n ?? 0, public_answers: pa?.n ?? 0 };
  }
}
