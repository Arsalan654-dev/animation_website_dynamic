import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} isLoading={isLoading} type="button">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9b3434]/10 text-[#8c2d2d]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-relaxed text-ink/65">{description}</p>
      </div>
    </Modal>
  )
}
