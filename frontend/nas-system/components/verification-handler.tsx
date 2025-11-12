"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function VerificationHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const verified = searchParams.get('verified')
    const message = searchParams.get('message')

    if (verified === 'success') {
      toast({
        title: "Email Verified Successfully! ✅",
        description: "Your email has been verified. You can now login to your account.",
        duration: 5000,
      })
      
      // Remove query params from URL
      router.replace('/')
    } else if (verified === 'error') {
      toast({
        title: "Verification Failed",
        description: message || "There was an error verifying your email. Please try again.",
        variant: "destructive",
        duration: 7000,
      })
      
      // Remove query params from URL
      router.replace('/')
    }
  }, [searchParams, router, toast])

  return null
}
