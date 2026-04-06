import React from 'react'
import type { Deck } from '../../types'

export type DeckListProps = {
  decks: Deck[]
  selectedDeckId: string | null
  onSelectDeck: (deckId: string) => void
}

export function DeckList({
  decks,
  selectedDeckId,
  onSelectDeck,
}: DeckListProps): React.ReactElement {
  return (
    <ul aria-label="Decks">
      {decks.map(deck => {
        const isActive = deck.id === selectedDeckId
        const count = deck.words.length

        return (
          <li key={deck.id}>
            <button
              type="button"
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onSelectDeck(deck.id)}
            >
              {deck.name}
              <span aria-label="words-count"> ({count})</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
