import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AvatarPicker from './AvatarPicker'
import ImageCropper from './ImageCropper'
import { useKids } from '../../hooks/useKids'
import { useFamily } from '../../context/FamilyContext'
import { uploadAvatar } from '../../lib/avatarStorage'

export default function KidForm({ isOpen, onClose, kid = null }) {
  const { addKid, updateKid } = useKids()
  const { family } = useFamily()
  const [name, setName] = useState(kid?.name ?? '')
  const [avatar, setAvatar] = useState(kid?.avatar ?? '🐱')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [cropSrc, setCropSrc] = useState(null) // raw image URL for cropper
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(kid?.name ?? '')
      setAvatar(kid?.avatar ?? '🐱')
      setImageFile(null)
      setImagePreview(null)
      setCropSrc(null)
      setError('')
    }
  }, [isOpen, kid])

  function handleImageSelect(file) {
    if (file) {
      // Open cropper with the raw image
      setCropSrc(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setImagePreview(null)
      setCropSrc(null)
    }
  }

  function handleCropDone(blob) {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setImageFile(file)
    setImagePreview(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  function handleCropCancel() {
    setCropSrc(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')

    try {
      let finalAvatar = avatar
      if (imageFile) {
        finalAvatar = await uploadAvatar(family.id, kid?.id || 'new', imageFile)
      }

      const { error: err } = kid
        ? await updateKid(kid.id, { name: name.trim(), avatar: finalAvatar })
        : await addKid(name.trim(), finalAvatar)

      if (err) { setError(err.message); setSaving(false); return }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cropSrc ? 'Crop Photo' : kid ? 'Edit Kid' : 'Add Kid'}>
      {cropSrc ? (
        <ImageCropper imageSrc={cropSrc} onCropDone={handleCropDone} onCancel={handleCropCancel} />
      ) : (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Kid's name"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>
        <AvatarPicker
          value={avatar}
          onChange={setAvatar}
          onImageSelect={handleImageSelect}
          imagePreview={imagePreview}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving…' : kid ? 'Save Changes' : 'Add Kid'}
          </Button>
        </div>
      </form>
      )}
    </Modal>
  )
}
