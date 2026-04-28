import type React from 'react'
import { useState } from 'react'
import type { DictionaryDeck, DictionaryEntry } from '../../types'
import { Button } from '../ui/button/Button'
import { Input } from '../ui/input/Input'
import './DeckList.css'

export type DeckListProps = {
  decks: DictionaryDeck[];
  dictionary: DictionaryEntry[];
  loading?: boolean;
  onStartTraining: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onRenameDeck: (deckId: string, newName: string) => void;
  onAddWordToDeck?: (deckId: string, wordId: string) => void;
  onRemoveWordFromDeck?: (deckId: string, wordId: string) => void;
  expandedDeckId?: string | null;
  onToggleExpand?: (deckId: string) => void;
};

export function DeckList({
  decks,
  dictionary,
  loading = false,
  onStartTraining,
  onDeleteDeck,
  onRenameDeck,
  onAddWordToDeck,
  onRemoveWordFromDeck,
  expandedDeckId,
  onToggleExpand
}: DeckListProps): React.ReactElement {
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [editingDeckName, setEditingDeckName] = useState<string>('')

  const getWordsForDeck = (deckId: string): DictionaryEntry[] => {
    const deck = decks.find((d) => d.id === deckId)
    if (!deck) return []
    return dictionary.filter((word) => deck.wordIds.includes(word.id))
  }

  const getAvailableWordsForDeck = (deckId: string): DictionaryEntry[] => {
    const deck = decks.find((d) => d.id === deckId)
    if (!deck) return []
    return dictionary.filter((word) => !deck.wordIds.includes(word.id))
  }

  const handleStartRename = (deck: DictionaryDeck) => {
    setEditingDeckId(deck.id)
    setEditingDeckName(deck.name)
  }

  const handleSaveRename = (deckId: string) => {
    const trimmedName = editingDeckName.trim()
    if (!trimmedName) return
    onRenameDeck(deckId, trimmedName)
    setEditingDeckId(null)
    setEditingDeckName('')
  }

  const handleCancelRename = () => {
    setEditingDeckId(null)
    setEditingDeckName('')
  }

  if (decks.length === 0) {
    return (
      <div className='deck-list__empty'>
        <div className='deck-list__empty-icon'>🎴</div>
        <h3>Нет колод</h3>
        <p>Создайте первую колоду, чтобы начать организовывать слова</p>
      </div>
    )
  }

  return (
    <div className='deck-list'>
      {decks.map((deck) => {
        const deckWords = getWordsForDeck(deck.id)
        const availableWords = getAvailableWordsForDeck(deck.id)
        const isExpanded = expandedDeckId === deck.id
        const isEditing = editingDeckId === deck.id

        return (
          <div key={deck.id} className='deck-card'>
            <div className='deck-card__header'>
              <div className='deck-card__info'>
                {isEditing ? (
                  <Input
                    value={editingDeckName}
                    onChange={(e) => setEditingDeckName(e.target.value)}
                    onBlur={() => handleSaveRename(deck.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(deck.id)
                      if (e.key === 'Escape') handleCancelRename()
                    }}
                    disabled={loading}
                    autoFocus
                    fullWidth
                    className='deck-card__name-input'
                  />
                ) : (
                  <h3
                    className='deck-card__name'
                    onDoubleClick={() => handleStartRename(deck)}
                  >
                    {deck.name}
                  </h3>
                )}
                <div className='deck-card__stats'>
                  <span className='deck-card__word-count'>
                    {deckWords.length} слов
                  </span>
                </div>
              </div>

              <div className='deck-card__actions'>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => onStartTraining(deck.id)}
                  disabled={deckWords.length === 0 || loading}
                >
                  🎯 Тренировка
                </Button>

                {onToggleExpand && (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => onToggleExpand(deck.id)}
                  >
                    {isExpanded ? '📁 Свернуть' : '📂 Развернуть'}
                  </Button>
                )}

                <Button
                  variant='danger'
                  size='sm'
                  onClick={() => onDeleteDeck(deck.id)}
                  disabled={loading}
                >
                  🗑️
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className='deck-card__content'>
                {/* Available Words */}
                {availableWords.length > 0 && (
                  <div className='deck-card__add-existing'>
                    <h4 className='deck-card__add-existing-title'>
                      Добавить из словаря
                    </h4>
                    <div className='deck-card__available-words'>
                      {availableWords.slice(0, 10).map((word) => (
                        <button
                          key={`available-${word.id}`}
                          type='button'
                          onClick={() => onAddWordToDeck?.(deck.id, word.id)}
                          className='deck-card__available-word'
                          disabled={loading}
                        >
                          <span className='deck-card__available-word-term'>
                            {word.term}
                          </span>
                          –
                          <span className='deck-card__available-word-translation'>
                            {word.translation}
                          </span>
                        </button>
                      ))}
                      {availableWords.length > 10 && (
                        <div className='deck-card__more-words'>
                          ... и еще {availableWords.length - 10} слов
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className='deck-card__words'>
                  <h4 className='deck-card__words-title'>
                    Слова в колоде ({deckWords.length})
                  </h4>
                  {deckWords.length === 0 ? (
                    <div className='deck-card__empty-words'>
                      <p>В этой колоде пока нет слов</p>
                    </div>
                  ) : (
                    <div className='deck-card__words-list'>
                      {deckWords.map((word) => (
                        <div
                          key={`deck-${word.id}`}
                          className='deck-card__word'
                        >
                          <div className='deck-card__word-info'>
                            <span className='deck-card__word-term'>
                              {word.term}
                            </span>
                            –
                            <span className='deck-card__word-translation'>
                              {word.translation}
                            </span>
                            <span
                              className={`deck-card__word-difficulty deck-card__word-difficulty--${word.difficulty}`}
                            >
                              {word.difficulty}
                            </span>
                          </div>
                          <Button
                            variant='danger'
                            size='sm'
                            onClick={() => onRemoveWordFromDeck?.(deck.id, word.id)}
                            disabled={loading}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
