import { supabase } from '../lib/supabase'
import { useFamily } from '../context/FamilyContext'

export function useKids() {
  const { family, refreshKids } = useFamily()

  async function addKid(name, avatar) {
    const { error } = await supabase
      .from('kids')
      .insert({ family_id: family.id, name, avatar })
    if (!error) await refreshKids()
    return { error }
  }

  async function updateKid(id, updates) {
    const { error } = await supabase
      .from('kids')
      .update(updates)
      .eq('id', id)
    if (!error) await refreshKids()
    return { error }
  }

  async function deleteKid(id) {
    const { error } = await supabase.from('kids').delete().eq('id', id)
    if (!error) await refreshKids()
    return { error }
  }

  return { addKid, updateKid, deleteKid }
}
