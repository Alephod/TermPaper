import React, { useState } from 'react'
import type {
  DictionaryEntry,
  DictionaryDeck,
  Difficulty
} from '../../types'

type DecksPanelProps = {
  dictionary: DictionaryEntry[]
  decks: DictionaryDeck[]
  onUpdateDecks: (decks: DictionaryDeck[]) => void
  onUpdateDictionary: (entries: DictionaryEntry[]) => void
}

type NewWordFormState = {
  term: string
  translation: string
  example: string
  exampleTranslation: string
  difficulty: Difficulty
}

type EditableWordState = {
  [id: string]: NewWordFormState
}

export const DecksPanel: React.FC<DecksPanelProps> = ({
  dictionary,
  decks,
  onUpdateDecks,
  onUpdateDictionary
}) => {
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null)
  const [newDeckName, setNewDeckName] = useState<string>('')
  const [wordForms, setWordForms] = useState<EditableWordState>({})
  const [editingWordId, setEditingWordId] = useState<string | null>(null)

  const handleToggleDeck = (deckId: string): void => {
    setExpandedDeckId(previous =>
      previous === deckId ? null : deckId
    )
    setEditingWordId(null)
  }

  const handleCreateDeck = (): void => {
    const trimmedName = newDeckName.trim()
    if (!trimmedName) {
      return
    }

    const newDeck: DictionaryDeck = {
      id: `deck-${Date.now().toString()}`,
      name: trimmedName,
      wordIds: []
    }

    onUpdateDecks([...decks, newDeck])
    setNewDeckName('')
  }

  const handleRenameDeck = (
    deckId: string,
    name: string
  ): void => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    const updated = decks.map(deck =>
      deck.id === deckId ? { ...deck, name: trimmedName } : deck
    )
    onUpdateDecks(updated)
  }

  const handleDeleteDeck = (deckId: string): void => {
    const updated = decks.filter(deck => deck.id !== deckId)
    onUpdateDecks(updated)
    if (expandedDeckId === deckId) {
      setExpandedDeckId(null)
      setEditingWordId(null)
    }
  }

  const handleRemoveWordFromDeck = (
    deckId: string,
    wordId: string
  ): void => {
    const updated = decks.map(deck =>
      deck.id === deckId
        ? {
          ...deck,
          wordIds: deck.wordIds.filter(id => id !== wordId)
        }
        : deck
    )
    onUpdateDecks(updated)
    if (editingWordId === wordId) {
      setEditingWordId(null)
    }
  }

  const handleNewWordChange = (
    deckId: string,
    field: keyof NewWordFormState,
    value: string
  ): void => {
    setWordForms(previous => {
      const form = previous[deckId] ?? {
        term: '',
        translation: '',
        example: '',
        exampleTranslation: '',
        difficulty: 'easy'
      }

      if (field === 'difficulty') {
        return {
          ...previous,
          [deckId]: {
            ...form,
            difficulty: value as Difficulty
          }
        }
      }

      return {
        ...previous,
        [deckId]: {
          ...form,
          [field]: value
        }
      }
    })
  }

  const handleAddWordToDeck = (deckId: string): void => {
    const form = wordForms[deckId]
    if (!form) {
      return
    }

    const term = form.term.trim()
    const translation = form.translation.trim()
    const example = form.example.trim()
    const exampleTranslation = form.exampleTranslation.trim()

    if (!term || !translation) {
      return
    }

    const newEntry: DictionaryEntry = {
      id: `w-${Date.now().toString()}-${deckId}`,
      term,
      translation,
      example,
      exampleTranslation,
      difficulty: form.difficulty
    }

    const updatedDictionary = [...dictionary, newEntry]
    onUpdateDictionary(updatedDictionary)

    const updatedDecks = decks.map(deck =>
      deck.id === deckId
        ? { ...deck, wordIds: [...deck.wordIds, newEntry.id] }
        : deck
    )
    onUpdateDecks(updatedDecks)

    setWordForms(previous => ({
      ...previous,
      [deckId]: {
        term: '',
        translation: '',
        example: '',
        exampleTranslation: '',
        difficulty: form.difficulty
      }
    }))
  }

  const handleEditWordField = (
    wordId: string,
    field: keyof NewWordFormState,
    value: string
  ): void => {
    setWordForms(previous => {
      const existingEntry = dictionary.find(entry => entry.id === wordId)
      const base: NewWordFormState = previous[wordId] ?? {
        term: existingEntry?.term ?? '',
        translation: existingEntry?.translation ?? '',
        example: existingEntry?.example ?? '',
        exampleTranslation: existingEntry?.exampleTranslation ?? '',
        difficulty: existingEntry?.difficulty ?? 'easy'
      }

      if (field === 'difficulty') {
        return {
          ...previous,
          [wordId]: {
            ...base,
            difficulty: value as Difficulty
          }
        }
      }

      return {
        ...previous,
        [wordId]: {
          ...base,
          [field]: value
        }
      }
    })
  }

  const handleStartEditWord = (wordId: string): void => {
    setEditingWordId(wordId)
  }

  const handleCancelEditWord = (wordId: string): void => {
    setEditingWordId(previous =>
      previous === wordId ? null : previous
    )
    setWordForms(previous => {
      const next = { ...previous }
      delete next[wordId]
      return next
    })

  }

  const handleSaveWordChanges = (wordId: string): void => {
    const form = wordForms[wordId]
    const existingEntry = dictionary.find(entry => entry.id === wordId)

    if (!form || !existingEntry) {
      return
    }

    const updatedEntry: DictionaryEntry = {
      ...existingEntry,
      term: form.term.trim(),
      translation: form.translation.trim(),
      example: form.example.trim(),
      exampleTranslation: form.exampleTranslation.trim(),
      difficulty: form.difficulty
    }

    const updatedDictionary = dictionary.map(entry =>
      entry.id === wordId ? updatedEntry : entry
    )

    onUpdateDictionary(updatedDictionary)

    setWordForms(previous => {
      const next = { ...previous }
      delete next[wordId]
      return next
    })

    setEditingWordId(previous =>
      previous === wordId ? null : previous
    )
  }

  const getWordsForDeck = (
    deck: DictionaryDeck
  ): DictionaryEntry[] =>
    deck.wordIds
      .map(wordId => dictionary.find(entry => entry.id === wordId))
      .filter(
        (entry): entry is DictionaryEntry => Boolean(entry)
      )

  return (
    <div className='decks'>
      <div className='decks__header'>
        <h3 className='section-title section-title--small'>
          Decks
        </h3>
        <div className='decks__create'>
          <input
            type='text'
            placeholder='Название новой колоды'
            value={newDeckName}
            onChange={event =>
              setNewDeckName(event.target.value)
            }
          />
          <button
            type='button'
            className='button button--primary'
            onClick={handleCreateDeck}
          >
            Создать колоду
          </button>
        </div>
      </div>

      {decks.length === 0 && (
        <p className='decks__empty'>
          Колод пока нет. Создайте первую колоду выше.
        </p>
      )}

      <div className='decks__list'>
        {decks.map(deck => {
          const isExpanded = expandedDeckId === deck.id
          const words = getWordsForDeck(deck)
          const newWordForm = wordForms[deck.id] ?? {
            term: '',
            translation: '',
            example: '',
            exampleTranslation: '',
            difficulty: 'easy'
          }

          return (
            <article
              key={deck.id}
              className='deck-card'
            >
              <header className='deck-card__header'>
                <button
                  type='button'
                  className='deck-card__title-button'
                  onClick={() =>
                    handleToggleDeck(deck.id)
                  }
                >
                  <span className='deck-card__chevron'>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <input
                    className='deck-card__name-input'
                    type='text'
                    defaultValue={deck.name}
                    onBlur={event =>
                      handleRenameDeck(
                        deck.id,
                        event.target.value
                      )
                    }
                  />
                </button>

                <button
                  type='button'
                  className='button button--danger-ghost'
                  onClick={() =>
                    handleDeleteDeck(deck.id)
                  }
                >
                  Удалить колоду
                </button>
              </header>

              {isExpanded && (
                <div className='deck-card__body'>
                  <div className='deck-card__words'>
                    {words.length === 0 && (
                      <p className='deck-card__empty'>
                        В этой колоде пока нет слов.
                      </p>
                    )}

                    {words.map(word => {
                      const form =
                        wordForms[word.id] ?? {
                          term: word.term,
                          translation: word.translation,
                          example: word.example,
                          exampleTranslation:
                            word.exampleTranslation,
                          difficulty: word.difficulty
                        }

                      const isEditing =
                        editingWordId === word.id

                      return (
                        <div
                          key={word.id}
                          className='deck-word'
                        >
                          {/* Краткий просмотр слова */}
                          <div className='deck-word__summary'>
                            <div className='deck-word__summary-main'>
                              <div className='deck-word__term-text'>
                                {word.term}
                              </div>
                              <div className='deck-word__translation-text'>
                                {word.translation}
                              </div>
                              <span
                                className={`badge badge--${word.difficulty}`}
                              >
                                {word.difficulty}
                              </span>
                            </div>
                            <div className='deck-word__summary-actions'>
                              <button
                                type='button'
                                className='button button--ghost'
                                onClick={() =>
                                  handleStartEditWord(
                                    word.id
                                  )
                                }
                              >
                                Редактировать
                              </button>
                              <button
                                type='button'
                                className='button button--danger-ghost'
                                onClick={() =>
                                  handleRemoveWordFromDeck(
                                    deck.id,
                                    word.id
                                  )
                                }
                              >
                                Удалить из колоды
                              </button>
                            </div>
                          </div>

                          {/* Режим редактирования — только по кнопке */}
                          {isEditing && (
                            <div className='deck-word__edit'>
                              <div className='deck-word__main'>
                                <input
                                  type='text'
                                  className='deck-word__term'
                                  value={form.term}
                                  onChange={event =>
                                    handleEditWordField(
                                      word.id,
                                      'term',
                                      event.target.value
                                    )
                                  }
                                />
                                <input
                                  type='text'
                                  className='deck-word__translation'
                                  value={form.translation}
                                  onChange={event =>
                                    handleEditWordField(
                                      word.id,
                                      'translation',
                                      event.target.value
                                    )
                                  }
                                />
                                <select
                                  className='deck-word__difficulty'
                                  value={form.difficulty}
                                  onChange={event =>
                                    handleEditWordField(
                                      word.id,
                                      'difficulty',
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value='easy'>
                                    Easy
                                  </option>
                                  <option value='medium'>
                                    Medium
                                  </option>
                                  <option value='hard'>
                                    Hard
                                  </option>
                                </select>
                              </div>

                              <div className='deck-word__examples'>
                                <input
                                  type='text'
                                  className='deck-word__example'
                                  placeholder='Пример'
                                  value={form.example}
                                  onChange={event =>
                                    handleEditWordField(
                                      word.id,
                                      'example',
                                      event.target.value
                                    )
                                  }
                                />
                                <input
                                  type='text'
                                  className='deck-word__example-translation'
                                  placeholder='Перевод примера'
                                  value={
                                    form.exampleTranslation
                                  }
                                  onChange={event =>
                                    handleEditWordField(
                                      word.id,
                                      'exampleTranslation',
                                      event.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className='deck-word__actions'>
                                <button
                                  type='button'
                                  className='button button--primary'
                                  onClick={() =>
                                    handleSaveWordChanges(
                                      word.id
                                    )
                                  }
                                >
                                  Сохранить
                                </button>
                                <button
                                  type='button'
                                  className='button button--ghost'
                                  onClick={() =>
                                    handleCancelEditWord(
                                      word.id
                                    )
                                  }
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Добавить новое слово прямо в колоду */}
                  <div className='deck-card__new-word'>
                    <h4 className='deck-card__new-word-title'>
                      Добавить новое слово в колоду
                    </h4>
                    <div className='deck-card__new-word-row'>
                      <input
                        type='text'
                        placeholder='Слово'
                        value={newWordForm.term}
                        onChange={event =>
                          handleNewWordChange(
                            deck.id,
                            'term',
                            event.target.value
                          )
                        }
                      />
                      <input
                        type='text'
                        placeholder='Перевод'
                        value={newWordForm.translation}
                        onChange={event =>
                          handleNewWordChange(
                            deck.id,
                            'translation',
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div className='deck-card__new-word-row'>
                      <input
                        type='text'
                        placeholder='Пример'
                        value={newWordForm.example}
                        onChange={event =>
                          handleNewWordChange(
                            deck.id,
                            'example',
                            event.target.value
                          )
                        }
                      />
                      <input
                        type='text'
                        placeholder='Перевод примера'
                        value={
                          newWordForm.exampleTranslation
                        }
                        onChange={event =>
                          handleNewWordChange(
                            deck.id,
                            'exampleTranslation',
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div className='deck-card__new-word-row deck-card__new-word-row--last'>
                      <select
                        value={newWordForm.difficulty}
                        onChange={event =>
                          handleNewWordChange(
                            deck.id,
                            'difficulty',
                            event.target.value
                          )
                        }
                      >
                        <option value='easy'>Easy</option>
                        <option value='medium'>Medium</option>
                        <option value='hard'>Hard</option>
                      </select>
                      <button
                        type='button'
                        className='button button--primary'
                        onClick={() =>
                          handleAddWordToDeck(deck.id)
                        }
                      >
                        Добавить слово
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
