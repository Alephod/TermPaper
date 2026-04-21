import React, { useEffect, useMemo, useRef, useState } from 'react'
import type {
  DictionaryEntry,
  DictionaryDeck,
  TrainingQuestion,
  TrainingSession
} from '../../types'
import { Button } from '../../components/ui/button/Button'
import './TrainingPage.css'

type TrainingPageProps = {
  dictionary: DictionaryEntry[]
  decks: DictionaryDeck[]
  onFinishSession: (session: TrainingSession) => void
  onGoToDictionary: () => void
  onGoToStatistics: () => void
}

type TrainingStep = 'idle' | 'questions' | 'summary'

type QuestionState = {
  currentIndex: number
  selectedOptionId: string | null
  isCorrect: boolean | null
}

const MIN_WORDS_FOR_TRAINING = 3
const MAX_WORDS_PER_TRAINING = 40
const TRAINING_STORAGE_KEY = 'training_session'

const shuffleArray = <TData,>(items: TData[]): TData[] => {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temporary = copy[index]
    copy[index] = copy[randomIndex]
    copy[randomIndex] = temporary
  }

  return copy
}

const buildQuestions = (
  dictionary: DictionaryEntry[]
): TrainingQuestion[] => {
  const shuffledWords = shuffleArray(dictionary)

  return shuffledWords.map(word => {
    const otherWords = dictionary
      .filter(entry => entry.id !== word.id)
      .slice(0, 3)

    const options = shuffleArray([
      { id: word.id, text: word.translation },
      ...otherWords.map(w => ({ id: w.id, text: w.translation }))
    ])

    return {
      id: `q-${word.id}`,
      wordId: word.id,
      term: word.term,
      correctOptionId: word.id,
      options
    }
  })
}

