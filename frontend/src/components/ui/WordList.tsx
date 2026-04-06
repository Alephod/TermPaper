import React from 'react'
import type { Deck } from '../../types'

type WordListProps = {
  deck: Deck
  selectedWordId: string | null
  onSelectWord: (wordId: string) => void
}

export const WordList: React.FC<WordListProps> = ({
  deck,
  selectedWordId,
  onSelectWord
}) => {
  return (
    <div className='word-list'>
      <h2 className='word-list__title'>{deck.name}</h2>
      <table className='word-list__table'>
        <thead>
          <tr>
            <th>Слово</th>
            <th>Перевод</th>
          </tr>
        </thead>
        <tbody>
          {deck.words.map(word => (
            <tr
              key={word.id}
              className={`word-list__row ${
                word.id === selectedWordId ? 'word-list__row--active' : ''
              }`}
              onClick={() => onSelectWord(word.id)}
            >
              <td>{word.term}</td>
              <td>{word.translation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
