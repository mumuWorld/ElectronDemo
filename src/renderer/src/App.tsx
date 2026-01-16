import { Routes, Route } from 'react-router-dom'
import VocabularyList from './pages/VocabularyList'
import WordList from './pages/WordList'

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<VocabularyList />} />
      <Route path="/vocabulary/:vocabularyId/words" element={<WordList />} />
    </Routes>
  )
}

export default App
