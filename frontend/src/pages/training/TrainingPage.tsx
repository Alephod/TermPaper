import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { QuestionCard } from '../../components/training/QuestionCard'
import { TrainingIdle } from '../../components/training/TrainingIdle'
import { TrainingSummary } from '../../components/training/TrainingSummary'
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

  const sessionSavedRef = useRef<boolean>(false)

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

  // Get current deck name for display

  const currentDeckName = useMemo(() => {
    if (!currentDeckId) return null

    const deck = decks.find((d) => d.id === currentDeckId)

    return deck?.name || null
  }, [decks, currentDeckId])

  // Filter dictionary based on current deck
  const trainingDictionary = useMemo(() => {
    if (savedQuestions) {
      // Use saved questions, don't rebuild
      return []
    }
    if (!currentDeckId) {
      // Limit to max 40 words for "all words" training
      return dictionary.slice(0, MAX_WORDS_PER_TRAINING)
    }

    const deck = decks.find((d) => d.id === currentDeckId)

    if (!deck) return dictionary.slice(0, MAX_WORDS_PER_TRAINING)

    return dictionary.filter((word) => deck.wordIds.includes(word.id))
  }, [dictionary, decks, currentDeckId, savedQuestions])

  const questions = useMemo(() => {
    if (savedQuestions) return savedQuestions
    if (trainingDictionary.length < MIN_WORDS_FOR_TRAINING) {
      return []
    }

    return buildQuestions(trainingDictionary)
  }, [trainingDictionary, savedQuestions])

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

  const currentQuestion: TrainingQuestion | undefined =
    questions[questionState.currentIndex]

  const handleStartTraining = () => {
    // Clear any saved session
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TRAINING_STORAGE_KEY)
    }
    setSavedQuestions(null)
    sessionSavedRef.current = false

    setStep('questions')
    setQuestionState({
      currentIndex: 0,
      selectedOptionId: null,

      isCorrect: null
    })
    setCorrectWordIds([])
    setWrongWordIds([])
  }

  const handleContinueTraining = () => {
    // Already restored from localStorage in useEffect
    setStep('questions')
  }

  const handleResetTraining = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TRAINING_STORAGE_KEY)
    }
    setSavedQuestions(null)
    sessionSavedRef.current = false
    handleStartTraining()
  }

  const handleSelectOption = (optionId: string): void => {
    if (!currentQuestion) return

    const isCorrect = optionId === currentQuestion.correctOptionId

    setQuestionState((previous) => ({
      ...previous,
      selectedOptionId: optionId,

      isCorrect
    }))

    if (isCorrect) {
      setCorrectWordIds((previous) => [...previous, currentQuestion.wordId])
    } else {
      setWrongWordIds((previous) => [...previous, currentQuestion.wordId])
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
        onStartTraining={handleStartTraining}
        onContinueTraining={handleContinueTraining}
        onResetTraining={handleResetTraining}
        onGoToDictionary={onGoToDictionary}
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
