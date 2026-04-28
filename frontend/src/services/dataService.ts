import type {
  DictionaryDeck,
  DictionaryEntry,
  Difficulty,
  TrainingSession
} from '../types'
import { apiClient } from './api'

export class DataService {
  private static instance: DataService
  private cache: {
		words: DictionaryEntry[];
		decks: DictionaryDeck[];
		sessions: TrainingSession[];
	} = {
      words: [],
      decks: [],
      sessions: []
    }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  // Words operations
  async loadWords(difficulty?: Difficulty): Promise<DictionaryEntry[]> {
    try {
      const words = await apiClient.getWords(difficulty)
      this.cache.words = words.map((word) =>
        apiClient.wordToDictionaryEntry(word)
      )
      return this.cache.words
    } catch (error) {
      console.error('Failed to load words:', error)
      throw error
    }
  }

  async createWord(
    entry: Omit<DictionaryEntry, 'id'>
  ): Promise<DictionaryEntry> {
    try {
      const wordData = apiClient.dictionaryEntryToWord(entry)
      const word = await apiClient.createWord(wordData)
      const dictionaryEntry = apiClient.wordToDictionaryEntry(word)
      this.cache.words.push(dictionaryEntry)
      return dictionaryEntry
    } catch (error) {
      console.error('Failed to create word:', error)
      throw error
    }
  }

  async updateWord(
    id: string,
    updates: Partial<DictionaryEntry>
  ): Promise<DictionaryEntry> {
    try {
      const word = await apiClient.updateWord(id, updates)
      const dictionaryEntry = apiClient.wordToDictionaryEntry(word)
      const index = this.cache.words.findIndex((w) => w.id === id)
      if (index !== -1) {
        this.cache.words[index] = dictionaryEntry
      }
      return dictionaryEntry
    } catch (error) {
      console.error('Failed to update word:', error)
      throw error
    }
  }

  async deleteWord(id: string): Promise<void> {
    try {
      await apiClient.deleteWord(id)
      this.cache.words = this.cache.words.filter((w) => w.id !== id)

      // Remove word from all decks
      this.cache.decks = this.cache.decks.map((deck) => ({
        ...deck,
        wordIds: deck.wordIds.filter((wordId) => wordId !== id)
      }))
    } catch (error) {
      console.error('Failed to delete word:', error)
      throw error
    }
  }

  async clearWords(): Promise<void> {
    try {
      await apiClient.clearWords()
      this.cache.words = []
      this.cache.decks = this.cache.decks.map((deck) => ({
        ...deck,
        wordIds: []
      }))
    } catch (error) {
      console.error('Failed to clear words:', error)
      throw error
    }
  }

  // Decks operations
  async loadDecks(): Promise<DictionaryDeck[]> {
    try {
      const decks = await apiClient.getDecks()
      this.cache.decks = decks.map((deck) =>
        apiClient.deckToDictionaryDeck(deck)
      )
      return this.cache.decks
    } catch (error) {
      console.error('Failed to load decks:', error)
      throw error
    }
  }

  async createDeck(
    deck: Omit<DictionaryDeck, 'id' | 'wordIds'>
  ): Promise<DictionaryDeck> {
    try {
      const deckData = apiClient.dictionaryDeckToDeck(deck)
      const createdDeck = await apiClient.createDeck(deckData)
      const dictionaryDeck = apiClient.deckToDictionaryDeck(createdDeck)
      this.cache.decks.push(dictionaryDeck)
      return dictionaryDeck
    } catch (error) {
      console.error('Failed to create deck:', error)
      throw error
    }
  }

  async updateDeck(
    id: string,
    updates: Partial<DictionaryDeck>
  ): Promise<DictionaryDeck> {
    try {
      const deck = await apiClient.updateDeck(id, {
        name: updates.name,
        wordIds: updates.wordIds
      })
      const dictionaryDeck = apiClient.deckToDictionaryDeck(deck)
      const index = this.cache.decks.findIndex((d) => d.id === id)
      if (index !== -1) {
        this.cache.decks[index] = dictionaryDeck
      }
      return dictionaryDeck
    } catch (error) {
      console.error('Failed to update deck:', error)
      throw error
    }
  }

  async deleteDeck(id: string): Promise<void> {
    try {
      await apiClient.deleteDeck(id)
      this.cache.decks = this.cache.decks.filter((d) => d.id !== id)
    } catch (error) {
      console.error('Failed to delete deck:', error)
      throw error
    }
  }

