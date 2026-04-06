import React, { useMemo } from 'react'
import type { DictionaryEntry } from '../../types'

type WordOfTheDayWidgetProps = {
  dictionary: DictionaryEntry[]
}

const buildIndexForToday = (length: number): number => {
  if (length === 0) {
    return 0
  }

  const todayString = new Date().toISOString().slice(0, 10)
  const charCodes = todayString
    .split('')
    .map(char => char.charCodeAt(0))
  const sum = charCodes.reduce(
    (accumulator, code) => accumulator + code,
    0
  )

  return sum % length
}

export const WordOfTheDayWidget: React.FC<
  WordOfTheDayWidgetProps
> = ({ dictionary }) => {
  const wordOfTheDay = useMemo(() => {
    if (dictionary.length === 0) {
      return undefined
    }

    const index = buildIndexForToday(dictionary.length)
    return dictionary[index]
  }, [dictionary])

  if (!wordOfTheDay) {
    return (
      <div className='word-day'>
        <h3 className='word-day__title'>Слово дня</h3>
        <p className='word-day__empty'>В словаре пока нет слов</p>
      </div>
    )
  }

  return (
    <div className='word-day'>
      <h3 className='word-day__title'>Слово дня</h3>
      <p className='word-day__term'>{wordOfTheDay.term}</p>
      <p className='word-day__translation'>
        {wordOfTheDay.translation}
      </p>
      <p className='word-day__difficulty'>
        Сложность: {wordOfTheDay.difficulty}
      </p>
    </div>
  )
}
