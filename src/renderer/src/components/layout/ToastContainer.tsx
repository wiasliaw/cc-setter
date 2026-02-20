import { useToastStore } from '@/stores/toast-store'
import { cn } from '@/lib/utils'

const typeStyles = {
  success: 'border-zinc-700 bg-zinc-900 text-zinc-200',
  error: 'border-zinc-700 bg-zinc-900 text-zinc-200',
  info: 'border-zinc-700 bg-zinc-900 text-zinc-200'
}

const typePrefixes = {
  success: '✓ ',
  error: '✗ ',
  info: ''
}

export function ToastContainer(): React.JSX.Element {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return <></>

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          className={cn(
            'rounded border px-4 py-2 text-xs shadow-lg transition-opacity',
            typeStyles[toast.type]
          )}
        >
          {typePrefixes[toast.type]}{toast.message}
        </button>
      ))}
    </div>
  )
}
