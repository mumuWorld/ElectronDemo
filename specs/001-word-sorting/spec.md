# Feature Specification: 单词排序功能

**Feature Branch**: `001-word-sorting`
**Created**: 2025-01-20
**Status**: Draft
**Input**: 用户描述: "支持单词排序，按添加时间排序，以及复习次数，正确次数，错误次数。"

## User Scenarios & Testing

### User Story 1 - 按添加时间排序 (Priority: P1)

用户在单词列表页面想要按照单词的添加时间进行排序，以便查看最新添加或最早添加的单词。

**Why this priority**: 添加时间是最基础的排序维度，且数据已存在于 `created_at` 字段，实现成本最低，能快速交付价值。

**Independent Test**: 用户点击排序按钮后选择"添加时间"，列表立即按时间重新排列，可独立验证功能是否正常工作。

**Acceptance Scenarios**:

1. **Given** 用户在单词列表页面有多个单词, **When** 用户选择"添加时间（最新优先）", **Then** 单词列表按 `created_at` 降序排列，最新添加的单词显示在最前面
2. **Given** 用户在单词列表页面有多个单词, **When** 用户选择"添加时间（最早优先）", **Then** 单词列表按 `created_at` 升序排列，最早添加的单词显示在最前面
3. **Given** 用户刷新页面或重新进入单词列表, **When** 页面加载完成, **Then** 保持用户上次选择的排序方式

---

### User Story 2 - 按复习次数排序 (Priority: P2)

用户想要按照单词的复习次数排序，以便快速找到复习次数多或少的单词，帮助调整学习策略。

**Why this priority**: 复习次数是学习进度的重要指标，需要关联 `learning_records` 表获取 `repetition_count` 字段。

**Independent Test**: 用户选择"复习次数"排序后，列表按复习次数重新排列，可独立验证排序逻辑。

**Acceptance Scenarios**:

1. **Given** 用户在单词列表页面, **When** 用户选择"复习次数（多到少）", **Then** 单词按 `repetition_count` 降序排列，复习次数最多的单词显示在最前面
2. **Given** 用户在单词列表页面, **When** 用户选择"复习次数（少到多）", **Then** 单词按 `repetition_count` 升序排列，未复习或复习次数最少的单词显示在最前面
3. **Given** 某些单词没有学习记录, **When** 按复习次数排序, **Then** 无学习记录的单词视为复习次数为 0

---

### User Story 3 - 按正确次数排序 (Priority: P3)

用户想要按照单词回答正确的次数排序，以便识别掌握较好的单词。

**Why this priority**: 正确次数需要从 `learning_records` 表的 `correct_count` 字段获取，与 US2 实现逻辑相似。

**Independent Test**: 用户选择"正确次数"排序后，列表按正确次数重新排列。

**Acceptance Scenarios**:

1. **Given** 用户在单词列表页面, **When** 用户选择"正确次数（多到少）", **Then** 单词按 `correct_count` 降序排列
2. **Given** 用户在单词列表页面, **When** 用户选择"正确次数（少到多）", **Then** 单词按 `correct_count` 升序排列
3. **Given** 某些单词没有学习记录, **When** 按正确次数排序, **Then** 无学习记录的单词视为正确次数为 0

---

### User Story 4 - 按错误次数排序 (Priority: P4)

用户想要按照单词回答错误的次数排序，以便快速识别需要加强复习的难词。

**Why this priority**: 错误次数帮助用户识别薄弱环节，数据来源于 `learning_records` 表的 `wrong_count` 字段。

**Independent Test**: 用户选择"错误次数"排序后，列表按错误次数重新排列，错误最多的单词排在前面便于重点复习。

**Acceptance Scenarios**:

1. **Given** 用户在单词列表页面, **When** 用户选择"错误次数（多到少）", **Then** 单词按 `wrong_count` 降序排列，最容易出错的单词显示在最前面
2. **Given** 用户在单词列表页面, **When** 用户选择"错误次数（少到多）", **Then** 单词按 `wrong_count` 升序排列
3. **Given** 某些单词没有学习记录, **When** 按错误次数排序, **Then** 无学习记录的单词视为错误次数为 0

---

### Edge Cases

- 单词列表为空时，排序控件应正常显示但不执行排序操作
- 所有单词的排序字段值相同时（如都是 0），应保持原有顺序或按添加时间作为二级排序
- 用户快速切换排序方式时，应确保只执行最后一次选择的排序
- 排序过程中如果数据量较大，应显示加载状态

## Requirements

### Functional Requirements

- **FR-001**: 系统 MUST 在单词列表页面提供排序控件（下拉选择器或按钮组）
- **FR-002**: 系统 MUST 支持按添加时间（升序/降序）排序
- **FR-003**: 系统 MUST 支持按复习次数（升序/降序）排序
- **FR-004**: 系统 MUST 支持按正确次数（升序/降序）排序
- **FR-005**: 系统 MUST 支持按错误次数（升序/降序）排序
- **FR-006**: 系统 MUST 在切换排序方式时立即更新列表显示
- **FR-007**: 系统 SHOULD 记住用户的排序偏好（每个词库独立保存或全局保存）
- **FR-008**: 没有学习记录的单词在按学习统计字段排序时 MUST 视为对应值为 0

### Key Entities

- **Word**: 单词实体，包含 `id`, `word`, `created_at` 等基础信息
- **LearningRecord**: 学习记录实体，包含 `repetition_count`（复习次数）、`correct_count`（正确次数）、`wrong_count`（错误次数）
- **SortConfig**: 排序配置（新增），包含 `sortField`（排序字段）和 `sortOrder`（排序方向 asc/desc）

## Success Criteria

### Measurable Outcomes

- **SC-001**: 用户可在 1 秒内完成排序方式的切换并看到结果
- **SC-002**: 排序功能在 1000 个单词的词库中响应时间不超过 500ms
- **SC-003**: 用户无需任何说明即可找到并使用排序功能（符合直觉的 UI 设计）
- **SC-004**: 排序结果准确无误，与预期排序方式完全一致
