import type React from 'react'
import type { DictionaryEntry } from '../../types'
import { MIN_WORDS_FOR_TRAINING } from '../../utils/trainingUtils'
import { Button } from '../ui/button/Button'

interface TrainingIdleProps {
  hasSavedSession: boolean;
  savedQuestionsCount: number;
  currentQuestionIndex: number;
  correctCount: number;
  wrongCount: number;
  trainingDictionary: DictionaryEntry[];
  currentDeckName: string | null;
  onStartTraining: () => void;
  onContinueTraining: () => void;
  onResetTraining: () => void;
  onGoToDictionary: () => void;
}

export const TrainingIdle: React.FC<TrainingIdleProps> = ({
  hasSavedSession,
  savedQuestionsCount,
  currentQuestionIndex,
  correctCount,
  wrongCount,
  trainingDictionary,
  currentDeckName,
  onStartTraining,
  onContinueTraining,
  onResetTraining,
  onGoToDictionary
}) => {
  const hasEnoughWords = trainingDictionary.length >= MIN_WORDS_FOR_TRAINING

  if (hasSavedSession) {
    return (
      <div className='training-page'>
        <div className='training__hero'>
          <div className='training__hero-content'>
            <h1 className='training__title'>🎯 Продолжить тренировку?</h1>
            <p className='training__subtitle'>
              У вас есть незавершенная тренировка ({currentQuestionIndex + 1} из{' '}
              {savedQuestionsCount} вопросов)
            </p>
            <div className='training__stats'>
              <div className='training__stat'>
                <span className='training__stat-value'>{correctCount}</span>
                <span className='training__stat-label'>правильных</span>
              </div>
              <div className='training__stat'>
                <span className='training__stat-value'>{wrongCount}</span>
                <span className='training__stat-label'>ошибок</span>
              </div>
            </div>
            <div className='training__secondary-actions'>
              <Button variant='primary' size='lg' onClick={onContinueTraining}>
                Продолжить
              </Button>
              <Button variant='secondary' onClick={onResetTraining}>
                Начать заново
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasEnoughWords) {
    return (
      <div className='training-page'>
        <div className='training__hero'>
          <div className='training__hero-content'>
            <h1 className='training__title'>🎯 Тренировка слов</h1>
            <p className='training__subtitle'>
              Недостаточно слов для тренировки. Добавьте минимум{' '}
              {MIN_WORDS_FOR_TRAINING} слова{' '}
              {currentDeckName ? `в колоду "${currentDeckName}"` : 'в словарь'}.
            </p>
            <div className='training__stats'>
              <div className='training__stat'>
                <span className='training__stat-value'>
                  {trainingDictionary.length}
                </span>
                <span className='training__stat-label'>
                  {currentDeckName ? 'слов в колоде' : 'слов в словаре'}
                </span>
              </div>
              <div className='training__stat'>
                <span className='training__stat-value'>
                  {MIN_WORDS_FOR_TRAINING - trainingDictionary.length}
                </span>
                <span className='training__stat-label'>нужно добавить</span>
              </div>
            </div>
            <Button variant='primary' size='lg' onClick={onGoToDictionary}>
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
            Проверьте свои знания! Тренировка включает{' '}
            {trainingDictionary.length} вопросов{' '}
            {currentDeckName
              ? `из колоды "${currentDeckName}"`
              : 'из вашего словаря'}
            .
          </p>
          <div className='training__stats'>
            <div className='training__stat'>
              <span className='training__stat-value'>
                {trainingDictionary.length}
              </span>
              <span className='training__stat-label'>
                {currentDeckName ? 'слов в колоде' : 'слов в словаре'}
              </span>
            </div>
            <div className='training__stat'>
              <span className='training__stat-value'>
                {trainingDictionary.length}
              </span>
              <span className='training__stat-label'>
                вопросов в тренировке
              </span>
            </div>
          </div>
          <div className='training__difficulty-info'>
            <h3>Сложность слов:</h3>
            <div className='training__difficulty-stats'>
              <div className='training__difficulty-stat'>
                <span className='training__difficulty-value'>
                  {
                    trainingDictionary.filter((w) => w.difficulty === 'easy')
                      .length
                  }
                </span>
                <span className='training__difficulty-label'> легких</span>
              </div>
              <div className='training__difficulty-stat'>
                <span className='training__difficulty-value'>
                  {
                    trainingDictionary.filter((w) => w.difficulty === 'medium')
                      .length
                  }
                </span>
                <span className='training__difficulty-label'> средних</span>
              </div>
              <div className='training__difficulty-stat'>
                <span className='training__difficulty-value'>
                  {
                    trainingDictionary.filter((w) => w.difficulty === 'hard')
                      .length
                  }
                </span>
                <span className='training__difficulty-label'> сложных</span>
              </div>
            </div>
          </div>
          <Button variant='primary' size='lg' onClick={onStartTraining}>
            🚀 Начать тренировку
          </Button>
        </div>
      </div>
    </div>
  )
}
