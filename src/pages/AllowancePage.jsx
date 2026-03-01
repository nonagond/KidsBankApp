import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useFamily } from '../context/FamilyContext'
import AvatarDisplay from '../components/kids/AvatarDisplay'
import { useAllowance } from '../hooks/useAllowance'
import { usePin } from '../hooks/usePin'
import AllowanceForm from '../components/allowance/AllowanceForm'
import PinPad from '../components/ui/PinPad'
import Spinner from '../components/ui/Spinner'
import Card from '../components/ui/Card'

export default function AllowancePage() {
  const { kidId } = useParams()
  const navigate = useNavigate()
  const { kids } = useFamily()
  const kid = kids.find(k => k.id === kidId)
  const { schedule, loading, saveSchedule } = useAllowance(kidId)
  const { pinModalOpen, pinError, requirePin, submitPin, cancelPin } = usePin()

  async function handleSave(amount, frequency, active) {
    return new Promise((resolve) => {
      requirePin(async () => {
        const result = await saveSchedule(amount, frequency, active)
        if (!result.error) toast.success('Allowance saved! 🪙')
        resolve(result)
      })
    })
  }

  if (loading || !kid) {
    return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-4 pt-10">
      <button
        onClick={() => navigate(`/kids/${kidId}`)}
        className="text-indigo-600 text-sm font-medium mb-6 flex items-center gap-1"
      >
        ‹ Back to {kid.name}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <AvatarDisplay avatar={kid.avatar} size="md" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Allowance</h1>
          <p className="text-gray-400 text-sm">{kid.name}</p>
        </div>
      </div>

      <Card className="p-5">
        {!schedule && (
          <p className="text-sm text-gray-400 mb-4">
            No allowance set yet. Configure a recurring payment below.
          </p>
        )}
        <AllowanceForm schedule={schedule} onSave={handleSave} />
      </Card>

      <PinPad isOpen={pinModalOpen} onSubmit={submitPin} onCancel={cancelPin} hasError={pinError} />
    </div>
  )
}
