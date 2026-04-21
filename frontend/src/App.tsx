import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { dataService } from './services/dataService'
import { ApiError } from './services/api'
import type {
  DictionaryEntry,
  TrainingSession,
  DictionaryDeck
} from './types'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/home/HomePage'
import { TrainingPage } from './pages/training/TrainingPage'
import { DictionaryPage } from './pages/dictionary/DictionaryPage'
import { DecksPage } from './pages/decks/DecksPage'

export const App: React.FC = () => {
  const navigate = useNavigate()
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([])
  const [history, setHistory] = useState<TrainingSession[]>([])
  const [decks, setDecks] = useState<DictionaryDeck[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { words, decks: loadedDecks, sessions } = await dataService.initializeData()

        setDictionary(words)
        setDecks(loadedDecks)
        setHistory(sessions)
      } catch (err) {
        console.error('Failed to initialize data:', err)
        if (err instanceof ApiError) {
          setError(`Ошибка API: ${err.message}`)
        } else {
          setError('Не удалось загрузить данные с сервера')
        }
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  const handleStartTraining = (deckId?: string): void => {
    // Clear any saved training session - start fresh
    localStorage.removeItem('training_session')

    if (deckId) {
      localStorage.setItem('currentDeckId', deckId)
    } else {
      localStorage.removeItem('currentDeckId')
    }
    navigate('/training')
  }

  const handleUpdateDictionary = async (
    entries: DictionaryEntry[]
  ): Promise<void> => {
    try {
      setDictionary(entries)

      const cleanedDecks = decks.map(deck => ({
        ...deck,
        wordIds: deck.wordIds.filter(wordId =>
          entries.some(entry => entry.id === wordId)
        )
      }))
      setDecks(cleanedDecks)
    } catch (err) {
      console.error('Failed to update dictionary:', err)
      setError('Не удалось обновить словарь')
    }
  }

  const handleUpdateDecks = async (
    updatedDecks: DictionaryDeck[]
  ): Promise<void> => {
    try {
      setDecks(updatedDecks)
    } catch (err) {
      console.error('Failed to update decks:', err)
      setError('Не удалось обновить колоды')
    }
  }

  const handleFinishSession = async (
    session: TrainingSession
  ): Promise<void> => {
    try {
      const createdSession = await dataService.createTrainingSession(session)
      setHistory(prev => [createdSession, ...prev])
    } catch (err) {
      console.error('Failed to save training session:', err)
      setError('Не удалось сохранить сессию обучения')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading data from server...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <Layout isDictionaryError={!!error} isHistoryError={!!error}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              dictionary={dictionary}
              decks={decks}
              history={history}
              onStartTraining={handleStartTraining}
            />
          }
        />
        <Route
          path="/training"
          element={
            <TrainingPage
              dictionary={dictionary}
              decks={decks}
              onFinishSession={handleFinishSession}
              onGoToDictionary={() => navigate('/dictionary')}
              onGoToStatistics={() => navigate('/statistics')}
            />
          }
        />
        <Route
          path="/dictionary"
          element={
            <DictionaryPage
              dictionary={dictionary}
              decks={decks}
              onUpdateDictionary={handleUpdateDictionary}
              onUpdateDecks={handleUpdateDecks}
              hasError={!!error}
            />
          }
        />
        <Route
          path="/decks"
          element={
            <DecksPage
              dictionary={dictionary}
              decks={decks}
              onUpdateDictionary={handleUpdateDictionary}
              onUpdateDecks={handleUpdateDecks}
              onStartTraining={handleStartTraining}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
