import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeckList } from './DeckList'
import type { Deck, Word } from '../../types'

const makeWord = (id: string): Word => ({
  id,
  term: `term-${id}`,
  translation: `translation-${id}`,
  example: `example-${id}`,
  exampleTranslation: `example-translation-${id}`,
})

const decks: Deck[] = [
  { id: 'd1', name: 'Animals', words: [makeWord('w1')] },
  { id: 'd2', name: 'Verbs', words: [makeWord('w2'), makeWord('w3')] },
]

describe('DeckList', () => {
  it('renders empty state', () => {
    render(<DeckList decks={[]} selectedDeckId={null} onSelectDeck={() => {}} />)

    expect(screen.queryByRole('list')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders all decks with word counts', () => {
    render(<DeckList decks={decks} selectedDeckId={null} onSelectDeck={() => {}} />)

    expect(screen.getByRole('button', { name: /Animals/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Verbs/i })).toBeTruthy()

    const counts = screen.getAllByLabelText('words-count')
    expect(counts).toHaveLength(2)
    expect(counts[0]?.textContent).toContain('(1)')
    expect(counts[1]?.textContent).toContain('(2)')
  })

  it('marks selected deck as active', () => {
    render(<DeckList decks={decks} selectedDeckId="d1" onSelectDeck={() => {}} />)

    const animalsBtn = screen.getByRole('button', { name: /Animals/i })
    const verbsBtn = screen.getByRole('button', { name: /Verbs/i })

    expect(animalsBtn.getAttribute('data-active')).toBe('true')
    expect(verbsBtn.getAttribute('data-active')).toBe('false')
  })

  it('calls onSelectDeck when clicked', () => {
    const onSelectDeck = (id: string): void => {
      clicks.push(id)
    }
    const clicks: string[] = []

    render(<DeckList decks={decks} selectedDeckId={null} onSelectDeck={onSelectDeck} />)

    fireEvent.click(screen.getByRole('button', { name: /Verbs/i }))

    expect(clicks).toEqual(['d2'])
  })
})
