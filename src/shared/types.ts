// 共享类型定义

export interface Vocabulary {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
  is_deleted: number;
  // 统计信息(非数据库字段)
  wordCount?: number;
  masteredCount?: number;
  progress?: number;
}

export interface Word {
  id: number;
  vocabulary_id: number;
  word: string;
  type?: string;
  pronunciation?: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
  is_deleted: number;
  // 关联数据
  definitions?: Definition[];
  examples?: Example[];
  learningRecord?: LearningRecord;
}

export interface Definition {
  id: number;
  word_id: number;
  meaning: string;
  part_of_speech?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
  is_deleted: number;
}

export interface Example {
  id: number;
  word_id: number;
  sentence: string;
  translation?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
  is_deleted: number;
}

export interface Phrase {
  id: number;
  vocabulary_id: number;
  phrase: string;
  meaning: string;
  usage?: string;
  created_at: string;
  updated_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
  is_deleted: number;
}

export interface LearningRecord {
  id: number;
  vocabulary_id: number;
  word_id?: number;
  phrase_id?: number;
  repetition_count: number;
  easiness_factor: number;
  interval_days: number;
  next_review_date?: string;
  last_review_date?: string;
  familiarity_level: number;
  correct_count: number;
  wrong_count: number;
  mastered: number;
  created_at: string;
  updated_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
}

export interface ReviewHistory {
  id: number;
  learning_record_id: number;
  review_date: string;
  quality: number;
  time_spent?: number;
  review_mode?: string;
  created_at: string;
  sync_status: number;
  last_sync_time?: string;
  remote_id?: string;
}

export interface Settings {
  daily_goal: number;
  review_mode: 'comprehensive' | 'quick' | 'test';
  auto_play_audio: boolean;
  show_phonetic: boolean;
  dark_mode: boolean;
}

// DTO 类型
export interface CreateVocabularyDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateVocabularyDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreateWordDto {
  vocabularyId: number;
  word: string;
  type?: string;
  pronunciation?: string;
  audioUrl?: string;
  definitions: Array<{
    meaning: string;
    partOfSpeech?: string;
  }>;
  examples?: Array<{
    sentence: string;
    translation?: string;
  }>;
}

export interface UpdateWordDto {
  word?: string;
  type?: string;
  pronunciation?: string;
  audioUrl?: string;
  definitions?: Array<{
    meaning: string;
    partOfSpeech?: string;
  }>;
  examples?: Array<{
    sentence: string;
    translation?: string;
  }>;
}

export interface StudyStats {
  totalWords: number;
  masteredWords: number;
  todayReview: number;
  todayLearned: number;
  weeklyProgress: Array<{
    date: string;
    learned: number;
    reviewed: number;
  }>;
}
