export function formatRelativeTime(isoString: string) {
  const now = Date.now()
  const target = new Date(isoString).getTime()
  const diff = Math.max(0, now - target)

  const hourMs = 1000 * 60 * 60
  const dayMs = hourMs * 24

  if (diff < hourMs) {
    const mins = Math.max(1, Math.floor(diff / (1000 * 60)))
    return `${mins} min${mins > 1 ? 's' : ''} ago`
  }

  if (diff < dayMs) {
    const hours = Math.floor(diff / hourMs)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  if (diff < dayMs * 30) {
    const days = Math.floor(diff / dayMs)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const months = Math.floor(diff / (dayMs * 30))
  return `${months} month${months > 1 ? 's' : ''} ago`
}

export function formatFullDate(isoString: string) {
  return new Date(isoString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
