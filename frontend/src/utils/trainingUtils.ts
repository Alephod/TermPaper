import type { DictionaryEntry, QuestionType, TrainingQuestion } from '../types'

export const MIN_WORDS_FOR_TRAINING = 4
export const MAX_WORDS_PER_TRAINING = 40
export const TRAINING_STORAGE_KEY = 'training_session'

export const shuffleArray = <TData,>(items: TData[]): TData[] => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temporary = copy[index]
    copy[index] = copy[randomIndex]
    copy[randomIndex] = temporary
  }
  return copy
}

export const QUESTION_TYPES: QuestionType[] = [
  'term-to-translation',
  'translation-to-term',
  'image-to-term',
  'term-to-image'
]

export const getRandomQuestionType = (): QuestionType => {
  return QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)]
}

export const buildQuestionByType = (
  word: DictionaryEntry,
  otherWords: DictionaryEntry[],
  type: QuestionType
): TrainingQuestion => {
  const allWords = [word, ...otherWords]

  switch (type) {
  case 'term-to-translation':
    return {
      id: `q-${word.id}-ttt`,
      wordId: word.id,
      type: 'term-to-translation',
      prompt: word.term,
      correctOptionId: word.id,
      options: shuffleArray(allWords.map(w => ({ id: w.id, text: w.translation })))
    }

  case 'translation-to-term':
    return {
      id: `q-${word.id}-ttt`,
      wordId: word.id,
      type: 'translation-to-term',
      prompt: word.translation,
      correctOptionId: word.id,
      options: shuffleArray(allWords.map(w => ({ id: w.id, text: w.term })))
    }

  case 'image-to-term':
    return {
      id: `q-${word.id}-itt`,
      wordId: word.id,
      type: 'image-to-term',
      prompt: '',
      promptImageUrl: word.imageUrl,
      correctOptionId: word.id,
      options: shuffleArray(allWords.map(w => ({ id: w.id, text: w.term })))
    }

  case 'term-to-image':
    return {
      id: `q-${word.id}-tti`,
      wordId: word.id,
      type: 'term-to-image',
      prompt: word.term,
      correctOptionId: word.id,
      options: shuffleArray(
        allWords.map(w => ({
          id: w.id,
          text: w.term,
          imageUrl: w.imageUrl
        }))
      )
    }

  default:
    return {
      id: `q-${word.id}-ttt`,
      wordId: word.id,
      type: 'term-to-translation',
      prompt: word.term,
      correctOptionId: word.id,
      options: shuffleArray(allWords.map(w => ({ id: w.id, text: w.translation })))
    }
  }
}

export const isWordDueForReview = (word: DictionaryEntry): boolean => {
  if (!word.sm2NextReview) return true
  return new Date(word.sm2NextReview) <= new Date()
}

export const selectWordsForTraining = (
  dictionary: DictionaryEntry[],
  maxWords: number = MAX_WORDS_PER_TRAINING
): DictionaryEntry[] => {
  return dictionary
    .filter((word) => isWordDueForReview(word))
    .sort((a, b) => {
      if (!a.sm2NextReview) return -1
      if (!b.sm2NextReview) return 1
      return new Date(a.sm2NextReview).getTime() - new Date(b.sm2NextReview).getTime()
    })
    .slice(0, maxWords)
}

export const buildQuestions = (dictionary: DictionaryEntry[]): TrainingQuestion[] => {
  const shuffledWords = shuffleArray(dictionary)

  return shuffledWords.map((word) => {
    const type = getRandomQuestionType()
    const otherWords = shuffledWords
      .filter((entry) => entry.id !== word.id)
      .slice(0, 3)

    // Проверка что у проверяемого слова есть картинка
    if (type === 'image-to-term' && !word.imageUrl) {
      return buildQuestionByType(word, otherWords, 'term-to-translation')
    }

    // Проверка что у всех вариантов ответа есть картинки
    if (type === 'term-to-image') {
      const hasMissingImage = [word, ...otherWords].some(w => !w.imageUrl)
      if (hasMissingImage) {
        return buildQuestionByType(word, otherWords, 'term-to-translation')
      }
    }

    return buildQuestionByType(word, otherWords, type)
  })
}
