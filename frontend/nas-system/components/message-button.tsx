"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { MessageDialog } from "./message-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MessageButtonProps {
  receiverId: string
  receiverName: string
  applicationId?: string
  conversationType?: 'admin-applicant' | 'admin-department-head' | 'general'
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function MessageButton({
  receiverId,
  receiverName,
  applicationId,
  conversationType = 'general',
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  className = ''
}: MessageButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setOpen(true)}
              className={className}
            >
              <MessageSquare className="h-4 w-4" />
              {showLabel && <span className="ml-2">Message</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send message to {receiverName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <MessageDialog
        open={open}
        onOpenChange={setOpen}
        receiverId={receiverId}
        receiverName={receiverName}
        applicationId={applicationId}
        conversationType={conversationType}
      />
    </>
  )
}
