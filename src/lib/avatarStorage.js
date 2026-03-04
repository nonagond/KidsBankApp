import { supabase } from './supabase'

const BUCKET = 'avatars'
const MAX_DIMENSION = 512
const JPEG_QUALITY = 0.8

export function isImageUrl(avatar) {
  return avatar && (avatar.startsWith('http') || avatar.startsWith('/'))
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Failed to resize image')),
        'image/jpeg',
        JPEG_QUALITY
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadAvatar(familyId, kidId, file) {
  const resized = await resizeImage(file)
  const path = `${familyId}/${kidId || 'new'}/${Date.now()}.jpg`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, resized, { upsert: true, contentType: 'image/jpeg' })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function deleteAvatar(url) {
  const match = url.match(/\/avatars\/(.+)$/)
  if (!match) return
  await supabase.storage.from(BUCKET).remove([match[1]])
}
