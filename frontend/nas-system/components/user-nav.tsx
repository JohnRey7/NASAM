"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export function UserNav() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, status, logout } = useAuth()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  
  console.log('👤 UserNav - User data:', user)
  console.log('👤 UserNav - Auth status:', status)

  // Fetch student picture
  useEffect(() => {
    console.log('👤 UserNav useEffect triggered, user:', user)
    if (user?.id) {
      console.log('👤 Fetching student picture for user ID:', user.id)
      fetchStudentPicture()
    } else {
      console.log('👤 No user ID available yet')
    }
  }, [user?.id])
  
  // Force re-render when user changes
  useEffect(() => {
    console.log('👤 User object changed:', user)
  }, [user])

  const fetchStudentPicture = async () => {
    try {
      // Use /document-uploads to get current user's documents (no permission needed beyond auth)
      console.log('📸 Fetching student picture from:', `${API_URL}/document-uploads`)
      const response = await fetch(`${API_URL}/document-uploads`, {
        credentials: 'include'
      })
      
      console.log('📸 Document response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📸 Document data received:', data)
        console.log('📸 Student picture data:', data.data?.studentPicture)
        
        if (data.data?.studentPicture?.filePath) {
          // Remove "files/" prefix if present
          const cleanFilePath = data.data.studentPicture.filePath.replace(/^files\//, '')
          const imageUrl = `${API_URL}/files/${cleanFilePath}`
          console.log('📸 Loading image from:', imageUrl)
          
          // Fetch the image as blob to avoid CORS issues
          const imageResponse = await fetch(imageUrl, {
            credentials: 'include'
          })
          
          console.log('📸 Image response status:', imageResponse.status)
          
          if (imageResponse.ok) {
            const blob = await imageResponse.blob()
            const objectUrl = URL.createObjectURL(blob)
            console.log('✅ Profile image loaded successfully:', objectUrl)
            setProfileImage(objectUrl)
          } else {
            console.error('❌ Failed to load image, status:', imageResponse.status)
          }
        } else {
          console.log('📸 No student picture found in data')
        }
      } else {
        console.error('❌ Failed to fetch documents, status:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching student picture:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while auth is loading
  if (status === 'loading') {
    return (
      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-white/20 text-white">...</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  // Get user display name
  const displayName = user?.name || 'User'
  const displayEmail = user?.email || ''
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full cursor-pointer hover:ring-2 hover:ring-white/50 focus:ring-2 focus:ring-white/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profileImage || "/placeholder.svg"} alt={displayName} />
            <AvatarFallback className="bg-white/20 text-white">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings-page")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
