import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { runDueAllowances } from '../lib/allowanceRunner'

const FamilyContext = createContext(null)

export function FamilyProvider({ children }) {
  const { user } = useAuth()
  const [family, setFamily] = useState(null)
  const [kids, setKids] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFamily = useCallback(async () => {
    if (!user) {
      setFamily(null)
      setKids([])
      setLoading(false)
      return null
    }
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setFamily(data ?? null)
    return data ?? null
  }, [user])

  const fetchKids = useCallback(async (familyId) => {
    if (!familyId) { setKids([]); return [] }
    const { data } = await supabase
      .from('kids')
      .select('*')
      .eq('family_id', familyId)
      .order('sort_order', { ascending: true })
    setKids(data ?? [])
    return data ?? []
  }, [])

  const refreshKids = useCallback(async () => {
    if (family) await fetchKids(family.id)
  }, [family, fetchKids])

  const refreshFamily = useCallback(async () => {
    await fetchFamily()
  }, [fetchFamily])

  useEffect(() => {
    if (!user) {
      setFamily(null)
      setKids([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchFamily().then(async (f) => {
      if (!f) { setLoading(false); return }

      const loadedKids = await fetchKids(f.id)

      // Auto-apply any due allowances
      const kidIds = loadedKids.map(k => k.id)
      const count = await runDueAllowances(kidIds)
      if (count > 0) {
        toast.success(`💰 ${count} allowance${count > 1 ? 's' : ''} paid!`)
        await fetchKids(f.id) // refresh balances after allowances
      }

      setLoading(false)
    })
  }, [user, fetchFamily, fetchKids])

  return (
    <FamilyContext.Provider value={{ family, kids, loading, refreshKids, refreshFamily, setFamily }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  return useContext(FamilyContext)
}
