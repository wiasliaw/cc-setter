import { useToastStore } from '@/stores/toast-store'
import { cn } from '@/lib/utils'

const typeStyles = {
  success: 'border-emerald-800 bg-emerald-950 text-emerald-300',
  error: 'border-red-800 bg-red-950 text-red-300',
  info: 'border-zinc-700 bg-zinc-900 text-zinc-300'
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
          {toast.message}
        </button>
      ))}
    </div>
  )
}
