export type * from '../../types'

// Components
export { Button } from './Button'
export { DeckList } from './DeckList'
export { DecksPanel } from './DecksPanel'
export { FlashcardTrainer } from './FlashcardTrainer'
export { Input } from './Input'
export { Layout } from './Layout'
export { Select } from './Select'
export { WordDetails } from './WordDetails'
export { WordList } from './WordList'
export { WordOfTheDayWidget } from './WordOfTheDayWidget'

// Utils
export function buildButtonLabel(label: string): string {
    return label
}
