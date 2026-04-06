import React, { useEffect, useMemo, useState } from 'react'
import type { Deck, Word } from '../../types'

type LearningMode = 'linear' | 'anki'

type FlashcardTrainerProps = {
  deck: Deck | undefined
}

export const FlashcardTrainer: React.FC<FlashcardTrainerProps> = ({ deck }) => {
  const [mode, setMode] = useState<LearningMode>('linear')
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [linearIndex, setLinearIndex] = useState<number>(0)
  const [ankiQueue, setAnkiQueue] = useState<string[]>([])
  const [ankiDifficult, setAnkiDifficult] = useState<string[]>([])
  const [ankiIndex, setAnkiIndex] = useState<number>(0)

  useEffect(() => {
    setIsFlipped(false)
    setLinearIndex(0)
    if (deck) {
      const ids = deck.words.map(word => word.id)
      setAnkiQueue(ids)
    } else {
      setAnkiQueue([])
    }
    setAnkiDifficult([])
    setAnkiIndex(0)
  }, [deck])

  const handleModeChange = (newMode: LearningMode): void => {
    setMode(newMode)
    setIsFlipped(false)
    if (newMode === 'linear') {
      setLinearIndex(0)
    } else if (deck) {
      const ids = deck.words.map(word => word.id)
      setAnkiQueue(ids)
      setAnkiDifficult([])
      setAnkiIndex(0)
    }
  }

  const currentWord: Word | undefined = useMemo(() => {
    if (!deck || deck.words.length === 0) {
      return undefined
    }

    if (mode === 'linear') {
      const safeIndex = Math.min(linearIndex, deck.words.length - 1)
      return deck.words[safeIndex]
    }

    if (ankiQueue.length === 0) {
      return undefined
    }

    const safeIndex = Math.min(ankiIndex, ankiQueue.length - 1)
    const currentId = ankiQueue[safeIndex]
    return deck.words.find(word => word.id === currentId)
  }, [deck, mode, linearIndex, ankiQueue, ankiIndex])

  const handleCardClick = (): void => {
    if (!currentWord) {
      return
    }
    setIsFlipped(prev => !prev)
  }

  const handleNextLinear = (): void => {
    if (!deck || deck.words.length === 0) {
      return
    }

    setIsFlipped(false)
    setLinearIndex(prev => {
      const next = prev + 1
      if (next >= deck.words.length) {
        return 0
      }
      return next
    })
  }

  const handleRemember = (): void => {
    if (!deck || ankiQueue.length === 0) {
      return
    }

    const currentId = ankiQueue[Math.min(ankiIndex, ankiQueue.length - 1)]
    const newDifficult = ankiDifficult.filter(id => id !== currentId)
    let newQueue = ankiQueue.filter((_, index) => index !== ankiIndex)
    let newIndex = ankiIndex

    if (newQueue.length === 0) {
      if (newDifficult.length === 0) {
        newQueue = deck.words.map(word => word.id)
      } else {
        newQueue = [...newDifficult]
      }
      newIndex = 0
    } else if (newIndex >= newQueue.length) {
      newIndex = 0
    }

    setAnkiDifficult(newDifficult)
    setAnkiQueue(newQueue)
    setAnkiIndex(newIndex)
    setIsFlipped(false)
  }

  const handleDontRemember = (): void => {
    if (!deck || ankiQueue.length === 0) {
      return
    }

    const currentId = ankiQueue[Math.min(ankiIndex, ankiQueue.length - 1)]
    const alreadyDifficult = ankiDifficult.includes(currentId)
    const newDifficult = alreadyDifficult ? ankiDifficult : [...ankiDifficult, currentId]

    let newQueue = ankiQueue.filter((_, index) => index !== ankiIndex)
    let newIndex = ankiIndex

    if (newQueue.length === 0) {
      if (newDifficult.length === 0) {
        newQueue = deck.words.map(word => word.id)
      } else {
        newQueue = [...newDifficult]
      }
      newIndex = 0
    } else if (newIndex >= newQueue.length) {
      newIndex = 0
    }

    setAnkiDifficult(newDifficult)
    setAnkiQueue(newQueue)
    setAnkiIndex(newIndex)
    setIsFlipped(false)
  }

  if (!deck) {
    return (
      <div className='trainer-panel__inner'>
        <h2 className='trainer-title'>Карточки для запоминания</h2>
        <p className='trainer-empty'>Выберите колоду слева, чтобы начать тренироваться</p>
      </div>
    )
  }

  return (
    <div className='trainer-panel__inner'>
      <div className='trainer-header'>
        <h2 className='trainer-title'>Карточки для запоминания</h2>
        <div className='trainer-modes'>
          <button
            type='button'
            className={`trainer-mode-button ${
              mode === 'linear' ? 'trainer-mode-button--active' : ''
            }`}
            onClick={() => handleModeChange('linear')}
          >
            Последовательно
          </button>
          <button
            type='button'
            className={`trainer-mode-button ${
              mode === 'anki' ? 'trainer-mode-button--active' : ''
            }`}
            onClick={() => handleModeChange('anki')}
          >
            Режим Anki
          </button>
        </div>
      </div>

      {currentWord ? (
        <>
          <div className='flashcard-container'>
            <div
              className={`flashcard ${isFlipped ? 'flashcard--flipped' : ''}`}
              onClick={handleCardClick}
            >
              <div className='flashcard__content'>
                {isFlipped ? currentWord.translation : currentWord.term}
              </div>
            </div>
            <p className='flashcard-hint'>Нажмите на карту, чтобы перевернуть</p>
          </div>

          <div className='trainer-controls'>
            {mode === 'linear' ? (
              <button
                type='button'
                className='trainer-button'
                onClick={handleNextLinear}
              >
                Следующая карточка
              </button>
            ) : (
              <div className='trainer-anki-controls'>
                <button
                  type='button'
                  className='trainer-button trainer-button--secondary'
                  onClick={handleDontRemember}
                >
                  Не помню
                </button>
                <button
                  type='button'
                  className='trainer-button trainer-button--primary'
                  onClick={handleRemember}
                >
                  Помню
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className='trainer-empty'>В этой колоде пока нет слов</p>
      )}
    </div>
  )
}
