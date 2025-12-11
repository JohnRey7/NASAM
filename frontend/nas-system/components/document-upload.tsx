"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  | "personalityTestPaymentReceipt"

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
  personalityTestPaymentReceipt: {
    title: "16PF Test Payment Receipt",
    description: "Upload the official receipt for your 16PF Personality Test payment.",
    acceptedFormats: ".pdf, .jpg, .png",
    maxCount: 5,
  },
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentsVerified, setDocumentsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  
  // Grade averages state
  const [gradeAverages, setGradeAverages] = useState({
    elementary: '',
    juniorHighSchool: '',
    seniorHighSchool: '',
    college: ''
  })
  
  // Income tax info state
  const [incomeTaxInfo, setIncomeTaxInfo] = useState({
    annualIncome: '',
    taxableIncome: '',
    taxYear: '',
    employerName: '',
    tin: ''
  })

  useEffect(() => {
    const fetchDocumentsAndStatus = async () => {
      try {
        // Fetch documents
        const result = await documentService.getDocumentsWithMetadata()
        setDocuments(result.documents)
        
        // Load existing grade averages
        if (result.gradeAverages) {
          setGradeAverages({
            elementary: result.gradeAverages.elementary?.toString() || '',
            juniorHighSchool: result.gradeAverages.juniorHighSchool?.toString() || '',
            seniorHighSchool: result.gradeAverages.seniorHighSchool?.toString() || '',
            college: result.gradeAverages.college?.toString() || ''
          })
        }
        
        // Load existing income tax info
        if (result.incomeTaxInfo) {
          setIncomeTaxInfo({
            annualIncome: result.incomeTaxInfo.annualIncome?.toString() || '',
            taxableIncome: result.incomeTaxInfo.taxableIncome?.toString() || '',
            taxYear: result.incomeTaxInfo.taxYear || '',
            employerName: result.incomeTaxInfo.employerName || '',
            tin: result.incomeTaxInfo.tin || ''
          })
        }

        // Check if documents are already verified
        const appResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/application`, {
          credentials: 'include'
        });
        
        if (appResponse.ok) {
          const appData = await appResponse.json();
          if (appData.application) {
            // Documents are verified if status is 'document_verification' or beyond
            const status = appData.application.status;
            const isVerified = ['document_verification', 'interview_scheduled', 'approved', 'rejected'].includes(status);
            setDocumentsVerified(isVerified);
          }
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch existing documents.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocumentsAndStatus()
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

      // Include grade averages and income tax info with the upload
      const uploadData = {
        documents,
        gradeAverages: {
          elementary: gradeAverages.elementary ? parseFloat(gradeAverages.elementary) : undefined,
          juniorHighSchool: gradeAverages.juniorHighSchool ? parseFloat(gradeAverages.juniorHighSchool) : undefined,
          seniorHighSchool: gradeAverages.seniorHighSchool ? parseFloat(gradeAverages.seniorHighSchool) : undefined,
          college: gradeAverages.college ? parseFloat(gradeAverages.college) : undefined
        },
        incomeTaxInfo: {
          annualIncome: incomeTaxInfo.annualIncome ? parseFloat(incomeTaxInfo.annualIncome) : undefined,
          taxableIncome: incomeTaxInfo.taxableIncome ? parseFloat(incomeTaxInfo.taxableIncome) : undefined,
          taxYear: incomeTaxInfo.taxYear || undefined,
          employerName: incomeTaxInfo.employerName || undefined,
          tin: incomeTaxInfo.tin || undefined
        }
      }
      
      await documentService.uploadDocuments(documents, uploadData.gradeAverages, uploadData.incomeTaxInfo)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
        <span className="ml-3 text-gray-600">Loading documents...</span>
      </div>
    )
  }

  // If documents are verified, show read-only view
  if (documentsVerified) {
    return (
      <div className="space-y-6">
        {/* Verified Banner */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Documents Verified</h3>
              <p className="mt-1 text-sm text-green-700">
                Your documents have been verified by OAS staff. You can no longer modify or upload new documents.
              </p>
            </div>
          </div>
        </div>

        {/* Show verified documents in read-only mode */}
        {Object.keys(documentTypeInfo).map((type) => {
          const docType = type as DocumentType
          const { title, description } = documentTypeInfo[docType]
          const typeDocuments = documents.filter((doc) => doc.type === docType)
          
          return (
            <Card key={type} className="mb-6 opacity-90">
              <CardHeader className="bg-green-50 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-800">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {typeDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {typeDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        <FileCheck className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No documents uploaded for this category</p>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Show grade averages in read-only mode */}
        {(gradeAverages.elementary || gradeAverages.juniorHighSchool || gradeAverages.seniorHighSchool || gradeAverages.college) && (
          <Card className="mb-6">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="text-green-800">Grade Averages (Verified)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {gradeAverages.elementary && (
                  <div className="p-3 bg-gray-50 rounded">
                    <Label className="text-gray-600">Elementary Average</Label>
                    <p className="font-medium">{gradeAverages.elementary}%</p>
                  </div>
                )}
                {gradeAverages.juniorHighSchool && (
                  <div className="p-3 bg-gray-50 rounded">
                    <Label className="text-gray-600">Junior High School Average</Label>
                    <p className="font-medium">{gradeAverages.juniorHighSchool}%</p>
                  </div>
                )}
                {gradeAverages.seniorHighSchool && (
                  <div className="p-3 bg-gray-50 rounded">
                    <Label className="text-gray-600">Senior High School Average</Label>
                    <p className="font-medium">{gradeAverages.seniorHighSchool}%</p>
                  </div>
                )}
                {gradeAverages.college && (
                  <div className="p-3 bg-gray-50 rounded">
                    <Label className="text-gray-600">College Average</Label>
                    <p className="font-medium">{gradeAverages.college}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
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
      
      {/* Grade Report Section with Averages */}
      <Card className="mb-6">
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Grade Report</CardTitle>
          <CardDescription>Upload your latest grade report or transcript and provide your grade averages</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Grade Average Input Fields */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Grade Averages</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="elementary">Elementary Average (%)</Label>
                <Input
                  id="elementary"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 85"
                  value={gradeAverages.elementary}
                  onChange={(e) => setGradeAverages({...gradeAverages, elementary: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="juniorHS">Junior High School Average (%)</Label>
                <Input
                  id="juniorHS"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 87"
                  value={gradeAverages.juniorHighSchool}
                  onChange={(e) => setGradeAverages({...gradeAverages, juniorHighSchool: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="seniorHS">Senior High School Average (%)</Label>
                <Input
                  id="seniorHS"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 89"
                  value={gradeAverages.seniorHighSchool}
                  onChange={(e) => setGradeAverages({...gradeAverages, seniorHighSchool: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="college">College Average (%) - Optional</Label>
                <Input
                  id="college"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 90"
                  value={gradeAverages.college}
                  onChange={(e) => setGradeAverages({...gradeAverages, college: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          {/* Original grade document upload section */}
          <div className="space-y-4">
            {getDocumentsByType("grades").map((doc) => (
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

            {getDocumentsByType("grades").length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-4">No grade report uploaded yet</p>
                <label htmlFor="file-upload-grades">
                  <div className="bg-[#800000] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#600000] transition-colors">
                    Upload Grade Report
                  </div>
                  <input
                    id="file-upload-grades"
                    type="file"
                    className="hidden"
                    accept=".pdf, .jpg, .png"
                    onChange={handleFileUpload("grades")}
                    multiple
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Accepted formats: .pdf, .jpg, .png</p>
              </div>
            )}
          </div>
        </CardContent>
        {getDocumentsByType("grades").length < 5 && getDocumentsByType("grades").length > 0 && (
          <CardFooter className="border-t pt-4 flex justify-end">
            <label htmlFor="file-upload-grades-another">
              <div className="bg-[#800000] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#600000] transition-colors">
                Upload Another
              </div>
              <input
                id="file-upload-grades-another"
                type="file"
                className="hidden"
                accept=".pdf, .jpg, .png"
                onChange={handleFileUpload("grades")}
                multiple
              />
            </label>
          </CardFooter>
        )}
      </Card>
      
      {/* Income Tax Return Section with Additional Info */}
      <Card className="mb-6">
        <CardHeader className="bg-[#800000]/10 border-b border-[#800000]/20">
          <CardTitle className="text-[#800000]">Income Tax Return</CardTitle>
          <CardDescription>Upload your parents' or guardian's latest ITR and provide income details</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Income Tax Info Input Fields */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3">Income Tax Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="annualIncome">Annual Income (₱)</Label>
                <Input
                  id="annualIncome"
                  type="number"
                  placeholder="e.g., 250000"
                  value={incomeTaxInfo.annualIncome}
                  onChange={(e) => setIncomeTaxInfo({...incomeTaxInfo, annualIncome: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="taxableIncome">Taxable Income (₱)</Label>
                <Input
                  id="taxableIncome"
                  type="number"
                  placeholder="e.g., 200000"
                  value={incomeTaxInfo.taxableIncome}
                  onChange={(e) => setIncomeTaxInfo({...incomeTaxInfo, taxableIncome: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="taxYear">Tax Year</Label>
                <Input
                  id="taxYear"
                  type="text"
                  placeholder="e.g., 2023"
                  value={incomeTaxInfo.taxYear}
                  onChange={(e) => setIncomeTaxInfo({...incomeTaxInfo, taxYear: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="employerName">Employer Name</Label>
                <Input
                  id="employerName"
                  type="text"
                  placeholder="e.g., ABC Corporation"
                  value={incomeTaxInfo.employerName}
                  onChange={(e) => setIncomeTaxInfo({...incomeTaxInfo, employerName: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                <Input
                  id="tin"
                  type="text"
                  placeholder="e.g., 123-456-789-000"
                  value={incomeTaxInfo.tin}
                  onChange={(e) => setIncomeTaxInfo({...incomeTaxInfo, tin: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          {/* Original ITR document upload section */}
          <div className="space-y-4">
            {getDocumentsByType("itr").map((doc) => (
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

            {getDocumentsByType("itr").length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-4">No ITR uploaded yet</p>
                <label htmlFor="file-upload-itr">
                  <div className="bg-[#800000] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#600000] transition-colors">
                    Upload ITR
                  </div>
                  <input
                    id="file-upload-itr"
                    type="file"
                    className="hidden"
                    accept=".pdf, .jpg, .png"
                    onChange={handleFileUpload("itr")}
                    multiple
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Accepted formats: .pdf, .jpg, .png</p>
              </div>
            )}
          </div>
        </CardContent>
        {getDocumentsByType("itr").length < 5 && getDocumentsByType("itr").length > 0 && (
          <CardFooter className="border-t pt-4 flex justify-end">
            <label htmlFor="file-upload-itr-another">
              <div className="bg-[#800000] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#600000] transition-colors">
                Upload Another
              </div>
              <input
                id="file-upload-itr-another"
                type="file"
                className="hidden"
                accept=".pdf, .jpg, .png"
                onChange={handleFileUpload("itr")}
                multiple
              />
            </label>
          </CardFooter>
        )}
      </Card>
      {renderDocumentSection("nbi")}
      {renderDocumentSection("goodMoral")}
      {renderDocumentSection("physicalCheckup")}
      {renderDocumentSection("homeLocationSketch")}
      {renderDocumentSection("personalityTestPaymentReceipt")}

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