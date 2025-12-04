"use client"

import { useEffect } from "react"

export default function CreditsPage() {
  useEffect(() => {
    // Redirect to the still-alive-web page
    window.location.href = "/still-alive-web/index.html"
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-green-500 font-mono">
      <div className="text-center">
        <p>Loading Aperture Science Genetic Lifeform and Disk Operating System...</p>
      </div>
    </div>
  )
}