  async createWordInDeck(
    deckId: string,
    word: Omit<DictionaryEntry, 'id'>
  ): Promise<{ word: DictionaryEntry; deck: DictionaryDeck }> {
    try {
      const wordData = apiClient.dictionaryEntryToWord(word)
      const result = await apiClient.createWordInDeck(deckId, wordData)
      const dictionaryEntry = apiClient.wordToDictionaryEntry(result.word)
      const dictionaryDeck = apiClient.deckToDictionaryDeck(result.deck)

      this.cache.words.push(dictionaryEntry)
      const index = this.cache.decks.findIndex((d) => d.id === deckId)
      if (index !== -1) {
        this.cache.decks[index] = dictionaryDeck
      }

      return { word: dictionaryEntry, deck: dictionaryDeck }
    } catch (error) {
      console.error('Failed to create word in deck:', error)
      throw error
    }
  }

  async addExistingWordToDeck(
    deckId: string,
    wordId: string
  ): Promise<DictionaryDeck> {
    try {
      const deck = await apiClient.addExistingWordToDeck(deckId, wordId)
      const dictionaryDeck = apiClient.deckToDictionaryDeck(deck)

      const index = this.cache.decks.findIndex((d) => d.id === deckId)
      if (index !== -1) {
        this.cache.decks[index] = dictionaryDeck
      }

      return dictionaryDeck
    } catch (error) {
      console.error('Failed to add existing word to deck:', error)
      throw error
    }
  }

  async removeWordFromDeck(deckId: string, wordId: string): Promise<void> {
    try {
      await apiClient.removeWordFromDeck(deckId, wordId)

      // Update cache
      const index = this.cache.decks.findIndex((d) => d.id === deckId)
      if (index !== -1) {
        this.cache.decks[index].wordIds = this.cache.decks[
          index
        ].wordIds.filter((id) => id !== wordId)
      }
    } catch (error) {
      console.error('Failed to remove word from deck:', error)
      throw error
    }
  }

  // Training sessions operations
  async loadTrainingSessions(): Promise<TrainingSession[]> {
    try {
      const sessions = await apiClient.getTrainingSessions()
      this.cache.sessions = sessions.map((session) =>
        apiClient.trainingSessionToTrainingSession(session)
      )
      return this.cache.sessions
    } catch (error) {
      console.error('Failed to load training sessions:', error)
      throw error
    }
  }

  async createTrainingSession(
    session: Omit<TrainingSession, 'id' | 'date'>
  ): Promise<TrainingSession> {
    try {
      const createdSession = await apiClient.createTrainingSession(session)
      const formattedSession =
				apiClient.trainingSessionToTrainingSession(createdSession)
      this.cache.sessions.unshift(formattedSession)
      return formattedSession
    } catch (error) {
      console.error('Failed to create training session:', error)
      throw error
    }
  }

  // Cache management
  getCachedWords(): DictionaryEntry[] {
    return this.cache.words
  }

  getCachedDecks(): DictionaryDeck[] {
    return this.cache.decks
  }

  getCachedSessions(): TrainingSession[] {
    return this.cache.sessions
  }

  clearCache(): void {
    this.cache = {
      words: [],
      decks: [],
      sessions: []
    }
  }

  // Utility methods
  getWordById(id: string): DictionaryEntry | undefined {
    return this.cache.words.find((word) => word.id === id)
  }

  getDeckById(id: string): DictionaryDeck | undefined {
    return this.cache.decks.find((deck) => deck.id === id)
  }

  getWordsByDeck(deckId: string): DictionaryEntry[] {
    const deck = this.getDeckById(deckId)
    if (!deck) return []

    return deck.wordIds
      .map((wordId) => this.getWordById(wordId))
      .filter((word): word is DictionaryEntry => word !== undefined)
  }

  async initializeData(): Promise<{
		words: DictionaryEntry[];
		decks: DictionaryDeck[];
		sessions: TrainingSession[];
	}> {
    try {
      const [words, decks, sessions] = await Promise.all([
        this.loadWords(),
        this.loadDecks(),
        this.loadTrainingSessions()
      ])

      return { words, decks, sessions }
    } catch (error) {
      console.error('Failed to initialize data:', error)
      throw error
    }
  }
}

export const dataService = DataService.getInstance()
