import { supabase } from './supabase'

const BUCKET = 'avatars'
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export function isImageUrl(avatar) {
  return avatar && (avatar.startsWith('http') || avatar.startsWith('/'))
}

export async function uploadAvatar(familyId, kidId, file) {
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 2MB')
  }
  const ext = file.name.split('.').pop()
  const path = `${familyId}/${kidId || 'new'}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

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
