import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'

export function useAllowance(kidId) {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSchedule = useCallback(async () => {
    if (!kidId) return
    setLoading(true)
    const { data } = await supabase
      .from('allowance_schedules')
      .select('*')
      .eq('kid_id', kidId)
      .maybeSingle()
    setSchedule(data ?? null)
    setLoading(false)
  }, [kidId])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  async function saveSchedule(amount, frequency, active) {
    let error
    if (schedule) {
      const res = await supabase
        .from('allowance_schedules')
        .update({ amount, frequency, active })
        .eq('id', schedule.id)
      error = res.error
    } else {
      const next_payment_date = format(new Date(), 'yyyy-MM-dd')
      const res = await supabase
        .from('allowance_schedules')
        .insert({ kid_id: kidId, amount, frequency, next_payment_date, active })
      error = res.error
    }
    if (!error) await fetchSchedule()
    return { error }
  }

  return { schedule, loading, saveSchedule, refetch: fetchSchedule }
}
