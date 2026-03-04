import { isImageUrl } from '../../lib/avatarStorage'

const SIZES = {
  xs: { emoji: 'text-base', img: 'w-5 h-5' },
  sm: { emoji: 'text-3xl', img: 'w-10 h-10' },
  md: { emoji: 'text-5xl', img: 'w-16 h-16' },
  lg: { emoji: 'text-7xl', img: 'w-24 h-24' },
}

export default function AvatarDisplay({ avatar, size = 'md' }) {
  const s = SIZES[size] || SIZES.md

  if (isImageUrl(avatar)) {
    return (
      <img
        src={avatar}
        alt="Avatar"
        className={`${s.img} rounded-full object-cover select-none`}
      />
    )
  }
  return <div className={`${s.emoji} select-none`}>{avatar}</div>
}
