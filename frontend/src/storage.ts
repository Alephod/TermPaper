import type {
  DictionaryEntry,
  TrainingSession,
  DictionaryDeck
} from './types'

const DICTIONARY_KEY = 'word-trainer/dictionary'
const HISTORY_KEY = 'word-trainer/history'
const DECKS_KEY = 'word-trainer/decks'

type LoadResult<T> = {
  data: T
  error: boolean
}

export const loadDictionary = (
  fallback: DictionaryEntry[]
): LoadResult<DictionaryEntry[]> => {
  if (typeof window === 'undefined') {
    return { data: fallback, error: false }
  }

  try {
    const raw = window.localStorage.getItem(DICTIONARY_KEY)
    if (!raw) {
      return { data: fallback, error: false }
    }

    const parsed = JSON.parse(raw) as DictionaryEntry[]
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid dictionary format')
    }

    return { data: parsed, error: false }
  } catch {
    return { data: fallback, error: true }
  }
}

export const saveDictionary = (
  dictionary: DictionaryEntry[]
): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    DICTIONARY_KEY,
    JSON.stringify(dictionary)
  )
}

export const clearDictionaryStorage = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(DICTIONARY_KEY)
}

export const loadHistory = (): LoadResult<TrainingSession[]> => {
  if (typeof window === 'undefined') {
    return { data: [], error: false }
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) {
      return { data: [], error: false }
    }

    const parsed = JSON.parse(raw) as TrainingSession[]
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid history format')
    }

    return { data: parsed, error: false }
  } catch {
    return { data: [], error: true }
  }
}

export const saveHistory = (
  history: TrainingSession[]
): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history)
  )
}

export const loadDecks = (): LoadResult<DictionaryDeck[]> => {
  if (typeof window === 'undefined') {
    return { data: [], error: false }
  }

  try {
    const raw = window.localStorage.getItem(DECKS_KEY)
    if (!raw) {
      return { data: [], error: false }
    }

    const parsed = JSON.parse(raw) as DictionaryDeck[]
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid decks format')
    }

    return { data: parsed, error: false }
  } catch {
    return { data: [], error: true }
  }
}

export const saveDecks = (
  decks: DictionaryDeck[]
): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    DECKS_KEY,
    JSON.stringify(decks)
  )
}
