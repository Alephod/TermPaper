import React, { SelectHTMLAttributes, forwardRef } from 'react'

type SelectOption = {
  value: string
  label: string
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>((
  { label, error, helperText, options, fullWidth = false, className = '', ...props },
  ref
) => {
  const wrapperClass = [
    'select-wrapper',
    fullWidth ? 'select-wrapper--full' : '',
    className
  ].join(' ')

  const selectClass = [
    'select',
    error ? 'select--error' : ''
  ].join(' ')

  return (
    <div className={wrapperClass}>
      {label && <label className="select__label">{label}</label>}
      <select ref={ref} className={selectClass} {...props}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="select__error">{error}</span>}
      {helperText && !error && <span className="select__helper">{helperText}</span>}
    </div>
  )
})

Select.displayName = 'Select'
