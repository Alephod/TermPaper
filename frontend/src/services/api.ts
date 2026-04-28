import type {
  Deck,
  DictionaryDeck,
  DictionaryEntry,
  Difficulty,
  TrainingSession,
  Word
} from '../types'

export const API_BASE_URL =
	import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE_ENDPOINT = `${API_BASE_URL}/api`
const UPLOAD_ENDPOINT = `${API_BASE_URL}/uploads`

export const extractRelativeImagePath = (
  fullUrl: string | null
): string | null => {
  if (!fullUrl) return null
  if (fullUrl.startsWith(API_BASE_URL)) {
    return fullUrl.slice(API_BASE_URL.length)
  }
  return fullUrl
}

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

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
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
        return null as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error'
      )
    }
  }

  // Words API
  async getWords(difficulty?: Difficulty): Promise<Word[]> {
    const params = difficulty ? `?difficulty=${difficulty}` : ''
    return this.request<Word[]>(`/words${params}`)
  }

  async getWord(id: string): Promise<Word> {
    return this.request<Word>(`/words/${id}`)
  }

  async createWord(word: Omit<Word, 'id'>): Promise<Word> {
    return this.request<Word>('/words', {
      method: 'POST',
      body: JSON.stringify(word)
    })
  }

  async updateWord(id: string, updates: Partial<Word>): Promise<Word> {
    return this.request<Word>(`/words/${id}`, {
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
  async getDecks(): Promise<Deck[]> {
    return this.request<Deck[]>('/decks')
  }

  async getDeck(id: string): Promise<Deck> {
    return this.request<Deck>(`/decks/${id}`)
  }

  async createDeck(deck: { name: string }): Promise<Deck> {
    return this.request<Deck>('/decks', {
      method: 'POST',
      body: JSON.stringify(deck)
    })
  }

  async updateDeck(
    id: string,
    updates: { name?: string; wordIds?: string[] }
  ): Promise<Deck> {
    return this.request<Deck>(`/decks/${id}`, {
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
    word: Omit<Word, 'id'>
  ): Promise<{ word: Word; deck: Deck }> {
    return this.request<{ word: Word; deck: Deck }>(
      `/decks/${deckId}/words/new`,
      {
        method: 'POST',
        body: JSON.stringify(word)
      }
    )
  }

  async addExistingWordToDeck(deckId: string, wordId: string): Promise<Deck> {
    return this.request<Deck>(`/decks/${deckId}/words`, {
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

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: 'Unknown error' }
      }
      throw new ApiError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    return await response.json()
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
  async getWordsForReview(wordIds: string[], limit?: number): Promise<Word[]> {
    return this.request<Word[]>('/training/words-for-review', {
      method: 'POST',
      body: JSON.stringify({ wordIds, limit })
    })
  }

  async submitReview(
    wordId: string,
    quality: number
  ): Promise<{
    word: Word
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

  // Helper methods to convert between API types and frontend types
  wordToDictionaryEntry(word: any): DictionaryEntry {
    const imagePath = word.imageUrl || word.image_url || null
    // Convert relative paths to full URLs
    const fullImageUrl =
			imagePath && imagePath.startsWith('/')
			  ? `${API_BASE_URL}${imagePath}`
			  : imagePath

    return {
      id: word.id,
      term: word.term,
      translation: word.translation,
      difficulty: word.difficulty as Difficulty,
      example: word.example || '',
      exampleTranslation:
				word.exampleTranslation || word.example_translation || '',
      imageUrl: fullImageUrl,
      // SM-2 поля
      sm2EasinessFactor: word.sm2EasinessFactor ?? null,
      sm2Interval: word.sm2Interval ?? null,
      sm2Repetitions: word.sm2Repetitions ?? null,
      sm2NextReview: word.sm2NextReview ?? null,
      sm2LastReview: word.sm2LastReview ?? null
    }
  }

  dictionaryEntryToWord(entry: Omit<DictionaryEntry, 'id'>): {
		term: string;
		translation: string;
		difficulty: Difficulty;
		example: string;
		exampleTranslation: string;
		imagePath?: string | null;
	} {
    return {
      term: entry.term,
      translation: entry.translation,
      difficulty: entry.difficulty,
      example: entry.example,
      exampleTranslation: entry.exampleTranslation,
      imagePath: entry.imagePath || null
    }
  }

  deckToDictionaryDeck(deck: any): DictionaryDeck {
    return {
      id: deck.id,
      name: deck.name,
      wordIds: deck.wordIds || []
    }
  }

  trainingSessionToTrainingSession(session: any): TrainingSession {
    return {
      id: session.id,
      date: session.date,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      accuracy: session.accuracy,
      correctWordIds: session.correctWordIds || [],
      wrongWordIds: session.wrongWordIds || []
    }
  }

  dictionaryDeckToDeck(deck: Omit<DictionaryDeck, 'id' | 'wordIds'>): {
		name: string;
	} {
    return {
      name: deck.name
    }
  }
}

export const apiClient = new ApiClient()
export { ApiError, ApiClient }
