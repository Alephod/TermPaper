import type React from 'react'
import { Button } from '../ui/button/Button'

interface TrainingSummaryProps {
  totalQuestions: number;
  correctAnswers: number;
  onStartNewTraining: () => void;
}

export const TrainingSummary: React.FC<TrainingSummaryProps> = ({
  totalQuestions,
  correctAnswers,
  onStartNewTraining
}) => {
  const accuracy = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100)

  return (
    <div className='training-page'>
      <div className='training__summary'>
        <div className='training__summary-content'>
          <div className='training__summary-icon'>
            {accuracy >= 70 ? '🎉' : accuracy >= 40 ? '👍' : '💪'}
          </div>
          <h1 className='training__summary-title'>
            {accuracy >= 70
              ? 'Отличная работа!'
              : accuracy >= 40
                ? 'Хороший результат!'
                : 'Продолжайте тренироваться!'}
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
            <Button variant='primary' size='lg' onClick={onStartNewTraining}>
              Начать новую тренировку
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
