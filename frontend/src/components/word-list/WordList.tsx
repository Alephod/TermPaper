import React from 'react'
import type { DictionaryEntry } from '../../types'
import { Button } from '../ui/button/Button'
import './WordList.css'

export type WordListProps = {
  words: DictionaryEntry[]
  loading?: boolean
  onEdit?: (entry: DictionaryEntry) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
  emptyDescription?: string
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
      {words.map(entry => (
        <div key={entry.id} className='word-entry'>
          <div className='word-entry__main'>
            {entry.imageUrl && (
              <div className='word-entry__image'>
                <img src={import.meta.env.VITE_API_URL + entry.imageUrl} alt={entry.term} />
              </div>
            )}
            <div className='word-entry__content'>
              <div className='word-entry__term'>{entry.term}</div>
              <div className='word-entry__translation'>{entry.translation}</div>
              <div className={`word-entry__difficulty word-entry__difficulty--${entry.difficulty}`}>
                {entry.difficulty}
              </div>
            </div>
          </div>

          {(entry.example || entry.exampleTranslation) && (
            <div className='word-entry__examples'>
              {entry.example && (
                <div className='word-entry__example'>
                  <span className='word-entry__example-label'>Пример:</span>
                  {entry.example}
                </div>
              )}
              {entry.exampleTranslation && (
                <div className='word-entry__example-translation'>
                  {entry.exampleTranslation}
                </div>
              )}
            </div>
          )}

          {(onEdit || onDelete) && (
            <div className='word-entry__actions'>
              {onEdit && (
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => onEdit(entry)}
                  disabled={loading}
                >
                  ✏️ Редактировать
                </Button>
              )}
              {onDelete && (
                <Button
                  variant='danger'
                  size='sm'
                  onClick={() => onDelete(entry.id)}
                  disabled={loading}
                >
                  🗑️ Удалить
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
