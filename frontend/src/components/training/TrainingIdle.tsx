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
  wordsDueToday?: number;
  wordsReviewedToday?: number;
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
  onGoToDictionary,
  wordsDueToday = 0,
  wordsReviewedToday = 0
}) => {
  const hasEnoughWords = trainingDictionary.length >= MIN_WORDS_FOR_TRAINING

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
              Перейти к словарю
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
            Тренировка включает{' '}
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
            {wordsDueToday === 0 && (
              <p className='training__sm2-message'>
                Слов на повторение нет. Тренировка по всем словам в словаре
              </p>
            )}
            <div className='training__sm2-progress'>
              <div className='training__stat'>
                <span className='training__stat-label'>{wordsDueToday}</span>
                <span className='training__stat-label'> осталось</span>
              </div>
              <div className='training__stat'>
                <span className='training__stat-label'>{wordsReviewedToday}</span>
                <span className='training__stat-label'> повторено</span>
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
