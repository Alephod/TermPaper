import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DictionaryEntry, TrainingSession, DictionaryDeck } from '../../types'
import { Button } from '../../components/ui/button/Button'
import { WordOfTheDayWidget } from '../../components/word-of-the-day/WordOfTheDayWidget'
import './HomePage.css'

type HomePageProps = {
  dictionary: DictionaryEntry[]
  decks: DictionaryDeck[]
  history: TrainingSession[]
  onStartTraining: () => void
}

const getAverageAccuracy = (history: TrainingSession[]): number => {
  if (history.length === 0) return 0
  const sum = history.reduce((total, session) => total + session.accuracy, 0)
  return Math.round(sum / history.length)
}

const getLearnedWordsCount = (history: TrainingSession[]): number => {
  const learnedIds = new Set<string>()
  history.forEach(session => {
    session.correctWordIds.forEach(id => learnedIds.add(id))
  })
  return learnedIds.size
}

const getRecentSessions = (history: TrainingSession[], limit: number = 3): TrainingSession[] => {
  return history.slice(0, limit)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const HomePage: React.FC<HomePageProps> = ({
  dictionary,
  decks,
  history,
  onStartTraining
}) => {
  const navigate = useNavigate()
  const [selectedDeck, setSelectedDeck] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(false)

  const learnedCount = getLearnedWordsCount(history)
  const averageAccuracy = getAverageAccuracy(history)
  const recentSessions = getRecentSessions(history)


  const handleStartTraining = async () => {
    setLoading(true)
    try {
      onStartTraining()
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAddWord = async () => {
    navigate('/dictionary')
  }

  const stats = [
    {
      label: 'Слов в словаре',
      value: dictionary.length,
      icon: '📚',
      color: '#3b82f6'
    },
    {
      label: 'Активных колод',
      value: decks.length,
      icon: '🎴',
      color: '#8b5cf6'
    },
    {
      label: 'Выучено слов',
      value: learnedCount,
      icon: '✅',
      color: '#10b981'
    },
    {
      label: 'Точность',
      value: `${averageAccuracy}%`,
      icon: '🎯',
      color: '#f59e0b'
    }
  ]

  return (
    <div className='home'>
      {/* Hero Section */}
      <section className='home__hero'>
        <div className='home__hero-content'>
          <div className='home__hero-text'>
            <h1 className='home__title'>
              Тренажёр иностранных слов
            </h1>
            <p className='home__subtitle'>
              Эффективно изучайте слова с помощью интервального повторения.
              Создавайте колоды, тренируйтесь и отслеживайте свой прогресс.
            </p>
          </div>


          <div className='home__hero-actions'>
            <Button
              variant='primary'
              size='lg'
              onClick={handleStartTraining}
              disabled={loading || dictionary.length === 0}
              loading={loading}
            >
              Начать тренировку
            </Button>

            <Button
              variant='secondary'
              size='lg'
              onClick={handleQuickAddWord}
            >
              ➕ Добавить слово
            </Button>
          </div>
        </div>
        <WordOfTheDayWidget dictionary={dictionary} />
      </section>

      {/* Quick Stats */}
      <section className='home__stats'>
        <h2 className='home__section-title'>Ваша статистика</h2>
        <div className='home__stats-grid'>
          {stats.map((stat, index) => (
            <div key={index} className='stat-card' style={{ '--accent-color': stat.color } as React.CSSProperties}>
              <div className='stat-card__icon'>{stat.icon}</div>
              <div className='stat-card__content'>
                <div className='stat-card__value'>{stat.value}</div>
                <div className='stat-card__label'>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className='home__quick-actions'>
        <h2 className='home__section-title'>Быстрые действия</h2>
        <div className='home__actions-grid'>
          <button
            className='action-card'
            onClick={() => navigate('/dictionary')}
          >
            <div className='action-card__icon'>📝</div>
            <div className='action-card__content'>
              <h3>Словарь</h3>
              <p>Добавить и редактировать слова</p>
            </div>
          </button>

          <button
            className='action-card'
            onClick={() => navigate('/decks')}
          >
            <div className='action-card__icon'>🎴</div>
            <div className='action-card__content'>
              <h3>Колоды</h3>
              <p>Управлять наборами слов</p>
            </div>
          </button>

          <button
            className='action-card'
            onClick={() => navigate('/statistics')}
          >
            <div className='action-card__icon'>📊</div>
            <div className='action-card__content'>
              <h3>Статистика</h3>
              <p>Детальный прогресс</p>
            </div>
          </button>
        </div>
      </section>


      {/* Recent Activity */}
      <section className='home__recent'>
        <div className='home__section-title'>
          <h2 style={{ fontSize: '2rem', margin: '0' }}>Последние тренировки</h2>
        </div>

        {recentSessions.length > 0 ? (
          <div className='home__sessions-list'>
            {recentSessions.map((session, index) => (
              <div key={session.id || index} className='session-card'>
                <div className='session-card__header'>
                  <div className='session-card__date'>{formatDate(session.date)}</div>
                  <div className={`session-card__accuracy session-card__accuracy--${session.accuracy >= 70 ? 'good' : session.accuracy >= 40 ? 'medium' : 'low'}`}>
                    {session.accuracy}%
                  </div>
                </div>
                <div className='session-card__stats'>
                  <span>✅ {session.correctAnswers} правильных</span>
                  <span>❌ {session.totalQuestions - session.correctAnswers} ошибок</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='home__empty-state'>
            <div className='home__empty-icon'>🎯</div>
            <h3>Начните первую тренировку</h3>
            <p>Тренируйтесь регулярно, чтобы увидеть свою статистику здесь</p>
            <Button
              variant='primary'
              size='lg'
              onClick={handleStartTraining}
              disabled={dictionary.length === 0}
            >
              Начать тренировку
            </Button>
          </div>
        )}
      </section>



    </div>
  )
}
