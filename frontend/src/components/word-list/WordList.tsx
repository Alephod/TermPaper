import type React from 'react'
import type { DictionaryEntry } from '../../types'
import './WordList.css'

export type WordListProps = {
  words: DictionaryEntry[]
  loading?: boolean
  onEdit?: (entry: DictionaryEntry) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
  emptyDescription?: string
}

const difficultyLabels: Record<string, string> = {
  easy: 'Легкая',
  medium: 'Средняя',
  hard: 'Сложная'
}

export function WordList({
  words,
  loading = false,
  onEdit,
  onDelete,
  emptyMessage = 'Словарь пуст',
  emptyDescription = 'Добавьте первое слово, чтобы начать тренировки'
}: WordListProps): React.ReactElement {
  if (words.length === 0) {
    return (
      <div className='word-list__empty'>
        <div className='word-list__empty-icon'>📝</div>
        <h3>{emptyMessage}</h3>
        <p>{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className='word-list'>
      {words.map((entry) => (
        <div key={entry.id} className='word-entry'>
          <div className='word-entry__header'>
            {entry.imageUrl && (
              <div className='word-entry__image'>
                <img
                  src={entry.imageUrl}
                  alt={entry.term}
                />
              </div>
            )}
            <div className='word-entry__meta'>
              <div className='word-entry__term'>{entry.term}</div>
              <div
                className={`word-entry__difficulty word-entry__difficulty--${entry.difficulty}`}
              >
                {difficultyLabels[entry.difficulty] || entry.difficulty}
              </div>
              <div className='word-entry__translation'>{entry.translation}</div>
            </div>
            {(onEdit || onDelete) && (
              <div className='word-entry__actions'>
                {onEdit && (
                  <button
                    type='button'
                    className='word-entry__action-btn word-entry__action-btn--edit'
                    onClick={() => onEdit(entry)}
                    disabled={loading}
                    title='Редактировать'
                  >
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button
                    type='button'
                    className='word-entry__action-btn word-entry__action-btn--delete'
                    onClick={() => onDelete(entry.id)}
                    disabled={loading}
                    title='Удалить'
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>

          {(entry.example || entry.exampleTranslation) && (
            <div className='word-entry__examples'>
              {entry.example && (
                <div className='word-entry__example'>{entry.example}</div>
              )}
              {entry.exampleTranslation && (
                <div className='word-entry__example-translation'>
                  {entry.exampleTranslation}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
