import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  changeText: string
  changePositive: boolean
  icon: LucideIcon
  iconBgClass: string
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(() => Math.round(motionValue.get()))

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [motionValue, value])

  return <motion.span>{rounded}</motion.span>
}

export function MetricCard({
  title,
  value,
  changeText,
  changePositive,
  icon: Icon,
  iconBgClass,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`rounded-lg p-2 ${iconBgClass}`}>
          <Icon className="h-4 w-4 text-slate-700" />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-slate-900">
        <AnimatedNumber value={value} />
      </p>
      <p
        className={`mt-2 text-xs font-medium ${
          changePositive ? 'text-emerald-600' : 'text-rose-600'
        }`}
      >
        {changePositive ? '↑' : '↓'} {changeText}
      </p>
    </motion.div>
  )
}
