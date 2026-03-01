import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useFamily } from '../context/FamilyContext'

export function useGoals(kidId) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const { refreshKids } = useFamily()

  const fetchGoals = useCallback(async () => {
    if (!kidId) return
    setLoading(true)
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: true })
    setGoals(data ?? [])
    setLoading(false)
  }, [kidId])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function addGoal(name, targetAmount) {
    const { error } = await supabase
      .from('savings_goals')
      .insert({ kid_id: kidId, name, target_amount: targetAmount })
    if (!error) await fetchGoals()
    return { error }
  }

  async function transferToGoal(goalId, amount) {
    const { error } = await supabase.rpc('transfer_to_goal', {
      p_kid_id: kidId,
      p_goal_id: goalId,
      p_amount: amount,
    })
    if (!error) {
      await fetchGoals()
      await refreshKids()
    }
    return { error }
  }

  async function deleteGoal(goalId) {
    const { error } = await supabase.from('savings_goals').delete().eq('id', goalId)
    if (!error) await fetchGoals()
    return { error }
  }

  return { goals, loading, addGoal, transferToGoal, deleteGoal, refetch: fetchGoals }
}
