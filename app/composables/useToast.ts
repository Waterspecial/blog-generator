type ToastKind = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
  link?: { to: string, label: string }
}

interface ToastOptions {
  link?: Toast['link']
  duration?: number
}

let nextId = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function remove(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function show(kind: ToastKind, message: string, options: ToastOptions = {}) {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, kind, message, link: options.link }]
    const duration = options.duration ?? (kind === 'error' ? 8000 : 5000)
    if (duration) setTimeout(() => remove(id), duration)
  }

  return {
    toasts,
    remove,
    success: (message: string, options?: ToastOptions) => show('success', message, options),
    error: (message: string, options?: ToastOptions) => show('error', message, options),
    warning: (message: string, options?: ToastOptions) => show('warning', message, options),
    info: (message: string, options?: ToastOptions) => show('info', message, options),
  }
}
