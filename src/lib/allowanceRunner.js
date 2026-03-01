import { isBefore, isToday, addDays, addWeeks, addMonths, parseISO, format } from 'date-fns'
import { supabase } from './supabase'

function advanceDate(date, frequency) {
  if (frequency === 'daily') return addDays(date, 1)
  if (frequency === 'weekly') return addWeeks(date, 1)
  if (frequency === 'monthly') return addMonths(date, 1)
  return date
}

export async function runDueAllowances(kidIds) {
  if (!kidIds || kidIds.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: schedules, error } = await supabase
    .from('allowance_schedules')
    .select('*')
    .in('kid_id', kidIds)
    .eq('active', true)

  if (error || !schedules) return 0

  let appliedCount = 0

  for (const schedule of schedules) {
    let nextDate = parseISO(schedule.next_payment_date)

    // Catch up all missed payments (loop until next date is in the future)
    while (isBefore(nextDate, today) || isToday(nextDate)) {
      const { error: txError } = await supabase.rpc('apply_transaction', {
        p_kid_id: schedule.kid_id,
        p_amount: schedule.amount,
        p_type: 'allowance',
        p_description: 'Allowance',
      })

      if (txError) break

      appliedCount++
      nextDate = advanceDate(nextDate, schedule.frequency)

      await supabase
        .from('allowance_schedules')
        .update({ next_payment_date: format(nextDate, 'yyyy-MM-dd') })
        .eq('id', schedule.id)

      // Stop once the next date is in the future
      if (!isBefore(nextDate, today) && !isToday(nextDate)) break
    }
  }

  return appliedCount
}
