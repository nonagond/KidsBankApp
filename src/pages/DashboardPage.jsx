import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { supabase } from '../lib/supabase'
import KidCard from '../components/kids/KidCard'
import KidForm from '../components/kids/KidForm'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'

export default function DashboardPage() {
  const { user } = useAuth()
  const { family, kids, loading, setFamily, refreshKids } = useFamily()
  const [showAddKid, setShowAddKid] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  // Onboarding form state
  const [familyName, setFamilyName] = useState('')
  const [onboardSaving, setOnboardSaving] = useState(false)
  const [onboardError, setOnboardError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = kids.findIndex(k => k.id === active.id)
    const newIndex = kids.findIndex(k => k.id === over.id)
    const reordered = arrayMove(kids, oldIndex, newIndex)

    // Persist new sort_order for each kid
    const updates = reordered.map((kid, i) => (
      supabase.from('kids').update({ sort_order: i }).eq('id', kid.id)
    ))
    await Promise.all(updates)
    await refreshKids()
  }

  useEffect(() => {
    if (!loading && !family) setShowOnboarding(true)
    else setShowOnboarding(false)
  }, [loading, family])

  async function handleOnboard(e) {
    e.preventDefault()
    if (!familyName.trim()) { setOnboardError('Family name required'); return }
    setOnboardSaving(true)
    setOnboardError('')
    const { data, error } = await supabase
      .from('families')
      .insert({ user_id: user.id, family_name: familyName.trim(), pin_hash: 'not_used' })
      .select()
      .single()
    setOnboardSaving(false)
    if (error) { setOnboardError(error.message); return }
    setFamily(data)
    setShowOnboarding(false)
    toast.success('Family created! Now add your first kid.')
    setShowAddKid(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 pt-6 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {family?.family_name ?? 'KidsBank'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {kids.length} kid{kids.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddKid(true)} size="sm">+ Add Kid</Button>
      </div>

      {/* Kid cards */}
      {kids.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👶</div>
          <p className="text-gray-600 font-semibold text-lg">No kids yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first kid to get started</p>
          <Button onClick={() => setShowAddKid(true)} className="mt-5">
            Add Your First Kid
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={kids.map(k => k.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {kids.map(kid => <KidCard key={kid.id} kid={kid} />)}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <KidForm isOpen={showAddKid} onClose={() => setShowAddKid(false)} />

      {/* Onboarding modal — no onClose so they can't dismiss it */}
      <Modal isOpen={showOnboarding} onClose={null} title="Welcome to KidsBank">
        <form onSubmit={handleOnboard} className="space-y-4">
          <p className="text-sm text-gray-500">
            Set up your family to get started.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family name</label>
            <input
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              placeholder="The Smiths, Our Family…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          {onboardError && <p className="text-red-500 text-sm">{onboardError}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={onboardSaving}>
            {onboardSaving ? 'Setting up…' : 'Create Family'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
