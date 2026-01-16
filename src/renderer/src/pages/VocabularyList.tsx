import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Space, Typography, List, Modal, Form, Input, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

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
    try {
      await window.api.vocabulary.delete(id)
      message.success('Vocabulary deleted successfully!')
      loadVocabularies()
    } catch (error) {
      console.error('Failed to delete vocabulary:', error)
      message.error('Failed to delete vocabulary')
    }
  }

  useEffect(() => {
    loadVocabularies()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Vocabulary Learning System</Title>
        <Title level={3}>背单词系统 - electron-vite 版本</Title>

        <Card title="IPC Communication Test">
          <Space direction="vertical">
            <Button type="primary" onClick={handlePing} loading={loading}>
              Test Ping
            </Button>
            {pingResult && <Text>{pingResult}</Text>}
          </Space>
        </Card>

        <Card
          title="Vocabulary Management"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Create Vocabulary
            </Button>
          }
        >
          <List
            dataSource={vocabularies}
            renderItem={(vocab) => (
              <List.Item
                key={vocab.id}
                actions={[
                  <Button
                    key="view"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/vocabulary/${vocab.id}/words`)}
                  >
                    View Words
                  </Button>,
                  <Button key="delete" type="link" danger onClick={() => handleDelete(vocab.id)}>
                    Delete
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={vocab.name}
                  description={
                    <Space direction="vertical" size="small">
                      <Text>{vocab.description || 'No description'}</Text>
                      <Text type="secondary">
                        Words: {vocab.wordCount || 0} | Mastered: {vocab.masteredCount || 0} |
                        Progress: {vocab.progress || 0}%
                      </Text>
                      <Text type="secondary">
                        Created: {new Date(vocab.created_at).toLocaleString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 'No vocabularies yet. Create one to get started!' }}
          />
        </Card>

        <Card title="System Information">
          <Space direction="vertical">
            <Text>App Name: Vocabulary Learning System</Text>
            <Text>Framework: Electron + React + Vite (electron-vite)</Text>
            <Text>Database: SQL.js</Text>
            <Text>UI: Ant Design</Text>
            <Text>Total Vocabularies: {vocabularies.length}</Text>
          </Space>
        </Card>
      </Space>

      <Modal
        title="Create Vocabulary"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input vocabulary name!' }]}
          >
            <Input placeholder="e.g., CET-4, IELTS, etc." />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Optional description" rows={3} />
          </Form.Item>

          <Form.Item label="Color" name="color">
            <Input placeholder="e.g., #1890ff" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
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

export default VocabularyList
