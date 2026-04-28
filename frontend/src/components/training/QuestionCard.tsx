import type React from 'react'
import type { TrainingQuestion } from '../../types'
import { Button } from '../ui/button/Button'

interface QuestionCardProps {
	question: TrainingQuestion;
	selectedOptionId: string | null;
	isCorrect: boolean | null;
	currentIndex: number;
	totalQuestions: number;
	onSelectOption: (optionId: string) => void;
	onNext: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOptionId,
  isCorrect,
  currentIndex,
  totalQuestions,
  onSelectOption,
  onNext
}) => {
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  return (
    <div className='training-page'>
      <div className='training__question'>
        <div className='training__question-header'>
          <div className='training__progress'>
            <div className='training__progress-text'>
              Вопрос {currentIndex + 1} из {totalQuestions}
            </div>
            <div className='training__progress-bar'>
              <div className='training__progress-fill' style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div key={currentIndex} className='training__question-card'>
          <div className='training__question-content'>
            {question.promptImageUrl && (
              <div className='training__prompt-image'>
                <img
                  src={question.promptImageUrl}
                  alt='Question prompt'
                  className='training__prompt-img'
                />
              </div>
            )}
            {question.prompt && <h2 className='training__term'>{question.prompt}</h2>}
            <p className='training__question-hint'>
              {question.type === 'term-to-translation' && 'Выберите правильный перевод:'}
              {question.type === 'translation-to-term' && 'Выберите иностранное слово:'}
              {question.type === 'image-to-term' && 'Выберите правильное слово:'}
              {question.type === 'term-to-image' && 'Выберите правильную картинку:'}
            </p>
          </div>

          <div className={`training__options ${question.type === 'term-to-image' ? 'training__options--image-grid' : ''}`}>
            {question.options.map((option) => {
              const isSelected = selectedOptionId === option.id
              const isCorrectOption = option.id === question.correctOptionId
              const showResult = selectedOptionId !== null

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

              const isImageOption = question.type === 'term-to-image' && !!option.imageUrl

              return (
                <button
                  key={option.id}
                  type='button'
                  className={`${optionClass} ${isImageOption ? 'training__option--image' : ''}`}
                  onClick={() => onSelectOption(option.id)}
                  disabled={showResult}
                >
                  {isImageOption ? (
                    <img
                      src={option.imageUrl || ''}
                      alt={option.text}
                      className='training__option-image'
                    />
                  ) : (
                    <span className='training__option-text'>{option.text}</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedOptionId !== null && (
            <div className='training__feedback'>
              {isCorrect ? (
                <div className='training__feedback-correct'>
                  <span>Правильно!</span>
                </div>
              ) : (
                <div className='training__feedback-wrong'>
                  <span>
                    Неверно. Правильный ответ:{' '}
                    {question.options.find((o) => o.id === question.correctOptionId)?.text}
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedOptionId !== null && (
            <Button
              variant='primary'
              size='lg'
              onClick={onNext}
              className='training__next-button'
            >
              {currentIndex === totalQuestions - 1 ? 'Завершить' : 'Далее'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
