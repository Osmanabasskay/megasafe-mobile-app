import { promises as fs } from 'fs';
import path from 'path';

export type CollectionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
} & Record<string, unknown>;

class JsonDB {
  private baseDir: string;
  private locks: Map<string, Promise<void>> = new Map();

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (e) {
      // noop
    }
  }

  private fileFor(collection: string) {
    return path.join(this.baseDir, `${collection}.json`);
  }

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(key) ?? Promise.resolve();
    let release: () => void;
    const next = new Promise<void>((res) => (release = res));
    this.locks.set(key, prev.then(() => next));
    await prev;
    try {
      const result = await fn();
      // @ts-expect-error release is assigned
      release();
      return result;
    } catch (err) {
      // @ts-expect-error release is assigned
      release();
      throw err;
    } finally {
      const current = this.locks.get(key);
      if (current === next) {
        this.locks.delete(key);
      }
    }
  }

  private async readCollection(collection: string): Promise<CollectionRecord[]> {
    await this.ensureDir();
    const file = this.fileFor(collection);
    try {
      const txt = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(txt) as CollectionRecord[];
      return Array.isArray(data) ? data : [];
    } catch (e: unknown) {
      return [];
    }
  }

  private async writeCollection(collection: string, rows: CollectionRecord[]): Promise<void> {
    await this.ensureDir();
    const file = this.fileFor(collection);
    const tmp = `${file}.tmp`;
    const json = JSON.stringify(rows, null, 2);
    await fs.writeFile(tmp, json, 'utf-8');
    await fs.rename(tmp, file);
  }

  async list(collection: string, params?: { offset?: number; limit?: number; where?: Partial<Record<string, unknown>> }) {
    return this.withLock(collection, async () => {
      const rows = await this.readCollection(collection);
      const filtered = params?.where
        ? rows.filter((r) => Object.entries(params.where as Record<string, unknown>).every(([k, v]) => (r as Record<string, unknown>)[k] === v))
        : rows;
      const offset = params?.offset ?? 0;
      const limit = params?.limit ?? filtered.length;
      return { total: filtered.length, items: filtered.slice(offset, offset + limit) };
    });
  }

  async get(collection: string, id: string) {
    return this.withLock(collection, async () => {
      const rows = await this.readCollection(collection);
      return rows.find((r) => r.id === id) ?? null;
    });
  }

  async create(collection: string, data: Record<string, unknown>): Promise<CollectionRecord> {
    return this.withLock(collection, async () => {
      const rows = await this.readCollection(collection);
      const now = new Date().toISOString();
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const rec: CollectionRecord = { id, createdAt: now, updatedAt: now, ...data };
      rows.push(rec);
      await this.writeCollection(collection, rows);
      return rec;
    });
  }

  async update(collection: string, id: string, patch: Record<string, unknown>): Promise<CollectionRecord | null> {
    return this.withLock(collection, async () => {
      const rows = await this.readCollection(collection);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const updated: CollectionRecord = { ...rows[idx], ...patch, id, updatedAt: new Date().toISOString() };
      rows[idx] = updated;
      await this.writeCollection(collection, rows);
      return updated;
    });
  }

  async remove(collection: string, id: string): Promise<boolean> {
    return this.withLock(collection, async () => {
      const rows = await this.readCollection(collection);
      const next = rows.filter((r) => r.id !== id);
      const changed = next.length !== rows.length;
      if (changed) await this.writeCollection(collection, next);
      return changed;
    });
  }

  async clear(collection: string): Promise<void> {
    return this.withLock(collection, async () => {
      await this.writeCollection(collection, []);
    });
  }
}

export const db = new JsonDB(path.join(process.cwd(), 'data'));
export default db;