export const TrainingPage: React.FC<TrainingPageProps> = ({
  dictionary,
  decks,
  onFinishSession,
  onGoToDictionary,
  onGoToStatistics
}) => {
  const [step, setStep] = useState<TrainingStep>('idle')
  const [questionState, setQuestionState] = useState<QuestionState>({
    currentIndex: 0,
    selectedOptionId: null,
    isCorrect: null
  })
  const [correctWordIds, setCorrectWordIds] = useState<string[]>([])
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([])
  const [savedQuestions, setSavedQuestions] = useState<TrainingQuestion[] | null>(null)
  const sessionSavedRef = useRef<boolean>(false)

  // Get current deck ID from localStorage (set when clicking "Train" in deck)
  const currentDeckId = typeof window !== 'undefined' ? localStorage.getItem('currentDeckId') : null

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
    const deck = decks.find(d => d.id === currentDeckId)
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

    const deck = decks.find(d => d.id === currentDeckId)
    if (!deck) return dictionary.slice(0, MAX_WORDS_PER_TRAINING)

    return dictionary.filter(word => deck.wordIds.includes(word.id))
  }, [dictionary, decks, currentDeckId, savedQuestions])

  const questions = useMemo(() => {
    if (savedQuestions) return savedQuestions
    if (trainingDictionary.length < MIN_WORDS_FOR_TRAINING) {
      return []
    }

    return buildQuestions(trainingDictionary)
  }, [trainingDictionary, savedQuestions])

  // Save training session after each answer
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (step !== 'questions') return

    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify({
      questions: savedQuestions || questions,
      questionState,
      correctWordIds,
      wrongWordIds,
      deckId: currentDeckId
    }))
  }, [step, questionState, correctWordIds, wrongWordIds, savedQuestions, questions, currentDeckId])

  const hasEnoughWords = trainingDictionary.length >= MIN_WORDS_FOR_TRAINING
  const currentQuestion: TrainingQuestion | undefined = questions[questionState.currentIndex]

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

    setQuestionState(previous => ({
      ...previous,
      selectedOptionId: optionId,
      isCorrect
    }))

    if (isCorrect) {
      setCorrectWordIds(previous => [...previous, currentQuestion.wordId])
    } else {
      setWrongWordIds(previous => [...previous, currentQuestion.wordId])
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
      const accuracy = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100)

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

    setQuestionState(previous => ({
      currentIndex: previous.currentIndex + 1,
      selectedOptionId: null,
      isCorrect: null
    }))
  }

  // Idle state - show start screen
  if (step === 'idle' && savedQuestions) {
    // Show continue/reset screen if there's a saved session
    return (
      <div className='training-page'>
        <div className='training__hero'>
          <div className='training__hero-content'>
            <h1 className='training__title'>🎯 Продолжить тренировку?</h1>
            <p className='training__subtitle'>
              У вас есть незавершенная тренировка ({questionState.currentIndex + 1} из {savedQuestions.length} вопросов)
            </p>

            <div className='training__stats'>
              <div className='training__stat'>
                <span className='training__stat-value'>{correctWordIds.length}</span>
                <span className='training__stat-label'>правильных</span>
              </div>
              <div className='training__stat'>
                <span className='training__stat-value'>{wrongWordIds.length}</span>
                <span className='training__stat-label'>ошибок</span>
              </div>
            </div>

            <div className='training__secondary-actions'>
              <Button
                variant='primary'
                size='lg'
                onClick={handleContinueTraining}
              >
                ▶️ Продолжить
              </Button>

              <Button
                variant='secondary'
                onClick={handleResetTraining}
              >
                🔄 Начать заново
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'idle') {
    if (!hasEnoughWords) {
      return (
        <div className='training-page'>
          <div className='training__hero'>
            <div className='training__hero-content'>
              <h1 className='training__title'>🎯 Тренировка слов</h1>
              <p className='training__subtitle'>
                Недостаточно слов для тренировки. Добавьте минимум {MIN_WORDS_FOR_TRAINING} слова {currentDeckName ? `в колоду "${currentDeckName}"` : 'в словарь'}.
              </p>
              <div className='training__stats'>
                <div className='training__stat'>
                  <span className='training__stat-value'>{trainingDictionary.length}</span>
                  <span className='training__stat-label'>{currentDeckName ? 'слов в колоде' : 'слов в словаре'}</span>
                </div>
                <div className='training__stat'>
                  <span className='training__stat-value'>{MIN_WORDS_FOR_TRAINING - trainingDictionary.length}</span>
                  <span className='training__stat-label'>нужно добавить</span>
                </div>
              </div>
              <Button
                variant='primary'
                size='lg'
                onClick={onGoToDictionary}
              >
                📝 Перейти к словарю
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className='training-page'>
        <div className='training__hero'>
          <div className='training__hero-content'>
            <h1 className='training__title'>🎯 Тренировка слов</h1>
            <p className='training__subtitle'>
              Проверьте свои знания! Тренировка включает {questions.length} вопросов {currentDeckName ? `из колоды "${currentDeckName}"` : 'из вашего словаря'}.
            </p>

            <div className='training__stats'>
              <div className='training__stat'>
                <span className='training__stat-value'>{trainingDictionary.length}</span>
                <span className='training__stat-label'>{currentDeckName ? 'слов в колоде' : 'слов в словаре'}</span>
              </div>
              <div className='training__stat'>
                <span className='training__stat-value'>{questions.length}</span>
                <span className='training__stat-label'>вопросов в тренировке</span>
              </div>
            </div>

            <div className='training__difficulty-info'>
              <h3>Сложность слов:</h3>
              <div className='training__difficulty-stats'>
                <div className='training__difficulty-stat'>
                  <span className='training__difficulty-value'>
                    {trainingDictionary.filter(w => w.difficulty === 'easy').length}
                  </span>
                  <span className='training__difficulty-label'>легких</span>
                </div>
                <div className='training__difficulty-stat'>
                  <span className='training__difficulty-value'>
                    {trainingDictionary.filter(w => w.difficulty === 'medium').length}
                  </span>
                  <span className='training__difficulty-label'>средних</span>
                </div>
                <div className='training__difficulty-stat'>
                  <span className='training__difficulty-value'>
                    {trainingDictionary.filter(w => w.difficulty === 'hard').length}
                  </span>
                  <span className='training__difficulty-label'>сложных</span>
                </div>
              </div>
            </div>

            <Button
              variant='primary'
              size='lg'
              onClick={handleStartTraining}
            >
              🚀 Начать тренировку
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Summary state
  if (step === 'summary') {
    const totalQuestions = questions.length
    const correctAnswers = correctWordIds.length
    const accuracy = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100)

    return (
      <div className='training-page'>
        <div className='training__summary'>
          <div className='training__summary-content'>
            <div className='training__summary-icon'>
              {accuracy >= 70 ? '🎉' : accuracy >= 40 ? '👍' : '💪'}
            </div>
            <h1 className='training__summary-title'>
              {accuracy >= 70 ? 'Отличная работа!' : accuracy >= 40 ? 'Хороший результат!' : 'Продолжайте тренироваться!'}
            </h1>

            <div className='training__summary-stats'>
              <div className='summary-stat'>
                <div className='summary-stat__value'>{totalQuestions}</div>
                <div className='summary-stat__label'>всего вопросов</div>
              </div>
              <div className='summary-stat'>
                <div className='summary-stat__value'>{correctAnswers}</div>
                <div className='summary-stat__label'>правильных ответов</div>
              </div>
              <div className='summary-stat'>
                <div className='summary-stat__value'>{accuracy}%</div>
                <div className='summary-stat__label'>точность</div>
              </div>
            </div>

            <div className='training__summary-message'>
              {accuracy >= 70 && (
                <p>Превосходный результат! Вы отлично знаете слова. Попробуйте тренировку по сложным словам.</p>
              )}
              {accuracy >= 40 && accuracy < 70 && (
                <p>Хороший результат! Обратите внимание на слова, в которых вы ошиблись.</p>
              )}
              {accuracy < 40 && (
                <p>Продолжайте тренироваться! Регулярная практика поможет улучшить ваши результаты.</p>
              )}
            </div>

            <div className='training__summary-actions'>
              <Button
                variant='primary'
                size='lg'
                onClick={handleStartTraining}
              >
                🔄 Начать новую тренировку
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const progress = ((questionState.currentIndex + 1) / questions.length) * 100

  return (
    <div className='training-page'>
      <div className='training__question'>
        <div className='training__question-header'>
          <div className='training__progress'>
            <div className='training__progress-text'>
              Вопрос {questionState.currentIndex + 1} из {questions.length}
            </div>
            <div className='training__progress-bar'>
              <div
                className='training__progress-fill'
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div key={questionState.currentIndex} className='training__question-card'>
          <div className='training__question-content'>
            <h2 className='training__term'>{currentQuestion.term}</h2>
            <p className='training__question-hint'>Выберите правильный перевод:</p>
          </div>

          <div className='training__options'>
            {currentQuestion.options.map(option => {
              const isSelected = questionState.selectedOptionId === option.id
              const isCorrectOption = option.id === currentQuestion.correctOptionId
              const showResult = questionState.selectedOptionId !== null

              let optionClass = 'training__option'

              if (showResult) {
                if (isCorrectOption) {
                  optionClass += ' training__option--correct'
                } else if (isSelected) {
                  optionClass += ' training__option--wrong'
                }
              } else if (isSelected) {
                optionClass += ' training__option--selected'
              }

              return (
                <button
                  key={option.id}
                  type='button'
                  className={optionClass}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={showResult}
                >
                  <span className='training__option-text'>{option.text}</span>
                </button>
              )
            })}
          </div>

          {questionState.selectedOptionId !== null && (
            <div className='training__feedback'>
              {questionState.isCorrect ? (
                <div className='training__feedback-correct'>
                  <span>Правильно!</span>
                </div>
              ) : (
                <div className='training__feedback-wrong'>
                  <span>Неверно. Правильный ответ: {currentQuestion.options.find(o => o.id === currentQuestion.correctOptionId)?.text}</span>
                </div>
              )}
            </div>
          )}

          {questionState.selectedOptionId !== null && (
            <Button
              variant='primary'
              size='lg'
              onClick={handleNextQuestion}
              className='training__next-button'
            >
              {questionState.currentIndex === questions.length - 1 ? 'Завершить' : 'Далее'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
