import React from 'react'
import type { Word } from '../../types'

type WordDetailsProps = {
  word: Word
}

export const WordDetails: React.FC<WordDetailsProps> = ({ word }) => {
  return (
    <div className='word-details'>
      <h3 className='word-details__term'>{word.term}</h3>
      <p className='word-details__translation'>{word.translation}</p>

      <div className='word-details__block'>
        <p className='word-details__label'>Контекстное предложение</p>
        <p className='word-details__example'>{word.example}</p>
      </div>

      <div className='word-details__block'>
        <p className='word-details__label'>Перевод предложения</p>
        <p className='word-details__example-translation'>
          {word.exampleTranslation}
        </p>
      </div>
    </div>
  )
}
