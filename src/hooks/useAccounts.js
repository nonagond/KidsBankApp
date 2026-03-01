import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAccounts(kidId) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    if (!kidId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('kid_id', kidId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    // If accounts table doesn't exist yet (migration not run), gracefully return empty
    setAccounts(error ? [] : (data ?? []))
    setLoading(false)
  }, [kidId])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  async function addAccount(name) {
    const { error } = await supabase
      .from('accounts')
      .insert({ kid_id: kidId, name, is_default: false })
    if (!error) await fetchAccounts()
    return { error }
  }

  async function renameAccount(accountId, name) {
    const { error } = await supabase
      .from('accounts')
      .update({ name })
      .eq('id', accountId)
    if (!error) await fetchAccounts()
    return { error }
  }

  async function deleteAccount(accountId) {
    const acct = accounts.find(a => a.id === accountId)
    if (acct?.is_default) return { error: { message: 'Cannot delete default account' } }
    if (Number(acct?.balance) > 0) return { error: { message: 'Account must have zero balance to delete' } }
    const { error } = await supabase.from('accounts').delete().eq('id', accountId)
    if (!error) await fetchAccounts()
    return { error }
  }

  return { accounts, loading, addAccount, renameAccount, deleteAccount, refetch: fetchAccounts }
}
