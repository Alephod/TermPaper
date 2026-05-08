import type {
  DictionaryDeck,
  DictionaryEntry,
  Difficulty,
  TrainingSession
} from '../types'

import { API_BASE_URL } from '../utils/imageUtils'

const API_BASE_ENDPOINT = `${API_BASE_URL}/api`
const UPLOAD_ENDPOINT = `${API_BASE_URL}/uploads`

export { API_BASE_URL }

class ApiError extends Error {
  constructor(
    message: string,
		public status?: number,
		public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_ENDPOINT) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      return this.parseResponse(response)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error'
      )
    }
  }

  private async parseResponse(response: Response): Promise<any> {
    if (!response.ok) {
      let errorData: { error?: string; [key: string]: unknown }
      try {
        errorData = await response.json() as typeof errorData
      } catch {
        errorData = { error: 'Unknown error' }
      }
      throw new ApiError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    if (response.status === 204) {
      return null
    }

    return await response.json()
  }

  // Words API
  async getWords(difficulty?: Difficulty): Promise<DictionaryEntry[]> {
    const params = difficulty ? `?difficulty=${difficulty}` : ''
    return this.request<DictionaryEntry[]>(`/words${params}`)
  }

  async getWord(id: string): Promise<DictionaryEntry> {
    return this.request<DictionaryEntry>(`/words/${id}`)
  }

  async createWord(
    word: Omit<DictionaryEntry, 'id' | 'imageUrl'>
  ): Promise<DictionaryEntry> {
    return this.request<DictionaryEntry>('/words', {
      method: 'POST',
      body: JSON.stringify(word)
    })
  }

  async updateWord(
    id: string,
    updates: Partial<DictionaryEntry>
  ): Promise<DictionaryEntry> {
    return this.request<DictionaryEntry>(`/words/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  async deleteWord(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/words/${id}`, {
      method: 'DELETE'
    })
  }

  async clearWords(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/words', {
      method: 'DELETE'
    })
  }

  // Decks API
  async getDecks(): Promise<DictionaryDeck[]> {
    return this.request<DictionaryDeck[]>('/decks')
  }

  async getDeck(id: string): Promise<DictionaryDeck> {
    return this.request<DictionaryDeck>(`/decks/${id}`)
  }

  async createDeck(deck: { name: string }): Promise<DictionaryDeck> {
    return this.request<DictionaryDeck>('/decks', {
      method: 'POST',
      body: JSON.stringify(deck)
    })
  }

  async updateDeck(
    id: string,
    updates: { name?: string; wordIds?: string[] }
  ): Promise<DictionaryDeck> {
    return this.request<DictionaryDeck>(`/decks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async deleteDeck(id: string): Promise<void> {
    return this.request<void>(`/decks/${id}`, {
      method: 'DELETE'
    })
  }

  async createWordInDeck(
    deckId: string,
    word: Omit<DictionaryEntry, 'id' | 'imageUrl'>
  ): Promise<{ word: DictionaryEntry; deck: DictionaryDeck }> {
    return this.request<{ word: DictionaryEntry; deck: DictionaryDeck }>(
      `/decks/${deckId}/words/new`,
      {
        method: 'POST',
        body: JSON.stringify(word)
      }
    )
  }

  async addExistingWordToDeck(
    deckId: string,
    wordId: string
  ): Promise<DictionaryDeck> {
    return this.request<DictionaryDeck>(`/decks/${deckId}/words`, {
      method: 'POST',
      body: JSON.stringify({ wordId })
    })
  }

  async removeWordFromDeck(deckId: string, wordId: string): Promise<void> {
    return this.request<void>(`/decks/${deckId}/words/${wordId}`, {
      method: 'DELETE'
    })
  }

  // Upload API
  async uploadImage(file: File): Promise<{ filename: string; path: string }> {
    const url = `${UPLOAD_ENDPOINT}/image`
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })

    return this.parseResponse(response)
  }

  // Training Sessions API
  async getTrainingSessions(): Promise<TrainingSession[]> {
    return this.request<TrainingSession[]>('/training')
  }

  async createTrainingSession(
    session: Omit<TrainingSession, 'id' | 'date'>
  ): Promise<TrainingSession> {
    return this.request<TrainingSession>('/training', {
      method: 'POST',
      body: JSON.stringify(session)
    })
  }

  // SM-2 API
  async getWordsForReview(
    wordIds: string[],
    limit?: number
  ): Promise<DictionaryEntry[]> {
    return this.request<DictionaryEntry[]>('/training/words-for-review', {
      method: 'POST',
      body: JSON.stringify({ wordIds, limit })
    })
  }

  async submitReview(
    wordId: string,
    quality: number
  ): Promise<{
    word: DictionaryEntry
    previous: {
      easinessFactor: number
      interval: number
      repetitions: number
    }
    new: {
      easinessFactor: number
      interval: number
      repetitions: number
    }
    quality: number
  }> {
    return this.request('/training/review', {
      method: 'POST',
      body: JSON.stringify({ wordId, quality })
    })
  }

  // Получение статистики SM-2
  async getSM2Stats(): Promise<{
    wordsDueToday: number
    wordsReviewedToday: number
  }> {
    return this.request<{
      wordsDueToday: number
      wordsReviewedToday: number
    }>('/training/stats')
  }

}

export const apiClient = new ApiClient()
export { ApiError, ApiClient }
