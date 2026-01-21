import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Modal,
  Form,
  Input,
  Space,
  message,
  Tag,
  Typography,
  Layout,
  Dropdown
} from 'antd'
import type { MenuProps } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  SoundOutlined,
  ReadOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input
const { Header, Content } = Layout

interface Word {
  id: number
  word: string
  type?: string
  pronunciation?: string
  definitions?: Array<{ meaning: string; part_of_speech?: string }>
  examples?: Array<{ sentence: string; translation?: string }>
  created_at: string
}

interface Vocabulary {
  id: number
  name: string
  description?: string
}

function WordList(): JSX.Element {
  const { vocabularyId } = useParams<{ vocabularyId: string }>()
  const navigate = useNavigate()
  const [words, setWords] = useState<Word[]>([])
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // 加载单词本信息
  const loadVocabulary = async () => {
    try {
      const vocab = await window.api.vocabulary.getById(Number(vocabularyId))
      setVocabulary(vocab)
    } catch (error) {
      console.error('Failed to load vocabulary:', error)
      message.error('Failed to load vocabulary')
    }
  }

  // 加载单词列表
  const loadWords = async () => {
    if (!vocabularyId) return

    try {
      const result = await window.api.word.getByVocabulary(Number(vocabularyId))
      setWords(result)
    } catch (error) {
      console.error('Failed to load words:', error)
      message.error('Failed to load words')
    }
  }

  // 创建单词
  const handleCreate = async (values: any) => {
    setLoading(true)
    try {
      // 解析释义和例句 - 支持 "词性: 释义" 或 "词性. 释义" 格式
      const definitions = values.meanings
        .split('\n')
        .filter((m: string) => m.trim())
        .map((line: string) => {
          const trimmed = line.trim()
          // 尝试匹配 "词性: 释义" 或 "词性. 释义" 格式
          const match = trimmed.match(/^([a-z]+\.?)\s*[:：.]?\s*(.+)$/i)
          if (match && match[1] && match[2]) {
            return {
              partOfSpeech: match[1].replace(/\.$/, ''), // 移除词性后的点
              meaning: match[2].trim()
            }
          }
          // 如果没有匹配到词性，整行作为释义
          return {
            partOfSpeech: '',
            meaning: trimmed
          }
        })

      const examples = values.examples
        ? values.examples
          .split('\n\n')
          .filter((e: string) => e.trim())
          .map((example: string) => {
            const parts = example.split('\n')
            return {
              sentence: parts[0]?.trim() || '',
              translation: parts[1]?.trim() || ''
            }
          })
        : []

      if (editingWord) {
        // 更新单词
        await window.api.word.update(editingWord.id, {
          word: values.word,
          pronunciation: values.pronunciation,
          definitions,
          examples
        })
        message.success('单词更新成功！')
      } else {
        // 创建单词
        await window.api.word.create({
          vocabularyId: Number(vocabularyId),
          word: values.word,
          pronunciation: values.pronunciation,
          definitions,
          examples
        })
        message.success('单词创建成功！')
      }

      setIsModalOpen(false)
      setEditingWord(null)
      form.resetFields()
      loadWords()
    } catch (error) {
      console.error('Failed to save word:', error)
      message.error(editingWord ? '更新单词失败' : '创建单词失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开编辑 Modal
  const handleEdit = (word: Word) => {
    setEditingWord(word)

    // 填充表单 - 将词性和释义合并为 "词性: 释义" 格式
    const meaningsText = word.definitions
      ?.map(def => {
        if (def.part_of_speech) {
          return `${def.part_of_speech}: ${def.meaning}`
        }
        return def.meaning
      })
      .join('\n') || ''

    const examplesText = word.examples?.map(ex =>
      `${ex.sentence}\n${ex.translation || ''}`
    ).join('\n\n') || ''

    form.setFieldsValue({
      word: word.word,
      pronunciation: word.pronunciation,
      meanings: meaningsText,
      examples: examplesText
    })

    setIsModalOpen(true)
  }

  // 打开创建 Modal
  const handleAdd = () => {
    setEditingWord(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  // 播放单词发音
  const handlePronounce = (word: string) => {
    if ('speechSynthesis' in window) {
      // 停止当前播放
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US' // 设置为英语
      utterance.rate = 1 // 语速稍慢一点
      utterance.pitch = 1 // 音调

      window.speechSynthesis.speak(utterance)
    } else {
      message.warning('您的浏览器不支持语音合成功能')
    }
  }

  // 删除单词
  const handleDelete = async (id: number, word: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除单词 "${word}" 吗？此操作无法撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await window.api.word.delete(id)
          message.success('单词删除成功！')
          loadWords()
        } catch (error) {
          console.error('Failed to delete word:', error)
          message.error('删除单词失败')
        }
      }
    })
  }

  // 生成右键菜单项
  const getContextMenuItems = (word: Word): MenuProps['items'] => {
    return [
      {
        key: 'pronounce',
        icon: <SoundOutlined />,
        label: '发音',
        onClick: () => handlePronounce(word.word)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEdit(word)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(word.id, word.word)
      }
    ]
  }

  useEffect(() => {
    loadVocabulary()
    loadWords()
  }, [vocabularyId])

  return (
    <Layout style={{ minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            size="large"
          >
            返回
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              {vocabulary?.name || 'Loading...'}
            </Title>
          </div>
          {vocabulary?.description && (
            <Text type="secondary" style={{ fontSize: 14 }}>
              {vocabulary.description}
            </Text>
          )}
        </div>
        <Space size="middle">
          <Button
            type="default"
            icon={<ReadOutlined />}
            onClick={() => navigate(`/vocabulary/${vocabularyId}/study`)}
            size="large"
            disabled={words.length === 0}
          >
            开始学习
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            添加单词
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: 16, background: '#f5f5f5', overflow: 'auto', flex: 1 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Card size="small">
            <Space>
              <Text type="secondary">共 {words.length} 个单词</Text>
              {words.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  | 右键点击卡片可编辑或删除
                </Text>
              )}
            </Space>
          </Card>

          {words.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无单词，点击右上角"添加单词"开始！
              </div>
            </Card>
          ) : (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {words.map((word) => (
                <Dropdown
                  key={word.id}
                  menu={{ items: getContextMenuItems(word) }}
                  trigger={['contextMenu']}
                >
                  <Card
                    size="small"
                    hoverable
                    style={{ borderLeft: '3px solid #1890ff', cursor: 'context-menu' }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {/* 单词标题 */}
                      <div>
                        <Space align="baseline" size="small">
                          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                            {word.word}
                          </Title>
                          <Button
                            type="text"
                            icon={<SoundOutlined />}
                            onClick={() => handlePronounce(word.word)}
                            size="small"
                            style={{ color: '#52c41a', padding: '0 4px' }}
                            title="点击发音"
                          />
                          {word.pronunciation && (
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              [{word.pronunciation}]
                            </Text>
                          )}
                        </Space>
                      </div>

                      {/* 释义部分 */}
                      {word.definitions && word.definitions.length > 0 && (
                        <div>
                          <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            {word.definitions.map((def, index) => (
                              <div
                                key={index}
                                style={{
                                  paddingLeft: 0,
                                  lineHeight: '1.6'
                                }}
                              >
                                <Space size="small">
                                  {def.part_of_speech && (
                                    <Tag color="geekblue" style={{ fontSize: 12, margin: 0 }}>
                                      {def.part_of_speech}
                                    </Tag>
                                  )}
                                  <Text style={{ fontSize: 14 }}>{def.meaning}</Text>
                                </Space>
                              </div>
                            ))}
                          </Space>
                        </div>
                      )}

                      {/* 例句部分 */}
                      {word.examples && word.examples.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            {word.examples.map((example, index) => (
                              <div
                                key={index}
                                style={{
                                  padding: '6px 10px',
                                  background: '#f0f5ff',
                                  borderRadius: 4,
                                  borderLeft: '2px solid #52c41a'
                                }}
                              >
                                <div style={{ marginBottom: 2 }}>
                                  <Text style={{ fontSize: 13 }}>{example.sentence}</Text>
                                </div>
                                {example.translation && (
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {example.translation}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            ))}
                          </Space>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Dropdown>
              ))}
            </Space>
          )}
        </Space>
      </Content>

      <Modal
        title={editingWord ? '编辑单词' : '添加单词'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingWord(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            label="单词"
            name="word"
            rules={[{ required: true, message: '请输入单词！' }]}
          >
            <Input placeholder="例如：hello" />
          </Form.Item>

          <Form.Item label="音标" name="pronunciation">
            <Input placeholder="例如：həˈloʊ" />
          </Form.Item>

          <Form.Item
            label="释义（每行一个，格式：词性: 释义）"
            name="meanings"
            rules={[{ required: true, message: '请至少输入一个释义！' }]}
            extra="支持格式：n. 书籍 或 v: 预订 或 直接输入释义（不带词性）"
          >
            <TextArea
              rows={6}
              placeholder={'n. 打招呼；问候\nv. 向…打招呼\ninterj. 喂（用于接电话）'}
            />
          </Form.Item>

          <Form.Item label="例句（句子和翻译分两行，例句之间用空行分隔）" name="examples">
            <TextArea
              rows={6}
              placeholder={'Hello, how are you?\n你好，你好吗？\n\nShe said hello to me.\n她向我打招呼。'}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingWord ? '保存' : '创建'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingWord(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default WordList
