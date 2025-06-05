"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { FileUp, X, FileCheck, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type DocumentType =
  | "grades"
  | "itr"
  | "nbi"
  | "goodMoral"
  | "physicalCheckup"
  | "homeLocationSketch"

const backendFieldMap: Record<DocumentType, string> = {
  grades: "gradeReport",
  itr: "incomeTaxReturn",
  nbi: "nbiClearance",
  goodMoral: "goodMoralCertificate",
  physicalCheckup: "physicalCheckup",
  homeLocationSketch: "homeLocationSketch",
}

interface Document {
  id: string
  type: DocumentType
  name: string
  size: number
  progress: number
  status: "uploading" | "complete" | "error"
  file: File
}

const documentTypeInfo = {
  grades: {
    title: "Grade Report",
    description: "Upload your latest grade report or transcript",
    acceptedFormats: ".pdf, .jpg, .png",
  },
  itr: {
    title: "Income Tax Return",
    description: "Upload your parents' or guardian's latest ITR",
    acceptedFormats: ".pdf, .jpg, .png",
  },
  nbi: {
    title: "NBI Clearance",
    description: "Upload your valid NBI Clearance",
    acceptedFormats: ".pdf, .jpg, .png",
  },
  goodMoral: {
    title: "Good Moral Certificate",
    description: "Upload your Good Moral Certificate",
    acceptedFormats: ".pdf, .jpg, .png",
  },
  physicalCheckup: {
    title: "Physical Checkup",
    description: "Upload your Physical Checkup results",
    acceptedFormats: ".pdf, .jpg, .png",
  },
  homeLocationSketch: {
    title: "Home Location Sketch",
    description: "Upload a sketch or map of your home location",
    acceptedFormats: ".pdf, .jpg, .png",
  },
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const { toast } = useToast()

  const handleFileUpload = (type: DocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const newDocument: Document = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading",
      file,
    }

    setDocuments((prev) => [...prev, newDocument])

    // Simulate upload progress
    const interval = setInterval(() => {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === newDocument.id) {
            const newProgress = doc.progress + 10

            if (newProgress >= 100) {
              clearInterval(interval)
              return { ...doc, progress: 100, status: "complete" }
            }

            return { ...doc, progress: newProgress }
          }
          return doc
        }),
      )
    }, 300)
  }

  const removeDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
    toast({
      title: "Document removed",
      description: "The document has been removed successfully.",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const getDocumentsByType = (type: DocumentType) => {
    return documents.filter((doc) => doc.type === type)
  }

  const renderDocumentSection = (type: DocumentType) => {
    const { title, description, acceptedFormats } = documentTypeInfo[type]
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
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Accepted formats: {acceptedFormats}</p>
              </div>
            )}
          </div>
        </CardContent>
        {typeDocuments.length > 0 && (
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
              />
            </label>
          </CardFooter>
        )}
      </Card>
    )
  }

  const handleSubmitAllDocuments = async () => {
    const formData = new FormData()

    // Group documents by type and append to FormData with correct backend field names
    documents.forEach((doc) => {
      const backendField = backendFieldMap[doc.type]
      formData.append(backendField, doc.file)
    })

    try {
      const res = await fetch("/api/documents", {
        method: "PUT",
        body: formData,
        credentials: "include",
      })

      if (!res.ok) throw new Error("Upload failed")

      toast({
        title: "Documents submitted",
        description: "Your documents have been submitted successfully.",
      })

      // Optionally, clear the documents state or refresh the list
      setDocuments([])
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your documents.",
        variant: "destructive",
      })
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
              Please upload all required documents to complete your application. All documents must be clear and
              legible.
            </p>
          </div>
        </div>
      </div>

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
        >
          Submit All Documents
        </Button>
      </div>
    </div>
  )
}
