import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { PropsWithChildren } from 'react'

interface ModalProps extends PropsWithChildren {
  open: boolean
  title: string
  onClose: () => void
  maxWidthClass?: string
}

export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
}: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            className={`w-full rounded-2xl bg-white p-5 shadow-2xl ${maxWidthClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
