"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, FileText, Download, Trash2, Loader2 } from "lucide-react"
import { documentUploadService, DocumentUpload } from "@/services/documentUploadService"
import { format } from "date-fns"

export function DocumentManagement() {
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await documentUploadService.getAllDocuments({ search })
      // Handle different response structures
      const docs = Array.isArray(response) ? response : (response.documents || response.data || [])
      setDocuments(docs)
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDocuments()
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete all documents for this user? This action cannot be undone.")) return
    
    try {
      await documentUploadService.deleteDocument(userId)
      toast({ title: "Success", description: "Documents deleted successfully" })
      fetchDocuments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete documents",
        variant: "destructive"
      })
    }
  }

  const countFiles = (doc: DocumentUpload) => {
    let count = 0
    if (doc.studentPicture) count++
    if (doc.nbiClearance?.length) count += doc.nbiClearance.length
    if (doc.gradeReport?.length) count += doc.gradeReport.length
    if (doc.incomeTaxReturn?.length) count += doc.incomeTaxReturn.length
    if (doc.goodMoralCertificate?.length) count += doc.goodMoralCertificate.length
    if (doc.physicalCheckup?.length) count += doc.physicalCheckup.length
    return count
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Document Uploads</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Files Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell className="font-medium">
                      {doc.user?.name || "Unknown User"}
                      <div className="text-xs text-gray-500">{doc.user?.idNumber}</div>
                    </TableCell>
                    <TableCell>
                      {doc.updatedAt ? format(new Date(doc.updatedAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {countFiles(doc)} files
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(doc.user?._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
