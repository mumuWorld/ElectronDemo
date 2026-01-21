import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Space,
  Typography,
  List,
  Modal,
  Form,
  Input,
  message,
  Layout,
  Badge,
  Dropdown
} from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, EyeOutlined, BookOutlined, ReadOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Header, Content } = Layout

function VocabularyList(): JSX.Element {
  const navigate = useNavigate()
  const [pingResult, setPingResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [vocabularies, setVocabularies] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handlePing = async () => {
    setLoading(true)
    try {
      const result = await window.api.ping()
      setPingResult(`Ping successful: ${result}`)
      message.success('Ping successful!')
    } catch (error) {
      setPingResult(`Ping failed: ${error}`)
      message.error('Ping failed!')
    } finally {
      setLoading(false)
    }
  }

  const loadVocabularies = async () => {
    try {
      const result = await window.api.vocabulary.getAll()
      setVocabularies(result)
    } catch (error) {
      console.error('Failed to load vocabularies:', error)
      message.error('Failed to load vocabularies')
    }
  }

  const handleCreate = async (values: any) => {
    try {
      await window.api.vocabulary.create(values)
      message.success('Vocabulary created successfully!')
      setIsModalOpen(false)
      form.resetFields()
      loadVocabularies()
    } catch (error) {
      console.error('Failed to create vocabulary:', error)
      message.error('Failed to create vocabulary')
    }
  }

  const handleDelete = async (id: number) => {
    const vocab = vocabularies.find(v => v.id === id)
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除单词本 "${vocab?.name}" 吗？此操作将删除该单词本及其所有单词，且无法撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await window.api.vocabulary.delete(id)
          message.success('单词本删除成功！')
          loadVocabularies()
        } catch (error) {
          console.error('Failed to delete vocabulary:', error)
          message.error('删除单词本失败')
        }
      }
    })
  }

  const getVocabContextMenuItems = (vocab: any): MenuProps['items'] => {
    return [
      {
        key: 'study',
        icon: <ReadOutlined />,
        label: '开始学习',
        onClick: () => navigate(`/vocabulary/${vocab.id}/study`),
        disabled: !vocab.wordCount || vocab.wordCount === 0
      },
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看单词',
        onClick: () => navigate(`/vocabulary/${vocab.id}/words`)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(vocab.id)
      }
    ]
  }

  useEffect(() => {
    loadVocabularies()
  }, [])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            背单词系统
          </Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="large">
          创建单词本
        </Button>
      </Header>

      <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto', flex: 1 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>我的单词本</Title>
              <Text type="secondary">共 {vocabularies.length} 个单词本</Text>
            </Space>
          </Card>

          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={vocabularies}
            renderItem={(vocab) => (
              <List.Item>
                <Dropdown
                  menu={{ items: getVocabContextMenuItems(vocab) }}
                  trigger={['contextMenu']}
                >
                  <Card
                    hoverable
                    onClick={() => navigate(`/vocabulary/${vocab.id}/words`)}
                    style={{ height: '100%', cursor: 'pointer' }}
                    actions={[
                      <Button
                        key="study"
                        type="link"
                        icon={<ReadOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/vocabulary/${vocab.id}/study`)
                        }}
                        disabled={!vocab.wordCount || vocab.wordCount === 0}
                      >
                        开始学习
                      </Button>,
                      <Button
                        key="view"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/vocabulary/${vocab.id}/words`)
                        }}
                      >
                        查看单词
                      </Button>
                    ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{vocab.name}</span>
                        <Badge count={vocab.wordCount || 0} showZero style={{ backgroundColor: '#52c41a' }} />
                      </div>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text>{vocab.description || '暂无描述'}</Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            单词: {vocab.wordCount || 0} | 已掌握: {vocab.masteredCount || 0}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            进度: {vocab.progress || 0}%
                          </Text>
                        </div>
                      </Space>
                    }
                  />
                </Card>
              </Dropdown>
            </List.Item>
            )}
            locale={{ emptyText: '暂无单词本，点击右上角"创建单词本"开始！' }}
          />
        </Space>
      </Content>

      <Modal
        title="创建单词本"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入单词本名称！' }]}
          >
            <Input placeholder="例如：CET-4、雅思、托福等" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="可选的描述信息" rows={3} />
          </Form.Item>

          <Form.Item label="颜色标识" name="color">
            <Input placeholder="例如：#1890ff" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false)
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

export default VocabularyList
