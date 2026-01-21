import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Space,
  Typography,
  Layout,
  Input,
  Radio,
  Progress,
  message,
  Result
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  SoundOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Header, Content } = Layout

interface Word {
  id: number
  word: string
  pronunciation?: string
  definitions?: Array<{ meaning: string; part_of_speech?: string }>
  examples?: Array<{ sentence: string; translation?: string }>
}

type StudyMode = 'spelling' | 'selectMeaning' | 'selectFromExample'

interface Question {
  mode: StudyMode
  word: Word
  options?: string[] // 用于选择题
}

function Study(): JSX.Element {
  const { vocabularyId } = useParams<{ vocabularyId: string }>()
  const navigate = useNavigate()
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  // 加载单词
  useEffect(() => {
    loadWords()
  }, [vocabularyId])

  const loadWords = async () => {
    try {
      const result = await window.api.word.getByVocabulary(Number(vocabularyId))
      if (result.length === 0) {
        message.warning('该单词本暂无单词，无法开始学习')
        navigate(-1)
        return
      }
      // 随机打乱单词顺序
      const shuffled = [...result].sort(() => Math.random() - 0.5)
      setWords(shuffled)
      generateQuestion(shuffled, 0)
    } catch (error) {
      console.error('Failed to load words:', error)
      message.error('加载单词失败')
    }
  }

  // 生成题目
  const generateQuestion = (wordList: Word[], index: number) => {
    if (index >= wordList.length) {
      setFinished(true)
      return
    }

    const word = wordList[index]
    const modes: StudyMode[] = ['spelling', 'selectMeaning', 'selectFromExample']

    // 如果没有例句，排除例句模式
    if (!word.examples || word.examples.length === 0) {
      modes.splice(modes.indexOf('selectFromExample'), 1)
    }

    // 随机选择模式
    const mode = modes[Math.floor(Math.random() * modes.length)]

    // 如果是选择题模式，生成选项
    let options: string[] = []
    if (mode === 'selectMeaning' || mode === 'selectFromExample') {
      options = generateOptions(word, wordList)
    }

    setCurrentQuestion({ mode, word, options })
    setUserAnswer('')
    setSelectedOption('')
    setShowAnswer(false)
    setIsCorrect(null)
  }

  // 生成选择题选项
  const generateOptions = (correctWord: Word, allWords: Word[]): string[] => {
    const correctAnswer = correctWord.definitions?.[0]?.meaning || ''
    const options = [correctAnswer]

    // 从其他单词中随机选择3个作为干扰项
    const otherWords = allWords.filter(w => w.id !== correctWord.id)
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5)

    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      const meaning = shuffled[i].definitions?.[0]?.meaning
      if (meaning && !options.includes(meaning)) {
        options.push(meaning)
      }
    }

    // 如果选项不足4个，补充"以上都不对"
    while (options.length < 4) {
      options.push(`选项 ${options.length}`)
    }

    // 随机打乱选项
    return options.sort(() => Math.random() - 0.5)
  }

  // 检查答案
  const checkAnswer = () => {
    if (!currentQuestion) return

    const { mode, word } = currentQuestion
    let correct = false

    if (mode === 'spelling') {
      correct = userAnswer.trim().toLowerCase() === word.word.toLowerCase()
    } else {
      const correctAnswer = word.definitions?.[0]?.meaning || ''
      correct = selectedOption === correctAnswer
    }

    setIsCorrect(correct)
    setShowAnswer(true)
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }))
  }

  // 下一题
  const nextQuestion = () => {
    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    generateQuestion(words, nextIndex)
  }

  // 忘记了
  const handleForgot = () => {
    setShowAnswer(true)
    setIsCorrect(false)
    setScore(prev => ({
      correct: prev.correct,
      total: prev.total + 1
    }))
  }

  // 发音
  const handlePronounce = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  // 渲染题目内容
  const renderQuestion = () => {
    if (!currentQuestion) return null

    const { mode, word, options } = currentQuestion

    switch (mode) {
      case 'spelling':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 16 }}>根据释义拼写单词</Text>
            </div>
            <Card style={{ background: '#f0f5ff', border: 'none' }}>
              <Space direction="vertical" size="small">
                {word.definitions?.map((def, idx) => (
                  <div key={idx}>
                    {def.part_of_speech && (
                      <Text strong style={{ color: '#1890ff' }}>{def.part_of_speech}. </Text>
                    )}
                    <Text style={{ fontSize: 18 }}>{def.meaning}</Text>
                  </div>
                ))}
              </Space>
            </Card>
            <Input
              size="large"
              placeholder="请输入单词"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onPressEnter={checkAnswer}
              disabled={showAnswer}
              style={{ fontSize: 20, textAlign: 'center', maxWidth: 400, margin: '0 auto' }}
            />
          </Space>
        )

      case 'selectMeaning':
        return (
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 16 }}>选择正确的释义</Text>
            </div>
            <div>
              <Space align="baseline">
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  {word.word}
                </Title>
                <Button
                  type="text"
                  icon={<SoundOutlined />}
                  onClick={() => handlePronounce(word.word)}
                  style={{ color: '#52c41a' }}
                />
                {word.pronunciation && (
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    [{word.pronunciation}]
                  </Text>
                )}
              </Space>
            </div>
            <Radio.Group
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={showAnswer}
              style={{ width: '100%', maxWidth: 600 }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {options?.map((option, idx) => (
                  <Radio.Button
                    key={idx}
                    value={option}
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: 16
                    }}
                  >
                    {option}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </Space>
        )

      case 'selectFromExample':
        const example = word.examples?.[0]
        return (
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 16 }}>根据例句选择正确的释义</Text>
            </div>
            <Card style={{ background: '#f0f5ff', border: 'none', maxWidth: 600, margin: '0 auto' }}>
              <Paragraph style={{ fontSize: 18, marginBottom: 8 }}>
                {example?.sentence}
              </Paragraph>
              {example?.translation && (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {example.translation}
                </Text>
              )}
            </Card>
            <Radio.Group
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={showAnswer}
              style={{ width: '100%', maxWidth: 600 }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {options?.map((option, idx) => (
                  <Radio.Button
                    key={idx}
                    value={option}
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: 16
                    }}
                  >
                    {option}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </Space>
        )
    }
  }

  // 渲染答案
  const renderAnswer = () => {
    if (!showAnswer || !currentQuestion) return null

    const { word } = currentQuestion

    return (
      <Card
        style={{
          marginTop: 24,
          borderColor: isCorrect ? '#52c41a' : '#ff4d4f',
          borderWidth: 2
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            {isCorrect ? (
              <Space>
                <CheckOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>回答正确！</Text>
              </Space>
            ) : (
              <Space>
                <CloseOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>回答错误</Text>
              </Space>
            )}
          </div>

          <div>
            <Space align="baseline">
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {word.word}
              </Title>
              <Button
                type="text"
                icon={<SoundOutlined />}
                onClick={() => handlePronounce(word.word)}
                style={{ color: '#52c41a' }}
              />
              {word.pronunciation && (
                <Text type="secondary">[{word.pronunciation}]</Text>
              )}
            </Space>
          </div>

          <div>
            <Text strong>释义：</Text>
            <div style={{ marginTop: 8 }}>
              {word.definitions?.map((def, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  {def.part_of_speech && (
                    <Text type="secondary">{def.part_of_speech}. </Text>
                  )}
                  <Text>{def.meaning}</Text>
                </div>
              ))}
            </div>
          </div>

          {word.examples && word.examples.length > 0 && (
            <div>
              <Text strong>例句：</Text>
              <div style={{ marginTop: 8 }}>
                {word.examples.map((example, idx) => (
                  <div key={idx} style={{ marginBottom: 8, paddingLeft: 12, borderLeft: '2px solid #1890ff' }}>
                    <div>{example.sentence}</div>
                    {example.translation && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {example.translation}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Space>
      </Card>
    )
  }

  if (finished) {
    const percentage = words.length > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: 24 }}>
          <Result
            status="success"
            title="学习完成！"
            subTitle={`完成了 ${score.total} 个单词的学习，正确率 ${percentage}%`}
            extra={[
              <Button type="primary" key="again" onClick={() => {
                setCurrentIndex(0)
                setScore({ correct: 0, total: 0 })
                setFinished(false)
                loadWords()
              }}>
                再学一遍
              </Button>,
              <Button key="back" onClick={() => navigate(-1)}>
                返回单词本
              </Button>
            ]}
          >
            <Card>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>总题数：</Text>
                  <Text strong>{score.total}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>正确数：</Text>
                  <Text strong style={{ color: '#52c41a' }}>{score.correct}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>错误数：</Text>
                  <Text strong style={{ color: '#ff4d4f' }}>{score.total - score.correct}</Text>
                </div>
              </Space>
            </Card>
          </Result>
        </Content>
      </Layout>
    )
  }

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
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          size="large"
        >
          退出学习
        </Button>
        <Space>
          <Text type="secondary">
            进度: {currentIndex + 1} / {words.length}
          </Text>
          <Text type="secondary">|</Text>
          <Text type="secondary">
            正确率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
          </Text>
        </Space>
      </Header>

      <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto', flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Progress
            percent={Math.round(((currentIndex + 1) / words.length) * 100)}
            strokeColor="#1890ff"
            style={{ marginBottom: 24 }}
          />

          <Card>
            {renderQuestion()}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              {!showAnswer ? (
                <Space size="middle">
                  <Button
                    size="large"
                    icon={<QuestionCircleOutlined />}
                    onClick={handleForgot}
                  >
                    我忘记了
                  </Button>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={() => setShowAnswer(true)}
                  >
                    查看答案
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    onClick={checkAnswer}
                    disabled={
                      (currentQuestion?.mode === 'spelling' && !userAnswer.trim()) ||
                      ((currentQuestion?.mode === 'selectMeaning' || currentQuestion?.mode === 'selectFromExample') && !selectedOption)
                    }
                  >
                    提交答案
                  </Button>
                </Space>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={nextQuestion}
                >
                  下一题
                </Button>
              )}
            </div>

            {renderAnswer()}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}

export default Study
