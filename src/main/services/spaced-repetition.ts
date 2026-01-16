/**
 * 艾宾浩斯记忆曲线算法实现
 * 基于 SuperMemo SM-2 算法
 */

export interface ReviewResult {
  nextReviewDate: Date;
  intervalDays: number;
  easinessFactor: number;
  repetitionCount: number;
  familiarityLevel: number;
}

/**
 * 计算下次复习时间
 * @param quality 回忆质量评分 (0-5)
 *   0 - 完全不记得
 *   1 - 不记得
 *   2 - 勉强记得
 *   3 - 一般
 *   4 - 记得清楚
 *   5 - 完美记忆
 * @param repetitionCount 重复次数
 * @param easinessFactor 难度系数 (1.3-2.5)
 * @param intervalDays 当前间隔天数
 */
export function calculateNextReview(
  quality: number,
  repetitionCount: number,
  easinessFactor: number,
  intervalDays: number
): ReviewResult {
  let newEF = easinessFactor;
  let newInterval = intervalDays;
  let newRepetition = repetitionCount;
  let familiarityLevel = 0;

  // 更新难度系数 (EF)
  // 公式: EF = max(1.3, EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02)))
  newEF = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // 质量评分 < 3 表示记忆失败，重置间隔
  if (quality < 3) {
    newRepetition = 0;
    newInterval = 1; // 重新开始，1天后复习
    familiarityLevel = quality < 2 ? 1 : 2; // 1: 陌生, 2: 不太熟
  } else {
    newRepetition += 1;

    // SuperMemo SM-2 算法的间隔计算
    if (newRepetition === 1) {
      newInterval = 1; // 第1次: 1天后
    } else if (newRepetition === 2) {
      newInterval = 6; // 第2次: 6天后
    } else {
      // 第3次及以后: interval × EF
      newInterval = Math.round(intervalDays * newEF);
    }

    // 根据质量评分和重复次数计算熟悉度
    if (newRepetition >= 5 && quality >= 4) {
      familiarityLevel = 5; // 已掌握
    } else if (newRepetition >= 3 && quality >= 4) {
      familiarityLevel = 4; // 熟悉
    } else {
      familiarityLevel = 3; // 一般
    }
  }

  // 计算下次复习日期
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    nextReviewDate,
    intervalDays: newInterval,
    easinessFactor: newEF,
    repetitionCount: newRepetition,
    familiarityLevel,
  };
}

/**
 * 艾宾浩斯标准遗忘曲线间隔（天）
 * 用于初学者的标准复习计划
 */
export const EBBINGHAUS_INTERVALS = [
  5 / (24 * 60), // 5分钟 转换为天
  30 / (24 * 60), // 30分钟
  0.5, // 12小时
  1, // 1天
  2, // 2天
  4, // 4天
  7, // 7天
  15, // 15天
  30, // 30天
  60, // 60天
];

/**
 * 根据重复次数获取标准间隔
 * @param repetitionCount 重复次数
 * @returns 间隔天数
 */
export function getStandardInterval(repetitionCount: number): number {
  if (repetitionCount >= EBBINGHAUS_INTERVALS.length) {
    return EBBINGHAUS_INTERVALS[EBBINGHAUS_INTERVALS.length - 1];
  }
  return EBBINGHAUS_INTERVALS[repetitionCount] || 1;
}

/**
 * 判断是否已掌握单词
 * @param repetitionCount 重复次数
 * @param correctCount 正确次数
 * @param wrongCount 错误次数
 * @param easinessFactor 难度系数
 * @returns 是否已掌握
 */
export function isMastered(
  repetitionCount: number,
  correctCount: number,
  wrongCount: number,
  easinessFactor: number
): boolean {
  // 至少复习5次，且正确率 > 80%，且难度系数 > 2.0
  const totalReviews = correctCount + wrongCount;
  if (totalReviews < 5) return false;

  const accuracy = correctCount / totalReviews;
  return repetitionCount >= 5 && accuracy > 0.8 && easinessFactor > 2.0;
}

/**
 * 获取熟悉度等级描述
 * @param level 熟悉度等级 (0-5)
 * @returns 描述文本
 */
export function getFamiliarityDescription(level: number): string {
  const descriptions = [
    '未学习',
    '陌生',
    '不太熟',
    '一般',
    '熟悉',
    '已掌握',
  ];
  return descriptions[level] || '未知';
}

/**
 * 获取今日需要复习的单词数量
 * @param nextReviewDate 下次复习日期
 * @returns 是否需要今日复习
 */
export function needsReviewToday(nextReviewDate: Date | string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);

  return reviewDate <= today;
}

/**
 * 计算学习进度百分比
 * @param masteredCount 已掌握数量
 * @param totalCount 总数量
 * @returns 进度百分比
 */
export function calculateProgress(masteredCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((masteredCount / totalCount) * 100);
}
