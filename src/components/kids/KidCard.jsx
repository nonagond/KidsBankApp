import { useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Card from '../ui/Card'
import AvatarDisplay from './AvatarDisplay'
import { formatCurrency } from '../../lib/formatCurrency'

export default function KidCard({ kid }) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: kid.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`p-5 cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-indigo-300' : ''}`}
        onClick={() => navigate(`/kids/${kid.id}`)}
      >
        <div className="flex items-center gap-4">
          <div
            className="touch-none text-gray-300 text-lg px-1 cursor-grab active:cursor-grabbing select-none"
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
          >
            ⠿
          </div>
          <AvatarDisplay avatar={kid.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{kid.name}</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(kid.balance)}</p>
          </div>
          <div className="text-gray-300 text-2xl">›</div>
        </div>
      </Card>
    </div>
  )
}
