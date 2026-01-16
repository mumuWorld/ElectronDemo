import { DatabaseManager } from '../db/database';
import type { Vocabulary, CreateVocabularyDto, UpdateVocabularyDto } from '../../shared/types';

export class VocabularyService {
  constructor(private db: DatabaseManager) {}

  /**
   * 获取所有单词本
   */
  getAll(): Vocabulary[] {
    const vocabularies = this.db.query<Vocabulary>(`
      SELECT * FROM vocabularies
      WHERE is_deleted = 0
      ORDER BY created_at DESC
    `);

    // 为每个单词本添加统计信息
    for (const vocab of vocabularies) {
      const stats = this.getVocabularyStats(vocab.id);
      vocab.wordCount = stats.wordCount;
      vocab.masteredCount = stats.masteredCount;
      vocab.progress = stats.progress;
    }

    return vocabularies;
  }

  /**
   * 根据 ID 获取单词本
   */
  getById(id: number): Vocabulary | undefined {
    const vocab = this.db.queryOne<Vocabulary>(`
      SELECT * FROM vocabularies
      WHERE id = ? AND is_deleted = 0
    `, [id]);

    if (vocab) {
      const stats = this.getVocabularyStats(vocab.id);
      vocab.wordCount = stats.wordCount;
      vocab.masteredCount = stats.masteredCount;
      vocab.progress = stats.progress;
    }

    return vocab;
  }

  /**
   * 创建单词本
   */
  create(data: CreateVocabularyDto): Vocabulary {
    const id = this.db.insert('vocabularies', {
      name: data.name,
      description: data.description,
      color: data.color || '#1890ff',
      icon: data.icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const vocab = this.getById(id);
    if (!vocab) {
      throw new Error('Failed to create vocabulary');
    }

    return vocab;
  }

  /**
   * 更新单词本
   */
  update(id: number, data: UpdateVocabularyDto): Vocabulary {
    this.db.update('vocabularies', id, {
      ...data,
      updated_at: new Date().toISOString(),
      sync_status: 0, // 标记为未同步
    });

    const vocab = this.getById(id);
    if (!vocab) {
      throw new Error('Vocabulary not found');
    }

    return vocab;
  }

  /**
   * 删除单词本（软删除）
   */
  delete(id: number): void {
    this.db.softDelete('vocabularies', id);
  }

  /**
   * 获取单词本统计信息
   */
  private getVocabularyStats(vocabularyId: number) {
    const wordCount = this.db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM words
      WHERE vocabulary_id = ? AND is_deleted = 0
    `, [vocabularyId])?.count || 0;

    const masteredCount = this.db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM learning_records
      WHERE vocabulary_id = ? AND mastered = 1
    `, [vocabularyId])?.count || 0;

    const progress = wordCount > 0
      ? Math.round((masteredCount / wordCount) * 100)
      : 0;

    return { wordCount, masteredCount, progress };
  }

  /**
   * 搜索单词本
   */
  async search(keyword: string): Promise<Vocabulary[]> {
    return this.db.query<Vocabulary>(`
      SELECT * FROM vocabularies
      WHERE is_deleted = 0
        AND (name LIKE ? OR description LIKE ?)
      ORDER BY created_at DESC
    `, [`%${keyword}%`, `%${keyword}%`]);
  }
}
