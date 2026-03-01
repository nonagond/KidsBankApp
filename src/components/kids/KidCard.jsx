import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import AvatarDisplay from './AvatarDisplay'
import { formatCurrency } from '../../lib/formatCurrency'

export default function KidCard({ kid }) {
  const navigate = useNavigate()
  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      onClick={() => navigate(`/kids/${kid.id}`)}
    >
      <div className="flex items-center gap-4">
        <AvatarDisplay avatar={kid.avatar} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-lg truncate">{kid.name}</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(kid.balance)}</p>
        </div>
        <div className="text-gray-300 text-2xl">›</div>
      </div>
    </Card>
  )
}
