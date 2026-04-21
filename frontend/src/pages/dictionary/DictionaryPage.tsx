import React, { useState, useMemo, useRef } from 'react'
import type {
  DictionaryEntry,
  DictionaryDeck,
  Difficulty,
  FilterDifficulty
} from '../../types'
import { dataService } from '../../services/dataService'
import { apiClient, ApiError } from '../../services/api'
import { Button } from '../../components/ui/button/Button'
import { Input } from '../../components/ui/input/Input'
import { Select } from '../../components/ui/select/Select'
import { WordList } from '../../components/word-list/WordList'
import './DictionaryPage.css'

type DictionaryPageProps = {
  dictionary: DictionaryEntry[]
  decks: DictionaryDeck[]
  onUpdateDictionary: (entries: DictionaryEntry[]) => void
  onUpdateDecks: (decks: DictionaryDeck[]) => void
  hasError: boolean
}

type FormState = {
  id: string | null
  term: string
  translation: string
  example: string
  exampleTranslation: string
  difficulty: Difficulty
  imageUrl: string | null
  imageFile: File | null
}

const buildEmptyFormState = (): FormState => ({
  id: null,
  term: '',
  translation: '',
  example: '',
  exampleTranslation: '',
  difficulty: 'easy',
  imageUrl: null,
  imageFile: null
})

