import type React from 'react'
import { useState } from 'react'
import { DeckList } from '../../components/deck-list/DeckList'
import { Button } from '../../components/ui/button/Button'
import { Input } from '../../components/ui/input/Input'
import { Select } from '../../components/ui/select/Select'
import { ApiError } from '../../services/api'
import { dataService } from '../../services/dataService'
import type { DictionaryDeck, DictionaryEntry, Difficulty } from '../../types'

import './DecksPage.css'

type DecksPageProps = {
  dictionary: DictionaryEntry[];

  decks: DictionaryDeck[];

  onUpdateDecks: (decks: DictionaryDeck[]) => void;

  onUpdateDictionary: (entries: DictionaryEntry[]) => void;

  onStartTraining: (deckId?: string) => void;
};

type NewWordFormState = {
  term: string;

  translation: string;

  example: string;

  exampleTranslation: string;

  difficulty: Difficulty;
};

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

  const [wordForms, setWordForms] = useState<{
    [deckId: string]: NewWordFormState;
  }>({})

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const getWordsForDeck = (deckId: string): DictionaryEntry[] => {
    const deck = decks.find((d) => d.id === deckId)

    if (!deck) return []

    return dictionary.filter((word) => deck.wordIds.includes(word.id))
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

      const newDecks = decks.map((deck) =>
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

      const updated = decks.filter((deck) => deck.id !== deckId)

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

      if (!dictionary.some((w) => w.id === result.word.id)) {
        onUpdateDictionary([...dictionary, result.word])
      }

      // Обновляем колоды с бэкенда
      const refreshedDecks = await dataService.loadDecks()
      onUpdateDecks(refreshedDecks)

      // Очищаем форму

      setWordForms((prev) => ({
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

  const handleRemoveWordFromDeck = async (
    deckId: string,
    wordId: string
  ): Promise<void> => {
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

  const handleAddExistingWordToDeck = async (
    deckId: string,
    wordId: string
  ): Promise<void> => {
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
    const deck = decks.find((d) => d.id === deckId)

    if (!deck) return []

    return dictionary.filter((word) => !deck.wordIds.includes(word.id))
  }

  const handleWordFormChange = (
    deckId: string,
    field: keyof NewWordFormState,
    value: string
  ): void => {
    setWordForms((prev) => ({
      ...prev,
      [deckId]: {
        ...(prev[deckId] || buildEmptyWordForm()),

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
              onChange={(e) => setNewDeckName(e.target.value)}
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

        <DeckList
          decks={decks}
          dictionary={dictionary}
          loading={loading}
          onStartTraining={onStartTraining}
          onDeleteDeck={handleDeleteDeck}
          onRenameDeck={handleRenameDeck}
          expandedDeckId={expandedDeckId}
          onToggleExpand={(deckId) =>
            setExpandedDeckId(expandedDeckId === deckId ? null : deckId)
          }
        />
      </section>
    </div>
  )
}
