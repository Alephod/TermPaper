import React, { useRef } from 'react'
import './ImageUpload.css'

type ImageUploadProps = {
  label?: string
  previewUrl: string | null
  onImageSelect: (file: File) => void
  onImageRemove: () => void
  disabled?: boolean
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Изображение',
  previewUrl,
  onImageSelect,
  onImageRemove,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return
    onImageSelect(file)
  }

  const handleRemove = (): void => {
    onImageRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className='image-upload'>
      <label className='image-upload__label'>{label}</label>
      <div className={`image-upload__area image-upload__area--large ${previewUrl ? 'image-upload__area--has-image' : ''}`}>
        {previewUrl ? (
          <div className='image-upload__preview'>
            <img src={previewUrl} alt='Preview' />
            <button
              type='button'
              className='image-upload__remove'
              onClick={handleRemove}
              disabled={disabled}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className='image-upload__placeholder'>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              disabled={disabled}
              className='image-upload__input'
            />
          </div>
        )}
      </div>
    </div>
  )
}
