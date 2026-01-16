import { DatabaseManager } from '../db/database';
import type { Word, CreateWordDto, UpdateWordDto } from '../../shared/types';

export class WordService {
  constructor(private db: DatabaseManager) {}

  /**
   * 获取单词本中的所有单词
   */
  getByVocabulary(vocabularyId: number): Word[] {
    const words = this.db.query<Word>(`
      SELECT * FROM words
      WHERE vocabulary_id = ? AND is_deleted = 0
      ORDER BY created_at DESC
    `, [vocabularyId]);

    // 为每个单词加载释义和例句
    for (const word of words) {
      word.definitions = this.getDefinitions(word.id);
      word.examples = this.getExamples(word.id);
    }

    return words;
  }

  /**
   * 根据 ID 获取单词
   */
  getById(id: number): Word | undefined {
    const word = this.db.queryOne<Word>(`
      SELECT * FROM words
      WHERE id = ? AND is_deleted = 0
    `, [id]);

    if (word) {
      word.definitions = this.getDefinitions(word.id);
      word.examples = this.getExamples(word.id);
    }

    return word;
  }

  /**
   * 创建单词
   */
  create(data: CreateWordDto): Word {
    // 插入单词
    const wordId = this.db.insert('words', {
      vocabulary_id: data.vocabularyId,
      word: data.word,
      type: data.type,
      pronunciation: data.pronunciation,
      audio_url: data.audioUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 插入释义
    data.definitions.forEach((def, index) => {
      this.db.insert('definitions', {
        word_id: wordId,
        meaning: def.meaning,
        part_of_speech: def.partOfSpeech,
        order_index: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    // 插入例句
    if (data.examples) {
      data.examples.forEach((example, index) => {
        this.db.insert('examples', {
          word_id: wordId,
          sentence: example.sentence,
          translation: example.translation,
          order_index: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    // 创建学习记录
    this.db.insert('learning_records', {
      vocabulary_id: data.vocabularyId,
      word_id: wordId,
      repetition_count: 0,
      easiness_factor: 2.5,
      interval_days: 0,
      familiarity_level: 0,
      correct_count: 0,
      wrong_count: 0,
      mastered: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const word = this.getById(wordId);
    if (!word) {
      throw new Error('Failed to create word');
    }

    return word;
  }

  /**
   * 更新单词
   */
  update(id: number, data: UpdateWordDto): Word {
    // 更新单词基本信息
    this.db.update('words', id, {
      word: data.word,
      type: data.type,
      pronunciation: data.pronunciation,
      audio_url: data.audioUrl,
      updated_at: new Date().toISOString(),
      sync_status: 0,
    });

    // 更新释义 - 简单方式：删除旧的，插入新的
    if (data.definitions) {
      this.db.execute('DELETE FROM definitions WHERE word_id = ?', [id]);
      data.definitions.forEach((def, index) => {
        this.db.insert('definitions', {
          word_id: id,
          meaning: def.meaning,
          part_of_speech: def.partOfSpeech,
          order_index: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    // 更新例句
    if (data.examples) {
      this.db.execute('DELETE FROM examples WHERE word_id = ?', [id]);
      data.examples.forEach((example, index) => {
        this.db.insert('examples', {
          word_id: id,
          sentence: example.sentence,
          translation: example.translation,
          order_index: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }

    const word = this.getById(id);
    if (!word) {
      throw new Error('Word not found');
    }

    return word;
  }

  /**
   * 删除单词（软删除）
   */
  delete(id: number): void {
    this.db.softDelete('words', id);
  }

  /**
   * 获取单词的释义
   */
  private getDefinitions(wordId: number) {
    return this.db.query<any>(`
      SELECT * FROM definitions
      WHERE word_id = ? AND is_deleted = 0
      ORDER BY order_index
    `, [wordId]);
  }

  /**
   * 获取单词的例句
   */
  private getExamples(wordId: number) {
    return this.db.query<any>(`
      SELECT * FROM examples
      WHERE word_id = ? AND is_deleted = 0
      ORDER BY order_index
    `, [wordId]);
  }

  /**
   * 搜索单词
   */
  search(vocabularyId: number, keyword: string): Word[] {
    const words = this.db.query<Word>(`
      SELECT * FROM words
      WHERE vocabulary_id = ? AND is_deleted = 0
        AND word LIKE ?
      ORDER BY created_at DESC
    `, [vocabularyId, `%${keyword}%`]);

    for (const word of words) {
      word.definitions = this.getDefinitions(word.id);
      word.examples = this.getExamples(word.id);
    }

    return words;
  }
}
