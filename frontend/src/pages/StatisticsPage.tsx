import React from 'react'
import type {
  DictionaryEntry,
  TrainingSession
} from '../types'

type StatisticsPageProps = {
  dictionary: DictionaryEntry[]
  history: TrainingSession[]
}

const calculateAverageAccuracy = (
  history: TrainingSession[]
): number => {
  if (history.length === 0) {
    return 0
  }

  const sum = history.reduce(
    (accumulator, session) => accumulator + session.accuracy,
    0
  )

  return Math.round(sum / history.length)
}

const calculateLearnedWords = (
  history: TrainingSession[]
): number => {
  const learned = new Set<string>()

  history.forEach(session => {
    session.correctWordIds.forEach(id => {
      learned.add(id)
    })
  })

  return learned.size
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

export const StatisticsPage: React.FC<
  StatisticsPageProps
> = ({
  dictionary,
  history
}) => {
    const averageAccuracy = calculateAverageAccuracy(history)
    const learnedWordsCount = calculateLearnedWords(history)

    return (
      <div className='statistics-page'>
        {/* Hero Section */}
        <section className='statistics__hero'>
          <h1 className='statistics__title'>📊 Статистика</h1>
          <p className='statistics__subtitle'>
            Отслеживайте свой прогресс и достижения в изучении слов
          </p>

          <div className='statistics__stats'>
            <div className='statistics__stat'>
              <span className='statistics__stat-value'>{history.length}</span>
              <span className='statistics__stat-label'>Тренировок</span>
            </div>
            <div className='statistics__stat'>
              <span className='statistics__stat-value'>{averageAccuracy}%</span>
              <span className='statistics__stat-label'>Средняя точность</span>
            </div>
            <div className='statistics__stat'>
              <span className='statistics__stat-value'>{learnedWordsCount}</span>
              <span className='statistics__stat-label'>Выучено слов</span>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className='statistics__history'>
          <div className='statistics__section-header'>
            <h2 className='statistics__section-title'>История тренировок</h2>
          </div>

          {history.length === 0 ? (
            <div className='statistics__empty-state'>
              <div className='statistics__empty-icon'>🎯</div>
              <h3>Нет данных</h3>
              <p>Вы ещё не проходили тренировки. Начните первую тренировку, чтобы увидеть статистику.</p>
            </div>
          ) : (
            <div className='statistics__table-wrapper'>
              <table className='statistics__table'>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Вопросов</th>
                    <th>Правильных</th>
                    <th>Точность</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(session => (
                    <tr key={session.id}>
                      <td>{formatDate(session.date)}</td>
                      <td>{session.totalQuestions}</td>
                      <td>{session.correctAnswers}</td>
                      <td>
                        <span className={`statistics__accuracy statistics__accuracy--${session.accuracy >= 70 ? 'good' : session.accuracy >= 40 ? 'medium' : 'low'}`}>
                          {session.accuracy}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    )
  }
