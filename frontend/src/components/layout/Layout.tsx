import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../ui/button/Button'

import './Layout.css'

type LayoutProps = {
  children: ReactNode;
  isDictionaryError: boolean;
};

const navItems = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/training', label: 'Тренировка', icon: '🎯' },
  { path: '/dictionary', label: 'Словарь', icon: '📝' },
  { path: '/decks', label: 'Колоды', icon: '🎴' }
]

export function Layout({
  children,
  isDictionaryError
}: LayoutProps): JSX.Element {
  return (
    <div className='layout'>
      <header className='layout__header '>
        <div className='layout__header-content container'>
          <div className=''>
            <h1 className='layout__title'>🎓 Тренажёр слов</h1>
          </div>

          <nav className='layout__nav'>
            {navItems.map(({ path, label, icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `layout__nav-button ${isActive ? 'layout__nav-button--active' : ''}`
                }
                title={label}
              >
                <span className='layout__nav-icon'>{icon}</span>

                <span className='layout__nav-label'>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className='container layout__main'>
        {isDictionaryError && (
          <div className='layout__error-banner'>
            <div className='layout__error-content'>
              <span className='layout__error-icon'>⚠️</span>

              <div className='layout__error-text'>
                {isDictionaryError && (
                  <p>
                    Произошла ошибка при загрузке словаря. Проверьте подключение
                    к серверу.
                  </p>
                )}
              </div>

              <Button
                variant='ghost'
                size='sm'
                onClick={() => window.location.reload()}
              >
                ⟳
              </Button>
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
