import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function SettingsPage() {
  const { signOut } = useAuth()
  const { family, refreshFamily } = useFamily()
  const navigate = useNavigate()

  const [familyName, setFamilyName] = useState(family?.family_name ?? '')
  const [savingName, setSavingName] = useState(false)

  async function handleSaveName(e) {
    e.preventDefault()
    if (!familyName.trim()) return
    setSavingName(true)
    const { error } = await supabase
      .from('families')
      .update({ family_name: familyName.trim() })
      .eq('id', family.id)
    setSavingName(false)
    if (error) { toast.error(error.message) }
    else { await refreshFamily(); toast.success('Family name updated!') }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="p-4 pt-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Family Name</h2>
          <form onSubmit={handleSaveName} className="flex gap-2">
            <input
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="submit" size="sm" disabled={savingName}>
              {savingName ? '…' : 'Save'}
            </Button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Account</h2>
          <Button variant="danger" className="w-full" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  )
}
