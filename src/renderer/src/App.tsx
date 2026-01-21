import { Routes, Route } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import VocabularyList from './pages/VocabularyList'
import WordList from './pages/WordList'
import Study from './pages/Study'

function App(): JSX.Element {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
        },
      }}
    >
      <Routes>
        <Route path="/" element={<VocabularyList />} />
        <Route path="/vocabulary/:vocabularyId/words" element={<WordList />} />
        <Route path="/vocabulary/:vocabularyId/study" element={<Study />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App
