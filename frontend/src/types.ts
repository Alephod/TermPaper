export type Word = {
  id: string
  term: string
  translation: string
  example: string
  exampleTranslation: string
}

export type Deck = {
  id: string
  name: string
  words: Word[]
}

// ==== Словарь + колоды ====

export type Difficulty = 'easy' | 'medium' | 'hard'

export type FilterDifficulty = Difficulty | 'all'

export type DictionaryEntry = {
  id: string
  term: string
  translation: string
  difficulty: Difficulty
  example: string
  exampleTranslation: string
  imageUrl?: string | null
  imagePath?: string | null
}

export type DictionaryDeck = {
  id: string
  name: string
  wordIds: string[]
}

// ==== Тренировка ====

export type QuestionType =
	| 'term-to-translation'
	| 'translation-to-term'
	| 'image-to-term'
	| 'term-to-image'

export type TrainingQuestion = {
  id: string
  wordId: string
  type: QuestionType
  prompt: string
  promptImageUrl?: string | null
  correctOptionId: string
  options: { id: string; text: string; imageUrl?: string | null }[]
}

export type TrainingSession = {
  id: string
  date: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  correctWordIds: string[]
  wrongWordIds: string[]
}
