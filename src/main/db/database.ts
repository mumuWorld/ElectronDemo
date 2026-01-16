import initSqlJs, { Database } from 'sql.js';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export class DatabaseManager {
  private db: Database | null = null;
  private dbPath: string;
  private SQL: any;

  async initialize() {
    try {
      console.log('=== Starting database initialization ===');

      // Initialize SQL.js with WASM file
      // In development, load from node_modules
      // In production, load from app resources
      const isDev = !app.isPackaged;
      let wasmBinary: Buffer;

      if (isDev) {
        const wasmPath = path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
        console.log('Loading WASM from:', wasmPath);
        wasmBinary = fs.readFileSync(wasmPath);
      } else {
        const wasmPath = path.join(process.resourcesPath, 'sql-wasm.wasm');
        wasmBinary = fs.readFileSync(wasmPath);
      }

      console.log('WASM file loaded, size:', wasmBinary.length);

      this.SQL = await initSqlJs({
        wasmBinary
      });

      console.log('✅ SQL.js initialized successfully');

      // Setup database file path
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'vocabulary.db');

      console.log('Database path:', this.dbPath);

      // Load existing database or create new one
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
        console.log('✅ Existing database loaded');
      } else {
        this.db = new this.SQL.Database();
        console.log('✅ New database created');
      }

      this.createTables();
      this.save();
      console.log('✅ Database initialization complete');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  private createTables() {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
-- 单词本表
CREATE TABLE IF NOT EXISTS vocabularies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#1890ff',
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  is_deleted INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vocabularies_sync ON vocabularies(sync_status, last_sync_time);
CREATE INDEX IF NOT EXISTS idx_vocabularies_deleted ON vocabularies(is_deleted);

-- 单词表
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  type TEXT,
  pronunciation TEXT,
  audio_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_words_vocabulary ON words(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_sync ON words(sync_status, last_sync_time);
CREATE INDEX IF NOT EXISTS idx_words_deleted ON words(is_deleted);

-- 释义表
CREATE TABLE IF NOT EXISTS definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL,
  meaning TEXT NOT NULL,
  part_of_speech TEXT,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_definitions_word ON definitions(word_id);
CREATE INDEX IF NOT EXISTS idx_definitions_order ON definitions(word_id, order_index);

-- 例句表
CREATE TABLE IF NOT EXISTS examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_examples_word ON examples(word_id);
CREATE INDEX IF NOT EXISTS idx_examples_order ON examples(word_id, order_index);

-- 短语表
CREATE TABLE IF NOT EXISTS phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL,
  phrase TEXT NOT NULL,
  meaning TEXT NOT NULL,
  usage TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_phrases_vocabulary ON phrases(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_phrases_phrase ON phrases(phrase);

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL,
  word_id INTEGER,
  phrase_id INTEGER,
  repetition_count INTEGER DEFAULT 0,
  easiness_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  next_review_date DATETIME,
  last_review_date DATETIME,
  familiarity_level INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  mastered INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  FOREIGN KEY (phrase_id) REFERENCES phrases(id) ON DELETE CASCADE,
  CHECK ((word_id IS NOT NULL AND phrase_id IS NULL) OR (word_id IS NULL AND phrase_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_learning_vocabulary ON learning_records(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_learning_word ON learning_records(word_id);
CREATE INDEX IF NOT EXISTS idx_learning_phrase ON learning_records(phrase_id);
CREATE INDEX IF NOT EXISTS idx_learning_next_review ON learning_records(next_review_date);
CREATE INDEX IF NOT EXISTS idx_learning_mastered ON learning_records(mastered);

-- 复习历史表
CREATE TABLE IF NOT EXISTS review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learning_record_id INTEGER NOT NULL,
  review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  quality INTEGER NOT NULL,
  time_spent INTEGER,
  review_mode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status INTEGER DEFAULT 0,
  last_sync_time DATETIME,
  remote_id TEXT,
  FOREIGN KEY (learning_record_id) REFERENCES learning_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_history_record ON review_history(learning_record_id);
CREATE INDEX IF NOT EXISTS idx_review_history_date ON review_history(review_date);

-- 设置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('daily_goal', '20'),
  ('review_mode', 'comprehensive'),
  ('auto_play_audio', '1'),
  ('show_phonetic', '1'),
  ('dark_mode', '0');

-- 数据库版本表
CREATE TABLE IF NOT EXISTS db_version (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO db_version (version) VALUES (1);
`;

    this.db.run(schema);
    console.log('✅ Database tables created');
  }

  // Save database to file
  save() {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }

  // Query methods
  query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results: T[] = [];
      const stmt = this.db.prepare(sql);
      stmt.bind(params);

      while (stmt.step()) {
        const row = stmt.getAsObject() as T;
        results.push(row);
      }
      stmt.free();

      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const results = this.query<T>(sql, params);
    return results[0];
  }

  execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
    if (!this.db) throw new Error('Database not initialized');

    try {
      this.db.run(sql, params);
      const changes = this.db.getRowsModified();
      const lastInsertRowid = this.query<{ id: number }>('SELECT last_insert_rowid() as id')[0]?.id || 0;

      // Auto-save after modifications
      this.save();

      return { changes, lastInsertRowid };
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }

  // CRUD helper methods
  insert(table: string, data: Record<string, any>): number {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const values = keys.map(key => data[key]);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    const result = this.execute(sql, values);
    return result.lastInsertRowid;
  }

  update(table: string, id: number, data: Record<string, any>): void {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    if (keys.length === 0) return;

    const values = keys.map(key => data[key]);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;

    this.execute(sql, [...values, id]);
  }

  delete(table: string, condition: Record<string, any>): void {
    const keys = Object.keys(condition);
    const values = Object.values(condition);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;

    this.execute(sql, values);
  }

  // Soft delete
  softDelete(table: string, id: number): void {
    const sql = `UPDATE ${table} SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    this.execute(sql, [id]);
  }

  // Get database statistics
  getStats() {
    return {
      vocabularies: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM vocabularies WHERE is_deleted = 0')?.count || 0,
      words: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM words WHERE is_deleted = 0')?.count || 0,
      phrases: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM phrases WHERE is_deleted = 0')?.count || 0,
      learningRecords: this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM learning_records')?.count || 0,
    };
  }

  // Close database
  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      console.log('✅ Database closed');
    }
  }
}

// Singleton pattern
let dbInstance: DatabaseManager | null = null;

export async function getDatabase(): Promise<DatabaseManager> {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
    await dbInstance.initialize();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
