"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { FileUp, X, FileCheck, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { documentService, backendFieldMap, Document } from "../services/documentService"

export type DocumentType =
  | "studentPicture"
  | "grades"
  | "itr"
  | "nbi"
  | "goodMoral"
  | "physicalCheckup"
  | "homeLocationSketch"

const documentTypeInfo: Record<DocumentType, { title: string; description: string; acceptedFormats: string; maxCount: number }> = {
  studentPicture: {
    title: "Student Picture",
    description: "Upload a recent passport-sized photo",
    acceptedFormats: ".jpg, .png",
    maxCount: 1,
  },
  grades: {
    title: "Grade Report",
    description: "Upload your latest grade report or transcript",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
  itr: {
    title: "Income Tax Return",
    description: "Upload your parents' or guardian's latest ITR",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
  nbi: {
    title: "NBI Clearance",
    description: "Upload your valid NBI Clearance",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
  goodMoral: {
    title: "Good Moral Certificate",
    description: "Upload your Good Moral Certificate",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
  physicalCheckup: {
    title: "Physical Checkup",
    description: "Upload your Physical Checkup results",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
  homeLocationSketch: {
    title: "Home Location Sketch",
    description: "Upload a sketch or map of your home location",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const fetchedDocuments = await documentService.getDocuments()
        setDocuments(fetchedDocuments)
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch existing documents.",
          variant: "destructive",
        })
      }
    }
    fetchDocuments()
  }, [toast])

  const handleFileUpload = (type: DocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    const maxCount = documentTypeInfo[type].maxCount
    const currentCount = documents.filter((doc) => doc.type === type).length
    const filesToAdd = Array.from(files).slice(0, maxCount - currentCount)

    if (filesToAdd.length === 0) {
      toast({
        title: "Limit Reached",
        description: `You can only upload up to ${maxCount} ${documentTypeInfo[type].title} files.`,
        variant: "destructive",
      })
      return
    }

    const newDocuments: Document[] = filesToAdd
      .map((file): Document | null => {
        if (file.size > maxSize) {
          toast({
            title: "File Too Large",
            description: `${file.name} exceeds the 5MB limit.`,
            variant: "destructive",
          })
          return null
        }
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not a PDF, JPEG, or PNG.`,
            variant: "destructive",
          })
          return null
        }
        return {
          id: Math.random().toString(36).substring(2, 9),
          type,
          name: file.name,
          size: file.size,
          progress: 0,
          status: "uploading",
          file,
        }
      })
      .filter((doc): doc is Document => doc !== null)

    setDocuments((prev) => [...prev, ...newDocuments])
  }

  const removeDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
    toast({
      title: "Document removed",
      description: "The document has been removed successfully.",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "Unknown size"
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const getDocumentsByType = (type: DocumentType) => {
    return documents.filter((doc) => doc.type === type)
  }

  const renderDocumentSection = (type: DocumentType) => {
    const { title, description, acceptedFormats, maxCount } = documentTypeInfo[type]
    const typeDocuments = getDocumentsByType(type)

    return (
      <Card className="mb-6">
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {typeDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileCheck
                    className={`h-5 w-5 ${doc.status === "complete" ? "text-green-500" : doc.status === "error" ? "text-red-500" : "text-gray-400"}`}
                  />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.status === "uploading" && (
                    <div className="w-24">
                      <Progress value={doc.progress} className="h-2" />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocument(doc.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {typeDocuments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-4">No documents uploaded yet</p>
                <label htmlFor={`file-upload-${type}`}>
                  <div className="bg-[#800000] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#600000] transition-colors">
                    Upload {title}
                  </div>
                  <input
                    id={`file-upload-${type}`}
                    type="file"
                    className="hidden"
                    accept={acceptedFormats}
                    onChange={handleFileUpload(type)}
                    multiple={maxCount > 1}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Accepted formats: {acceptedFormats}</p>
              </div>
            )}
          </div>
        </CardContent>
        {typeDocuments.length < maxCount && (
          <CardFooter className="border-t pt-4 flex justify-end">
            <label htmlFor={`file-upload-${type}`}>
              <div className="bg-[#800000] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#600000] transition-colors">
                Upload Another
              </div>
              <input
                id={`file-upload-${type}`}
                type="file"
                className="hidden"
                accept={acceptedFormats}
                onChange={handleFileUpload(type)}
                multiple={maxCount > 1}
              />
            </label>
          </CardFooter>
        )}
      </Card>
    )
  }

  const handleSubmitAllDocuments = async () => {
    if (documents.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload at least one document before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    let interval: NodeJS.Timeout | null = null
    try {
      setDocuments((prev) =>
        prev.map((doc) => ({ ...doc, progress: 0, status: "uploading" }))
      )
      interval = setInterval(() => {
        setDocuments((prev) =>
          prev.map((doc) => {
            const newProgress = Math.min(doc.progress + 10, 100)
            return {
              ...doc,
              progress: newProgress,
              status: newProgress === 100 ? "complete" : "uploading",
            }
          })
        )
      }, 300)

      await documentService.uploadDocuments(documents)

      if (interval) clearInterval(interval)
      setDocuments((prev) =>
        prev.map((doc) => ({ ...doc, progress: 100, status: "complete" }))
      )

      const fetchedDocuments = await documentService.getDocuments()
      setDocuments(fetchedDocuments)

      toast({
        title: "Documents submitted",
        description: "Your documents have been submitted successfully.",
      })
    } catch (err) {
      if (interval) clearInterval(interval)
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.status === "uploading" ? { ...doc, status: "error" } : doc
        )
      )
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "There was a problem uploading your documents.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Please upload all required documents to complete your application. All documents must be clear and legible.
            </p>
          </div>
        </div>
      </div>

      {renderDocumentSection("studentPicture")}
      {renderDocumentSection("grades")}
      {renderDocumentSection("itr")}
      {renderDocumentSection("nbi")}
      {renderDocumentSection("goodMoral")}
      {renderDocumentSection("physicalCheckup")}
      {renderDocumentSection("homeLocationSketch")}

      <div className="flex justify-end">
        <Button
          className="bg-[#800000] hover:bg-[#600000]"
          onClick={handleSubmitAllDocuments}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit All Documents"}
        </Button>
      </div>
    </div>
  )
}