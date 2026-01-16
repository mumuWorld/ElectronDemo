import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Table,
  Modal,
  Form,
  Input,
  Space,
  message,
  Breadcrumb,
  Tag,
  Typography
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, HomeOutlined } from '@ant-design/icons'

const { Title } = Typography
const { TextArea } = Input

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
      // 解析释义和例句
      const definitions = values.meanings
        .split('\n')
        .filter((m: string) => m.trim())
        .map((meaning: string) => ({
          meaning: meaning.trim(),
          partOfSpeech: values.type
        }))

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

      await window.api.word.create({
        vocabularyId: Number(vocabularyId),
        word: values.word,
        type: values.type,
        pronunciation: values.pronunciation,
        definitions,
        examples
      })

      message.success('Word created successfully!')
      setIsModalOpen(false)
      form.resetFields()
      loadWords()
    } catch (error) {
      console.error('Failed to create word:', error)
      message.error('Failed to create word')
    } finally {
      setLoading(false)
    }
  }

  // 删除单词
  const handleDelete = async (id: number) => {
    try {
      await window.api.word.delete(id)
      message.success('Word deleted successfully!')
      loadWords()
    } catch (error) {
      console.error('Failed to delete word:', error)
      message.error('Failed to delete word')
    }
  }

  useEffect(() => {
    loadVocabulary()
    loadWords()
  }, [vocabularyId])

  const columns = [
    {
      title: 'Word',
      dataIndex: 'word',
      key: 'word',
      width: 150,
      render: (text: string, record: Word) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{text}</div>
          {record.pronunciation && (
            <div style={{ color: '#888', fontSize: 12 }}>[{record.pronunciation}]</div>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (type ? <Tag color="blue">{type}</Tag> : '-')
    },
    {
      title: 'Definitions',
      key: 'definitions',
      render: (_: any, record: Word) => (
        <div>
          {record.definitions?.map((def, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              {def.part_of_speech && <Tag>{def.part_of_speech}</Tag>}
              {def.meaning}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Examples',
      key: 'examples',
      render: (_: any, record: Word) => (
        <div>
          {record.examples?.slice(0, 1).map((ex, index) => (
            <div key={index} style={{ fontSize: 12, color: '#666' }}>
              <div>{ex.sentence}</div>
              {ex.translation && <div style={{ color: '#999' }}>{ex.translation}</div>}
            </div>
          ))}
          {record.examples && record.examples.length > 1 && (
            <div style={{ fontSize: 12, color: '#1890ff' }}>
              +{record.examples.length - 1} more
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Word) => (
        <Space>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb
          items={[
            {
              title: (
                <a onClick={() => navigate('/')}>
                  <HomeOutlined /> Home
                </a>
              )
            },
            {
              title: vocabulary?.name || 'Loading...'
            }
          ]}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>{vocabulary?.name}</Title>
            {vocabulary?.description && <div style={{ color: '#888' }}>{vocabulary.description}</div>}
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add Word
          </Button>
        </div>

        <Card>
          <Table columns={columns} dataSource={words} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      </Space>

      <Modal
        title="Add New Word"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            label="Word"
            name="word"
            rules={[{ required: true, message: 'Please input the word!' }]}
          >
            <Input placeholder="e.g., hello" />
          </Form.Item>

          <Form.Item label="Type" name="type">
            <Input placeholder="e.g., n., v., adj., etc." />
          </Form.Item>

          <Form.Item label="Pronunciation" name="pronunciation">
            <Input placeholder="e.g., həˈloʊ" />
          </Form.Item>

          <Form.Item
            label="Meanings (one per line)"
            name="meanings"
            rules={[{ required: true, message: 'Please input at least one meaning!' }]}
          >
            <TextArea
              rows={4}
              placeholder={'打招呼\n问候\n喂（用于接电话）'}
            />
          </Form.Item>

          <Form.Item label="Examples (sentence and translation, separated by blank line)" name="examples">
            <TextArea
              rows={6}
              placeholder={'Hello, how are you?\n你好，你好吗？\n\nShe said hello to me.\n她向我打招呼。'}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  form.resetFields()
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WordList