export const DictionaryPage: React.FC<DictionaryPageProps> = ({
  dictionary,
  decks,
  onUpdateDictionary,
  onUpdateDecks,
  hasError
}) => {
  const [filter, setFilter] = useState<FilterDifficulty>('all')
  const [formState, setFormState] = useState<FormState>(buildEmptyFormState())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredEntries = useMemo(() => {
    if (filter === 'all') {
      return dictionary
    }
    return dictionary.filter(entry => entry.difficulty === filter)
  }, [dictionary, filter])

  const handleChangeFilter = (value: FilterDifficulty): void => {
    setFilter(value)
  }

  const handleEdit = (entry: DictionaryEntry): void => {
    setFormState({
      id: entry.id,
      term: entry.term,
      translation: entry.translation,
      example: entry.example,
      exampleTranslation: entry.exampleTranslation,
      difficulty: entry.difficulty,
      imageUrl: entry.imageUrl || null,
      imageFile: null
    })
    setImagePreview(entry.imageUrl || null)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    setFormState(prev => ({ ...prev, imageFile: file }))

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (): void => {
    setFormState(prev => ({ ...prev, imageFile: null, imageUrl: null }))
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await dataService.deleteWord(id)
      const updated = dictionary.filter(entry => entry.id !== id)
      onUpdateDictionary(updated)
    } catch (err) {
      console.error('Failed to delete word:', err)
      if (err instanceof ApiError) {
        setError(`Failed to delete word: ${err.message}`)
      } else {
        setError('Failed to delete word')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClearStorage = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await dataService.clearWords()
      onUpdateDictionary([])
      onUpdateDecks(
        decks.map(deck => ({
          ...deck,
          wordIds: []
        }))
      )
    } catch (err) {
      console.error('Failed to clear words:', err)
      if (err instanceof ApiError) {
        setError(`Failed to clear words: ${err.message}`)
      } else {
        setError('Failed to clear words')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!formState.term.trim() || !formState.translation.trim()) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      let imagePath = formState.imageUrl

      if (formState.imageFile) {
        const uploadResult = await apiClient.uploadImage(formState.imageFile)
        imagePath = uploadResult.filename
      }

      const wordData = {
        term: formState.term.trim(),
        translation: formState.translation.trim(),
        example: formState.example.trim(),
        exampleTranslation: formState.exampleTranslation.trim(),
        difficulty: formState.difficulty,
        imagePath: imagePath
      }

      if (formState.id) {
        const updated = await dataService.updateWord(formState.id, wordData)
        const newDictionary = dictionary.map(entry =>
          entry.id === formState.id ? updated : entry
        )
        onUpdateDictionary(newDictionary)
      } else {
        const newEntry = await dataService.createWord(wordData)

        // Проверяем, что слово еще не добавлено в UI
        if (!dictionary.some(entry => entry.id === newEntry.id)) {
          onUpdateDictionary([...dictionary, newEntry])
        }
      }

      setFormState(buildEmptyFormState())
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Failed to save word:', err)
      if (err instanceof ApiError) {
        setError(`Failed to save word: ${err.message}`)
      } else {
        setError('Failed to save word')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='dictionary-page'>
      <div className='dictionary__hero'>
        <div className='dictionary__hero-content'>
          <h1 className='dictionary__title'>📝 Словарь</h1>
          <p className='dictionary__subtitle'>
            Управляйте вашим словарем: добавляйте, редактируйте и удаляйте слова для тренировок
          </p>

          <div className='dictionary__stats'>
            <div className='dictionary__stat'>
              <span className='dictionary__stat-value'>{dictionary.length}</span>
              <span className='dictionary__stat-label'>всего слов</span>
            </div>
            <div className='dictionary__stat'>
              <span className='dictionary__stat-value'>{dictionary.filter(w => w.difficulty === 'easy').length}</span>
              <span className='dictionary__stat-label'>легких</span>
            </div>
            <div className='dictionary__stat'>
              <span className='dictionary__stat-value'>{dictionary.filter(w => w.difficulty === 'medium').length}</span>
              <span className='dictionary__stat-label'>средних</span>
            </div>
            <div className='dictionary__stat'>
              <span className='dictionary__stat-value'>{dictionary.filter(w => w.difficulty === 'hard').length}</span>
              <span className='dictionary__stat-label'>сложных</span>
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <div className='dictionary__error-banner'>
          <div className='dictionary__error-content'>
            <span className='dictionary__error-icon'>⚠️</span>
            <div className='dictionary__error-text'>
              <h3>Ошибка загрузки данных</h3>
              <p>Не удалось корректно прочитать словарь. Вы можете очистить его и начать заново.</p>
            </div>
            <Button
              variant='danger'
              onClick={handleClearStorage}
              disabled={loading}
              loading={loading}
            >
              Очистить словарь
            </Button>
          </div>
        </div>
      )}

      <section className='dictionary__form-section'>
        <div className='dictionary__section-header'>
          <h2 className='dictionary__section-title'>
            {formState.id ? '✏️ Редактирование слова' : '➕ Добавить новое слово'}
          </h2>
        </div>

        <div className='dictionary__form-card'>
          <form className='dictionary-form' onSubmit={handleSubmit}>
            <div className='dictionary-form__row'>
              <Input
                label='Слово *'
                value={formState.term}
                onChange={event =>
                  setFormState(previous => ({
                    ...previous,
                    term: event.target.value
                  }))
                }
                placeholder='Введите слово'
                disabled={loading}
                required
                fullWidth
              />

              <Input
                label='Перевод *'
                value={formState.translation}
                onChange={event =>
                  setFormState(previous => ({
                    ...previous,
                    translation: event.target.value
                  }))
                }
                placeholder='Введите перевод'
                disabled={loading}
                required
                fullWidth
              />
            </div>

            <div className='dictionary-form__row'>
              <Input
                label='Пример'
                value={formState.example}
                onChange={event =>
                  setFormState(previous => ({
                    ...previous,
                    example: event.target.value
                  }))
                }
                placeholder='Пример использования'
                disabled={loading}
                fullWidth
              />

              <Input
                label='Перевод примера'
                value={formState.exampleTranslation}
                onChange={event =>
                  setFormState(previous => ({
                    ...previous,
                    exampleTranslation: event.target.value
                  }))
                }
                placeholder='Перевод примера'
                disabled={loading}
                fullWidth
              />
            </div>

            <div className='dictionary-form__row'>
              <div className='dictionary-form__image-upload'>
                <label className='dictionary-form__label'>Изображение</label>
                <div className='dictionary-form__image-area'>
                  {imagePreview ? (
                    <div className='dictionary-form__image-preview'>
                      <img src={imagePreview} alt='Preview' />
                      <button
                        type='button'
                        className='dictionary-form__image-remove'
                        onClick={handleRemoveImage}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className='dictionary-form__image-placeholder'>
                      <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        onChange={handleImageSelect}
                        disabled={loading}
                        className='dictionary-form__file-input'
                      />
                    </div>
                  )}
                </div>
              </div>

              <Select
                label='Сложность'
                value={formState.difficulty}
                onChange={event =>
                  setFormState(previous => ({
                    ...previous,
                    difficulty: event.target.value as Difficulty
                  }))
                }
                disabled={loading}
                options={[
                  { value: 'easy', label: 'Легкая' },
                  { value: 'medium', label: 'Средняя' },
                  { value: 'hard', label: 'Сложная' }
                ]}
                fullWidth
              />
            </div>

            <div className='dictionary-form__row dictionary-form__row--last'>
              <div className='dictionary-form__actions'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setFormState(buildEmptyFormState())
                    setImagePreview(null)
                  }}
                  disabled={loading}
                >
                  Отмена
                </Button>

                <Button
                  type='submit'
                  variant='primary'
                  disabled={loading || !formState.term.trim() || !formState.translation.trim()}
                  loading={loading}
                >
                  {formState.id ? 'Обновить' : 'Добавить'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className='dictionary__list-section'>
        <div className='dictionary__section-header'>
          <h2 className='dictionary__section-title'>📚 Все слова</h2>
          <div className='dictionary__filter'>
            <label className='dictionary__filter-label'>Фильтр по сложности:</label>
            <Select
              value={filter}
              onChange={event =>
                handleChangeFilter(event.target.value as FilterDifficulty)
              }
              options={[
                { value: 'all', label: 'Все слова' },
                { value: 'easy', label: 'Легкие' },
                { value: 'medium', label: 'Средние' },
                { value: 'hard', label: 'Сложные' }
              ]}
            />
          </div>
        </div>

        {error && (
          <div className='dictionary__error-message'>
            <span className='dictionary__error-icon'>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <WordList
          words={filteredEntries}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage={dictionary.length === 0 ? 'Словарь пуст' : 'Нет слов по этому фильтру'}
          emptyDescription={dictionary.length === 0
            ? 'Добавьте первое слово, чтобы начать тренировки'
            : 'Попробуйте изменить фильтр или добавьте новые слова'
          }
        />
      </section>
    </div>
  )
}
