import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  pushToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function iconFor(type: ToastType) {
  if (type === 'success') return CheckCircle2
  if (type === 'error') return CircleAlert
  return Info
}

function classesFor(type: ToastType) {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  }
  if (type === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-900'
  }
  return 'border-blue-200 bg-blue-50 text-blue-900'
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const pushToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${crypto.randomUUID()}`
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => {
      removeToast(id)
    }, 3000)
  }, [removeToast])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = iconFor(toast.type)
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 30, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.98 }}
                className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${classesFor(
                  toast.type,
                )}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="flex-1 text-sm font-medium">{toast.message}</p>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="rounded-md p-1 opacity-60 transition hover:opacity-100"
                    aria-label="Close notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}
