import React, { InputHTMLAttributes, forwardRef } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { label, error, helperText, fullWidth = false, className = '', ...props },
  ref
) => {
  const wrapperClass = [
    'input-wrapper',
    fullWidth ? 'input-wrapper--full' : '',
    className
  ].join(' ')

  const inputClass = [
    'input',
    error ? 'input--error' : ''
  ].join(' ')

  return (
    <div className={wrapperClass}>
      {label && <label className="input__label">{label}</label>}
      <input ref={ref} className={inputClass} {...props} />
      {error && <span className="input__error">{error}</span>}
      {helperText && !error && <span className="input__helper">{helperText}</span>}
    </div>
  )
})

Input.displayName = 'Input'
