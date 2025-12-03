"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Info, Trash2, RefreshCw } from "lucide-react"

export type ConfirmationType = "danger" | "warning" | "info"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  type?: ConfirmationType
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2 className="h-6 w-6 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case "info":
        return <Info className="h-6 w-6 text-blue-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
    }
  }

  const getButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white"
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white"
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white"
      default:
        return "bg-yellow-600 hover:bg-yellow-700 text-white"
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            onClick={() => {
              onCancel?.()
              onOpenChange(false)
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={getButtonClass()}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for easier usage with async confirmation
interface UseConfirmationOptions {
  title: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  type?: ConfirmationType
}

interface ConfirmationState extends UseConfirmationOptions {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

export function useConfirmation() {
  const [state, setState] = React.useState<ConfirmationState>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "warning",
    resolve: null,
  })

  const confirm = React.useCallback((options: UseConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        ...options,
        resolve,
      })
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true)
    setState((prev) => ({ ...prev, open: false, resolve: null }))
  }, [state.resolve])

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false)
    setState((prev) => ({ ...prev, open: false, resolve: null }))
  }, [state.resolve])

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      state.resolve?.(false)
      setState((prev) => ({ ...prev, open: false, resolve: null }))
    }
  }, [state.resolve])

  const ConfirmDialog = React.useMemo(() => (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      type={state.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ), [state.open, state.title, state.description, state.confirmText, state.cancelText, state.type, handleConfirm, handleCancel, handleOpenChange])

  return { confirm, ConfirmDialog }
}
