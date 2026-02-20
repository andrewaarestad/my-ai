'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { ToastContainer } from './ToastContainer'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  /** Duration in ms before auto-dismiss. Set to `Infinity` to keep indefinitely. Default: 10000 */
  duration?: number
  type?: ToastType
}

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, options?: ToastOptions) => {
    const id = String(++nextId)
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type: options?.type ?? 'info',
        duration: options?.duration ?? 10_000,
      },
    ])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext value={{ toast: addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}
