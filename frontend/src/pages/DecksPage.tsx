import React, { useState } from 'react'
import type {
  DictionaryEntry,
  DictionaryDeck,
  Difficulty
} from '../types'
import { dataService } from '../services/dataService'
import { ApiError } from '../services/api'
import { Button, Input, Select } from '../components/ui'

type DecksPageProps = {
  dictionary: DictionaryEntry[]
  decks: DictionaryDeck[]
  onUpdateDecks: (decks: DictionaryDeck[]) => void
  onUpdateDictionary: (entries: DictionaryEntry[]) => void
  onStartTraining: (deckId?: string) => void
}

type NewWordFormState = {
  term: string
  translation: string
  example: string
  exampleTranslation: string
  difficulty: Difficulty
}

const buildEmptyWordForm = (): NewWordFormState => ({
  term: '',
  translation: '',
  example: '',
  exampleTranslation: '',
  difficulty: 'easy'
})

export const DecksPage: React.FC<DecksPageProps> = ({
  dictionary,
  decks,
  onUpdateDecks,
  onUpdateDictionary,
  onStartTraining
}) => {
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null)
  const [newDeckName, setNewDeckName] = useState<string>('')
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [editingDeckName, setEditingDeckName] = useState<string>('')
  const [wordForms, setWordForms] = useState<{ [deckId: string]: NewWordFormState }>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const getWordsForDeck = (deckId: string): DictionaryEntry[] => {
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return []
    return dictionary.filter(word => deck.wordIds.includes(word.id))
  }

  const handleCreateDeck = async (): Promise<void> => {
    const trimmedName = newDeckName.trim()
    if (!trimmedName) return

    try {
      setLoading(true)
      setError(null)
      
      await dataService.createDeck({
        name: trimmedName
      })
      
      // Перезагружаем колоды с бэкенда
      const refreshedDecks = await dataService.loadDecks()
      onUpdateDecks(refreshedDecks)
      
      setNewDeckName('')
    } catch (err) {
      console.error('Failed to create deck:', err)
      if (err instanceof ApiError) {
        setError(`Failed to create deck: ${err.message}`)
      } else {
        setError('Failed to create deck')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRenameDeck = async (deckId: string): Promise<void> => {
    const trimmedName = editingDeckName.trim()
    if (!trimmedName) return

    try {
      setLoading(true)
      setError(null)
      
      const updated = await dataService.updateDeck(deckId, {
        name: trimmedName
      })
      
      const newDecks = decks.map(deck =>
        deck.id === deckId ? updated : deck
      )
      onUpdateDecks(newDecks)
      setEditingDeckId(null)
      setEditingDeckName('')
    } catch (err) {
      console.error('Failed to rename deck:', err)
      if (err instanceof ApiError) {
        setError(`Failed to rename deck: ${err.message}`)
      } else {
        setError('Failed to rename deck')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDeck = async (deckId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      await dataService.deleteDeck(deckId)
      const updated = decks.filter(deck => deck.id !== deckId)
      onUpdateDecks(updated)
      
      if (expandedDeckId === deckId) {
        setExpandedDeckId(null)
      }
    } catch (err) {
      console.error('Failed to delete deck:', err)
      if (err instanceof ApiError) {
        setError(`Failed to delete deck: ${err.message}`)
      } else {
        setError('Failed to delete deck')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddWordToDeck = async (deckId: string): Promise<void> => {
    const form = wordForms[deckId]
    if (!form || !form.term.trim() || !form.translation.trim()) return

    try {
      setLoading(true)
      setError(null)
      
      // Создаем слово в колоде
      const result = await dataService.createWordInDeck(deckId, {
        term: form.term.trim(),
        translation: form.translation.trim(),
        example: form.example.trim(),
        exampleTranslation: form.exampleTranslation.trim(),
        difficulty: form.difficulty
      })
      
      // Обновляем словарь только если слова ещё нет
      if (!dictionary.some(w => w.id === result.word.id)) {
        onUpdateDictionary([...dictionary, result.word])
      }
      
      // Обновляем колоды с бэкенда
      const refreshedDecks = await dataService.loadDecks()
      onUpdateDecks(refreshedDecks)
      
      // Очищаем форму
      setWordForms(prev => ({
        ...prev,
        [deckId]: buildEmptyWordForm()
      }))
    } catch (err) {
      console.error('Failed to add word to deck:', err)
      if (err instanceof ApiError) {
        setError(`Failed to add word: ${err.message}`)
      } else {
        setError('Failed to add word')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveWordFromDeck = async (deckId: string, wordId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      await dataService.removeWordFromDeck(deckId, wordId)
      
      // Перезагружаем колоды с бэкенда
      const refreshedDecks = await dataService.loadDecks()
      onUpdateDecks(refreshedDecks)
    } catch (err) {
      console.error('Failed to remove word from deck:', err)
      if (err instanceof ApiError) {
        setError(`Failed to remove word: ${err.message}`)
      } else {
        setError('Failed to remove word')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddExistingWordToDeck = async (deckId: string, wordId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      await dataService.addExistingWordToDeck(deckId, wordId)
      
      // Перезагружаем колоды с бэкенда
      const refreshedDecks = await dataService.loadDecks()
      onUpdateDecks(refreshedDecks)
    } catch (err) {
      console.error('Failed to add existing word to deck:', err)
      if (err instanceof ApiError) {
        setError(`Failed to add word: ${err.message}`)
      } else {
        setError('Failed to add word')
      }
    } finally {
      setLoading(false)
    }
  }

  const getAvailableWordsForDeck = (deckId: string): DictionaryEntry[] => {
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return []
    return dictionary.filter(word => !deck.wordIds.includes(word.id))
  }

  const handleWordFormChange = (deckId: string, field: keyof NewWordFormState, value: string): void => {
    setWordForms(prev => ({
      ...prev,
      [deckId]: {
        ...prev[deckId] || buildEmptyWordForm(),
        [field]: value
      }
    }))
  }

  return (
    <div className='decks-page'>
      <div className='decks__hero'>
        <div className='decks__hero-content'>
          <h1 className='decks__title'>🎴 Колоды</h1>
          <p className='decks__subtitle'>
            Организуйте слова в колоды для целенаправленных тренировок
          </p>
          
          <div className='decks__stats'>
            <div className='decks__stat'>
              <span className='decks__stat-value'>{decks.length}</span>
              <span className='decks__stat-label'>колод</span>
            </div>
            <div className='decks__stat'>
              <span className='decks__stat-value'>{dictionary.length}</span>
              <span className='decks__stat-label'>всего слов</span>
            </div>
            <div className='decks__stat'>
              <span className='decks__stat-value'>
                {decks.reduce((sum, deck) => sum + deck.wordIds.length, 0)}
              </span>
              <span className='decks__stat-label'>слов в колодах</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className='decks__error-banner'>
          <div className='decks__error-content'>
            <span className='decks__error-icon'>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <section className='decks__create-section'>
        <div className='decks__create-card'>
          <h2 className='decks__section-title'>➕ Создать новую колоду</h2>
          <div className='decks__create-form'>
            <Input
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              placeholder='Название колоды...'
              disabled={loading}
              fullWidth
            />
            <Button
              variant='primary'
              onClick={handleCreateDeck}
              disabled={loading || !newDeckName.trim()}
              loading={loading}
            >
              Создать колоду
            </Button>
          </div>
        </div>
      </section>

      <section className='decks__list-section'>
        <h2 className='decks__section-title'>📚 Все колоды</h2>
        
        {decks.length === 0 ? (
          <div className='decks__empty-state'>
            <div className='decks__empty-icon'>🎴</div>
            <h3>Нет колод</h3>
            <p>Создайте первую колоду, чтобы начать организовывать слова</p>
          </div>
        ) : (
          <div className='decks__list'>
            {decks.map(deck => {
              const deckWords = getWordsForDeck(deck.id)
              const availableWords = getAvailableWordsForDeck(deck.id)
              const isExpanded = expandedDeckId === deck.id
              const wordForm = wordForms[deck.id] || buildEmptyWordForm()
              
              return (
                <div key={deck.id} className='deck-card'>
                  <div className='deck-card__header'>
                    <div className='deck-card__info'>
                      {editingDeckId === deck.id ? (
                        <Input
                          value={editingDeckName}
                          onChange={e => setEditingDeckName(e.target.value)}
                          onBlur={() => handleRenameDeck(deck.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameDeck(deck.id)
                            if (e.key === 'Escape') {
                              setEditingDeckId(null)
                              setEditingDeckName('')
                            }
                          }}
                          disabled={loading}
                          autoFocus
                          fullWidth
                          className='deck-card__name-input'
                        />
                      ) : (
                        <h3 
                          className='deck-card__name'
                          onDoubleClick={() => {
                            setEditingDeckId(deck.id)
                            setEditingDeckName(deck.name)
                          }}
                        >
                          {deck.name}
                        </h3>
                      )}
                      <div className='deck-card__stats'>
                        <span className='deck-card__word-count'>{deckWords.length} слов</span>
                      </div>
                    </div>
                    
                    <div className='deck-card__actions'>
                      <Button
                        variant='primary'
                        size='sm'
                        onClick={() => onStartTraining(deck.id)}
                        disabled={deckWords.length === 0}
                      >
                        🎯 Тренировка
                      </Button>
                      
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => setExpandedDeckId(isExpanded ? null : deck.id)}
                      >
                        {isExpanded ? '📁 Свернуть' : '📂 Развернуть'}
                      </Button>
                      
                      <Button
                        variant='danger'
                        size='sm'
                        onClick={() => handleDeleteDeck(deck.id)}
                        disabled={loading}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className='deck-card__content'>
                      {/* Добавление нового слова в колоду */}
                      <div className='deck-card__add-word'>
                        <h4 className='deck-card__add-word-title'>Добавить новое слово</h4>
                        <div className='deck-card__word-form'>
                          <div className='deck-card__form-row'>
                            <Input
                              value={wordForm.term}
                              onChange={e => handleWordFormChange(deck.id, 'term', e.target.value)}
                              placeholder='Слово'
                              disabled={loading}
                              fullWidth
                            />
                            <Input
                              value={wordForm.translation}
                              onChange={e => handleWordFormChange(deck.id, 'translation', e.target.value)}
                              placeholder='Перевод'
                              disabled={loading}
                              fullWidth
                            />
                          </div>
                          <div className='deck-card__form-row'>
                            <Input
                              value={wordForm.example}
                              onChange={e => handleWordFormChange(deck.id, 'example', e.target.value)}
                              placeholder='Пример'
                              disabled={loading}
                              fullWidth
                            />
                            <Input
                              value={wordForm.exampleTranslation}
                              onChange={e => handleWordFormChange(deck.id, 'exampleTranslation', e.target.value)}
                              placeholder='Перевод примера'
                              disabled={loading}
                              fullWidth
                            />
                          </div>
                          <div className='deck-card__form-row deck-card__form-row--last'>
                            <Select
                              value={wordForm.difficulty}
                              onChange={e => handleWordFormChange(deck.id, 'difficulty', e.target.value)}
                              disabled={loading}
                              options={[
                                { value: 'easy', label: 'Легкая' },
                                { value: 'medium', label: 'Средняя' },
                                { value: 'hard', label: 'Сложная' }
                              ]}
                              fullWidth
                            />
                            <Button
                              variant='primary'
                              onClick={() => handleAddWordToDeck(deck.id)}
                              disabled={loading || !wordForm.term.trim() || !wordForm.translation.trim()}
                              loading={loading}
                            >
                              Добавить
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Добавление существующих слов */}
                      {availableWords.length > 0 && (
                        <div className='deck-card__add-existing'>
                          <h4 className='deck-card__add-existing-title'>Добавить из словаря</h4>
                          <div className='deck-card__available-words'>
                            {availableWords.slice(0, 10).map(word => (
                              <div key={`available-${word.id}`} className='deck-card__available-word'>
                                <span className='deck-card__available-word-term'>{word.term}</span>
                                <span className='deck-card__available-word-translation'>{word.translation}</span>
                                <Button
                                  type='button'
                                  size='sm'
                                  variant='primary'
                                  onClick={() => handleAddExistingWordToDeck(deck.id, word.id)}
                                  disabled={loading}
                                >
                                  ➕
                                </Button>
                              </div>
                            ))}
                            {availableWords.length > 10 && (
                              <div className='deck-card__more-words'>
                                ... и еще {availableWords.length - 10} слов
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Слова в колоде */}
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
                            {deckWords.map(word => (
                              <div key={`deck-${word.id}`} className='deck-card__word'>
                                <div className='deck-card__word-info'>
                                  <span className='deck-card__word-term'>{word.term}</span>
                                  <span className='deck-card__word-translation'>{word.translation}</span>
                                  <span className={`deck-card__word-difficulty deck-card__word-difficulty--${word.difficulty}`}>
                                    {word.difficulty}
                                  </span>
                                </div>
                                <Button
                                  type='button'
                                  size='sm'
                                  variant='danger'
                                  onClick={() => handleRemoveWordFromDeck(deck.id, word.id)}
                                  disabled={loading}
                                >
                                  ❌
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
        )}
      </section>
    </div>
  )
}
