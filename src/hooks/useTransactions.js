import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useFamily } from '../context/FamilyContext'

export function useTransactions(kidId, accountId = null) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { refreshKids } = useFamily()

  const fetchTransactions = useCallback(async () => {
    if (!kidId) return
    setLoading(true)

    // Try with account join first; fall back to plain query if accounts table doesn't exist yet
    let query = supabase
      .from('transactions')
      .select('*, account:accounts(name)')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    let { data, error } = await query

    if (error) {
      // Fallback: fetch without the accounts join
      let fallback = supabase
        .from('transactions')
        .select('*')
        .eq('kid_id', kidId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (accountId) {
        fallback = fallback.eq('account_id', accountId)
      }

      const result = await fallback
      data = result.data
    }

    setTransactions(data ?? [])
    setLoading(false)
  }, [kidId, accountId])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function applyTransaction(amount, type, description, targetAccountId = null) {
    const params = {
      p_kid_id: kidId,
      p_amount: amount,
      p_type: type,
      p_description: description || null,
    }
    if (targetAccountId) params.p_account_id = targetAccountId

    const { error } = await supabase.rpc('apply_transaction', params)
    if (!error) {
      await fetchTransactions()
      await refreshKids()
    }
    return { error }
  }

  async function deleteTransaction(txnId) {
    const { error } = await supabase.rpc('reverse_transaction', { p_txn_id: txnId })
    if (!error) {
      await fetchTransactions()
      await refreshKids()
    }
    return { error }
  }

  async function editTransaction(txnId, amount, type, description) {
    const { error } = await supabase.rpc('edit_transaction', {
      p_txn_id: txnId,
      p_amount: amount,
      p_type: type,
      p_description: description || null,
    })
    if (!error) {
      await fetchTransactions()
      await refreshKids()
    }
    return { error }
  }

  return { transactions, loading, applyTransaction, deleteTransaction, editTransaction, refetch: fetchTransactions }
}
