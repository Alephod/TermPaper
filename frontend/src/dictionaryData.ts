import type { DictionaryEntry } from './types'

export const initialDictionary: DictionaryEntry[] = [
  {
    id: 'd1',
    term: 'apple',
    translation: 'яблоко',
    difficulty: 'easy',
    example: 'I eat an apple every morning',
    exampleTranslation: 'Я ем яблоко каждое утро'
  },
  {
    id: 'd2',
    term: 'house',
    translation: 'дом',
    difficulty: 'easy',
    example: 'This house is very old',
    exampleTranslation: 'Этот дом очень старый'
  },
  {
    id: 'd3',
    term: 'water',
    translation: 'вода',
    difficulty: 'medium',
    example: 'Drink more water during the day',
    exampleTranslation: 'Пей больше воды в течение дня'
  },
  {
    id: 'd4',
    term: 'interesting',
    translation: 'интересный',
    difficulty: 'medium',
    example: 'This book is very interesting',
    exampleTranslation: 'Эта книга очень интересная'
  },
  {
    id: 'd5',
    term: 'airport',
    translation: 'аэропорт',
    difficulty: 'hard',
    example: 'We arrived at the airport early',
    exampleTranslation: 'Мы прибыли в аэропорт рано'
  }
]
