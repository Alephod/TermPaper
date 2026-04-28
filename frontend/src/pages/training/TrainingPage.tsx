import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { QuestionCard } from '../../components/training/QuestionCard'
import { TrainingIdle } from '../../components/training/TrainingIdle'
import { TrainingSummary } from '../../components/training/TrainingSummary'
import { apiClient } from '../../services/api'
import type {
  DictionaryDeck,
  DictionaryEntry,
  TrainingQuestion,
  TrainingSession
} from '../../types'
import {
  buildQuestions,
  MAX_WORDS_PER_TRAINING,
  MIN_WORDS_FOR_TRAINING,
  TRAINING_STORAGE_KEY
} from '../../utils/trainingUtils'

import './TrainingPage.css'

type TrainingPageProps = {
	dictionary: DictionaryEntry[];
	decks: DictionaryDeck[];
	onFinishSession: (session: TrainingSession) => void;
	onGoToDictionary: () => void;
};

type TrainingStep = 'idle' | 'questions' | 'summary';

type QuestionState = {
	currentIndex: number;
	selectedOptionId: string | null;
	isCorrect: boolean | null;
};

export const TrainingPage: React.FC<TrainingPageProps> = ({
  dictionary,
  decks,
  onFinishSession,
  onGoToDictionary
}) => {
  const [step, setStep] = useState<TrainingStep>('idle')
  const [questionState, setQuestionState] = useState<QuestionState>({
    currentIndex: 0,
    selectedOptionId: null,
    isCorrect: null
  })
  const [correctWordIds, setCorrectWordIds] = useState<string[]>([])
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([])

  const [savedQuestions, setSavedQuestions] = useState<
		TrainingQuestion[] | null
	>(null)
  const [trainingWords, setTrainingWords] = useState<DictionaryEntry[]>([])
  const [wordsDueToday, setWordsDueToday] = useState<number>(0)
  const [wordsReviewedToday, setWordsReviewedToday] = useState<number>(0)
  const [isStartingTraining, setIsStartingTraining] = useState<boolean>(false)
  const sessionSavedRef = useRef<boolean>(false)
  const questionStartTimeRef = useRef<number>(0)

  // Get current deck ID from localStorage (set when clicking "Train" in deck)

  const currentDeckId =
		typeof window !== 'undefined'
		  ? localStorage.getItem('currentDeckId')
		  : null

  // Restore saved training session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem(TRAINING_STORAGE_KEY)
    if (saved) {
      try {
        const session = JSON.parse(saved)
        setSavedQuestions(session.questions)
        setQuestionState(session.questionState)
        setCorrectWordIds(session.correctWordIds)
        setWrongWordIds(session.wrongWordIds)
        setStep('questions')
      } catch {
        localStorage.removeItem(TRAINING_STORAGE_KEY)
      }
    }
  }, [])

  // Загрузка статистики SM-2
  useEffect(() => {
    const loadSM2Stats = async () => {
      try {
        const stats = await apiClient.getSM2Stats()
        setWordsDueToday(stats.wordsDueToday)
        setWordsReviewedToday(stats.wordsReviewedToday)
      } catch (error) {
        console.error('Failed to load SM-2 stats:', error)
      }
    }
    loadSM2Stats()
  }, [])

  // Get current deck name for display

  const currentDeckName = useMemo(() => {
    if (!currentDeckId) return null

    const deck = decks.find((d) => d.id === currentDeckId)

    return deck?.name || null
  }, [decks, currentDeckId])

  // Get word IDs for current deck
  const deckWordIds = useMemo(() => {
    if (!currentDeckId) return []
    const deck = decks.find((d) => d.id === currentDeckId)
    return deck?.wordIds || []
  }, [decks, currentDeckId])

  // Filter dictionary for TrainingIdle display (all words in deck/dictionary)
  const trainingDictionary = useMemo(() => {
    if (!currentDeckId) {
      return dictionary.slice(0, MAX_WORDS_PER_TRAINING)
    }
    const deck = decks.find((d) => d.id === currentDeckId)
    if (!deck) return dictionary.slice(0, MAX_WORDS_PER_TRAINING)
    return dictionary.filter((word) => deck.wordIds.includes(word.id))
  }, [dictionary, decks, currentDeckId])

  const questions = useMemo(() => {
    if (savedQuestions) return savedQuestions
    if (trainingWords.length < MIN_WORDS_FOR_TRAINING) {
      console.log('questions: trainingWords.length < MIN_WORDS_FOR_TRAINING', trainingWords.length, '<', MIN_WORDS_FOR_TRAINING)
      return []
    }

    const built = buildQuestions(trainingWords)
    console.log('questions: построено', built.length, 'вопросов из', trainingWords.length, 'слов')
    return built
  }, [trainingWords, savedQuestions])

  const currentQuestion: TrainingQuestion | undefined =
		questions[questionState.currentIndex]

  // Обновление времени начала вопроса при смене вопроса
  useEffect(() => {
    if (step === 'questions' && currentQuestion) {
      questionStartTimeRef.current = Date.now()
    }
  }, [step, currentQuestion])

  useEffect(() => {
    console.log('useEffect: isStartingTraining=', isStartingTraining, 'trainingWords.length=', trainingWords.length)
    if (isStartingTraining && trainingWords.length > 0) {
      console.log('Переключение на questions, trainingWords:', trainingWords)
      setStep('questions')
      setQuestionState({
        currentIndex: 0,
        selectedOptionId: null,
        isCorrect: null
      })
      setCorrectWordIds([])
      setWrongWordIds([])
      setIsStartingTraining(false)
    }
  }, [isStartingTraining, trainingWords])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (step !== 'questions') return

    localStorage.setItem(
      TRAINING_STORAGE_KEY,
      JSON.stringify({
        questions: savedQuestions || questions,
        questionState,
        correctWordIds,
        wrongWordIds,
        deckId: currentDeckId
      })
    )
  }, [
    step,
    questionState,
    correctWordIds,
    wrongWordIds,
    savedQuestions,
    questions,
    currentDeckId
  ])

  const handleStartTraining = async () => {
    // Clear any saved session and go to idle
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TRAINING_STORAGE_KEY)
    }
    setSavedQuestions(null)
    sessionSavedRef.current = false
    setTrainingWords([])
    setCorrectWordIds([])
    setWrongWordIds([])
    setStep('idle')
  }

  const handleLoadAndStartTraining = async () => {
    setTrainingWords([])
    setCorrectWordIds([])
    setWrongWordIds([])
    setIsStartingTraining(true)

    // Загрузка слов для повторения
    try {
      const words = await apiClient.getWordsForReview(
        deckWordIds,
        MAX_WORDS_PER_TRAINING
      )
      const dictionaryEntries = words.map((w) =>
        apiClient.wordToDictionaryEntry(w)
      )
      console.log('Слова для повторения:', dictionaryEntries)

      if (dictionaryEntries.length === 0) {
        // Если по SM-2 на сегодня слов нет — обычная тренировка по всем словам
        const fallbackWords = trainingDictionary.slice(0, MAX_WORDS_PER_TRAINING)
        console.log('Обычная тренировка (SM-2 пусто):', fallbackWords)
        setTrainingWords(fallbackWords)
      } else {
        setTrainingWords(dictionaryEntries)
      }
    } catch (error) {
      console.error('Failed to load training words:', error)
      setTrainingWords([])
      setIsStartingTraining(false)
    }
  }

  // Восстановление слов для повторения из сохраненных вопросов
  const handleContinueTraining = () => {
    if (savedQuestions && savedQuestions.length > 0) {
      const wordIds = [...new Set(savedQuestions.map((q) => q.wordId))]
      const words = dictionary.filter((w) => wordIds.includes(w.id))
      setTrainingWords(words)
    }
    setStep('questions')
  }

  const handleResetTraining = () => {
    handleStartTraining()
  }

  const handleSelectOption = async (optionId: string): Promise<void> => {
    if (!currentQuestion) return

    const isCorrect = optionId === currentQuestion.correctOptionId
    const responseTime = Date.now() - questionStartTimeRef.current

    setQuestionState((previous) => ({
      ...previous,
      selectedOptionId: optionId,
      isCorrect
    }))

    let quality = 0
    if (isCorrect) {
      setCorrectWordIds((previous) => [...previous, currentQuestion.wordId])
      // Вычисление качества по времени ответа (SM-2: 0-5)
      if (responseTime < 5000) {
        quality = 5 // Менее 5 сек - идеальный отв  ет
      } else if (responseTime < 10000) {
        quality = 4 // 5-10 сек - хороший ответ
      } else if (responseTime < 15000) {
        quality = 3 // 10-15 сек - нормальный ответ
      } else {
        quality = 2 // Более 15 сек - медленный ответ
      }
    } else {
      setWrongWordIds((previous) => [...previous, currentQuestion.wordId])
      quality = 0 // Неправильный ответ
    }

    // Отправка качества ответа на бэкенд
    try {
      console.log(`Отправка качества ответа: wordId=${currentQuestion.wordId}, quality=${quality}, responseTime=${responseTime}ms`)
      await apiClient.submitReview(currentQuestion.wordId, quality)
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  const handleNextQuestion = (): void => {
    if (questions.length === 0) return

    if (questionState.currentIndex === questions.length - 1) {
      // Prevent double saving (use ref for sync check)
      if (sessionSavedRef.current) return
      sessionSavedRef.current = true

      const totalQuestions = questions.length
      const correctAnswers = correctWordIds.length

      const accuracy =
				totalQuestions === 0
				  ? 0
				  : Math.round((correctAnswers / totalQuestions) * 100)

      const session: TrainingSession = {
        id: `session-${Date.now().toString()}`,
        date: new Date().toISOString(),
        totalQuestions,
        correctAnswers,
        accuracy,
        correctWordIds,
        wrongWordIds
      }

      onFinishSession(session)
      setStep('summary')
      // Clear saved session on completion
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TRAINING_STORAGE_KEY)
        localStorage.removeItem('currentDeckId')
      }
      return
    }

    setQuestionState((previous) => ({
      currentIndex: previous.currentIndex + 1,
      selectedOptionId: null,

      isCorrect: null
    }))
  }

  console.log('Render: step=', step, 'questions.length=', questions.length, 'currentQuestion=', currentQuestion)

  // Idle state
  if (step === 'idle') {
    return (
      <TrainingIdle
        hasSavedSession={!!savedQuestions}
        savedQuestionsCount={savedQuestions?.length ?? 0}
        currentQuestionIndex={questionState.currentIndex}
        correctCount={correctWordIds.length}
        wrongCount={wrongWordIds.length}
        trainingDictionary={trainingDictionary}
        currentDeckName={currentDeckName}
        onStartTraining={handleLoadAndStartTraining}
        onContinueTraining={handleContinueTraining}
        onResetTraining={handleResetTraining}
        onGoToDictionary={onGoToDictionary}
        wordsDueToday={wordsDueToday}
        wordsReviewedToday={wordsReviewedToday}
      />
    )
  }

  // Summary state
  if (step === 'summary') {
    return (
      <TrainingSummary
        totalQuestions={questions.length}
        correctAnswers={correctWordIds.length}
        onStartNewTraining={handleStartTraining}
      />
    )
  }

  if (!currentQuestion) {
    return null
  }

  // Question state
  return (
    <QuestionCard
      question={currentQuestion}
      selectedOptionId={questionState.selectedOptionId}
      isCorrect={questionState.isCorrect}
      currentIndex={questionState.currentIndex}
      totalQuestions={questions.length}
      onSelectOption={handleSelectOption}
      onNext={handleNextQuestion}
    />
  )
}
