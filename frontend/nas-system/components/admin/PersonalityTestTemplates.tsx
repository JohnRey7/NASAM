"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/services/personalityTestService"

export function PersonalityTestTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    questions: [] as any[], // Simplified for now, ideally would have a question editor
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllTemplates()
      setTemplates(response || [])
    } catch (error: any) {
      console.error("Error fetching templates:", error)
      setError(error.message || "Failed to fetch templates")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate._id, formData)
        toast({ title: "Success", description: "Template updated successfully" })
      } else {
        await createTemplate(formData)
        toast({ title: "Success", description: "Template created successfully" })
      }
      setIsDialogOpen(false)
      fetchTemplates()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (template: any) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || "",
      questions: template.questions || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    try {
      await deleteTemplate(id)
      toast({ title: "Success", description: "Template deleted successfully" })
      fetchTemplates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setFormData({
      name: "",
      description: "",
      questions: [],
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
        </div>
      )}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#800000] hover:bg-[#600000]">
              <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              {/* Question editor would go here - keeping it simple for now */}
              <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                Question editing is not yet implemented in this view.
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-[#800000] hover:bg-[#600000]">
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template._id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.description || "-"}</TableCell>
                  <TableCell>{template.questions?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
