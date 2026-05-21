"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileText,
  Grid,
  List,
  Search,
  Filter,
  Star,
  Download,
  Share2,
  MoreVertical,
  Edit3,
  Eye,
  Tag,
  X,
  Check
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DocumentDto {
  id: number
  ownerId: number
  ownerName: string
  subjectName?: string | null
  categoryName?: string | null
  title: string
  description?: string | null
  originalFileName: string
  fileUrl: string
  previewUrl?: string | null
  fileType?: string | null
  fileSize?: number | null
  pageCount?: number | null
  visibility: string
  status: string
  favorite: boolean
  createdAt: string
}

interface DocumentShareDto {
  shareUrl: string
}

async function uploadFileToBackend(file: File, ownerId: string): Promise<DocumentDto> {
  const formData = new FormData()
  formData.append("ownerId", ownerId)
  formData.append("file", file)

  const response = await fetch(`${getApiUrl()}/api/uploads/documents`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || "Local upload failed")
  }

  return response.json() as Promise<DocumentDto>
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function formatFileSize(bytes: number | null | undefined, unknownSize: string) {
  if (!bytes) return unknownSize
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

function formatDate(value: string, language: "en" | "vi") {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedSubject, setSelectedSubject] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadMessage, setUploadMessage] = useState("")
  const [documents, setDocuments] = useState<DocumentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingDoc, setEditingDoc] = useState<DocumentDto | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editVisibility, setEditVisibility] = useState("PRIVATE")

  const loadDocuments = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${getApiUrl()}/api/documents?userId=${user.id}`)
      if (!response.ok) {
        throw new Error(t("couldNotLoadDocuments"))
      }
      const data = await response.json() as DocumentDto[]
      setDocuments(data)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [t, user])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return

    setError("")
    setUploadMessage("")
    const uploadedDocs: DocumentDto[] = []

    for (const file of acceptedFiles) {
      try {
        setUploadProgress(0)
        setUploadMessage(`${t("uploading")} ${file.name}...`)

        setUploadProgress(20)
        const uploadedDoc = await uploadFileToBackend(file, user.id)
        uploadedDocs.push(uploadedDoc)
        setDocuments(prev => [uploadedDoc, ...prev.filter(doc => doc.id !== uploadedDoc.id)])
        setUploadProgress(95)
      } catch (err) {
        setError(getNetworkErrorMessage(err))
        break
      }
    }

    if (uploadedDocs.length === 0) {
      setUploadProgress(null)
      setUploadMessage("")
      return
    }

    setSelectedSubject("All")
    setSearchQuery("")
    setUploadProgress(100)
    setUploadMessage(uploadedDocs.length === 1 ? t("uploadCompleteShort") : `${uploadedDocs.length} ${t("filesUploaded")}`)
    await loadDocuments()
    setTimeout(() => {
      setUploadProgress(null)
      setUploadMessage("")
    }, 1200)
  }, [loadDocuments, t, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    }
  })

  const subjects = useMemo(() => {
    const names = documents.map((doc) => doc.subjectName || t("uncategorized"))
    return ["All", ...Array.from(new Set(names))]
  }, [documents, t])

  const filteredDocuments = documents.filter(doc => {
    const subject = doc.subjectName || t("uncategorized")
    const matchesSubject = selectedSubject === "All" || subject === selectedSubject
    const haystack = `${doc.title} ${doc.originalFileName} ${subject}`.toLowerCase()
    const matchesSearch = haystack.includes(searchQuery.toLowerCase())
    return matchesSubject && matchesSearch
  })

  const toggleFavorite = async (id: number) => {
    if (!user) return
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))

    const response = await fetch(`${getApiUrl()}/api/documents/${id}/favorite?userId=${user.id}`, { method: "POST" })
    if (!response.ok) {
      setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))
      setError(t("couldNotUpdateFavorite"))
    }
  }

  const viewDocument = async (doc: DocumentDto) => {
    router.push(`/documents/${doc.id}/view`)
  }

  const downloadDocument = async (doc: DocumentDto) => {
    const separator = user ? "&" : "?"
    const userParam = user ? `?userId=${user.id}` : ""
    window.open(`${getApiUrl()}/api/documents/${doc.id}/file${userParam}${separator}download=true`, "_blank")
  }

  const deleteDocument = async (id: number) => {
    const response = await fetch(`${getApiUrl()}/api/documents/${id}`, { method: "DELETE" })
    if (!response.ok) {
      setError(t("couldNotDeleteDocument"))
      return
    }
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const shareDocument = async (doc: DocumentDto) => {
    if (!user) return
    const response = await fetch(`${getApiUrl()}/api/documents/${doc.id}/share?sharedBy=${user.id}&permission=VIEW`, {
      method: "POST",
    })
    if (!response.ok) {
      setError(t("couldNotCreateShareLink"))
      return
    }

    const share = await response.json() as DocumentShareDto
    await navigator.clipboard.writeText(share.shareUrl)
    setUploadMessage(t("shareLinkCopied"))
    setTimeout(() => setUploadMessage(""), 1200)
  }

  const openEditDialog = (doc: DocumentDto) => {
    setEditingDoc(doc)
    setEditTitle(doc.title || doc.originalFileName)
    setEditDescription(doc.description || "")
    setEditVisibility(doc.visibility || "PRIVATE")
  }

  const saveEdit = async () => {
    if (!editingDoc) return

    const response = await fetch(`${getApiUrl()}/api/documents/${editingDoc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        visibility: editVisibility,
      }),
    })

    if (!response.ok) {
      setError(t("couldNotUpdateDocument"))
      return
    }

    const updated = await response.json() as DocumentDto
    setDocuments(prev => prev.map(doc => doc.id === updated.id ? updated : doc))
    setEditingDoc(null)
    setUploadMessage(t("documentUpdated"))
    setTimeout(() => setUploadMessage(""), 1200)
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("documents")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("documentsSubtitle")}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border/50 hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDragActive ? "bg-primary/20" : "bg-secondary"
              }`}
              animate={{ y: isDragActive ? -5 : 0 }}
            >
              <Upload className={`w-7 h-7 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            </motion.div>
            <div>
              <p className="text-foreground font-medium">
                {isDragActive ? t("dropFilesHere") : t("dragDropFiles")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("supportedFiles")}
              </p>
            </div>
          </motion.div>

          <AnimatePresence>
            {uploadProgress !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  {uploadProgress < 100 ? (
                    <>
                      <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-foreground">{uploadMessage || `${t("uploading")}... ${uploadProgress}%`}</p>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 text-accent"
                    >
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{uploadMessage || t("uploadComplete")}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {(error || uploadMessage) && uploadProgress === null && (
        <motion.div
          variants={item}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {error || uploadMessage}
        </motion.div>
      )}

      <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchDocuments")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {subjects.map((subject) => (
            <motion.button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedSubject === subject
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {subject}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
          {[
            { mode: "grid" as const, icon: Grid },
            { mode: "list" as const, icon: List },
          ].map(({ mode, icon: Icon }) => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon className="w-4 h-4" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loadingDocuments")}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-secondary/20 py-14 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">{t("noDocuments")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("noDocumentsSubtext")}</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-3"
          }
        >
          {filteredDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              variants={item}
              layout
              onClick={() => viewDocument(doc)}
              className={`glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group ${
                viewMode === "list" ? "p-4" : "p-4"
              }`}
              whileHover={{ y: -4 }}
            >
              {viewMode === "grid" ? (
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-lg bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                    <FileText className="w-12 h-12 text-muted-foreground/50" />
                    <motion.div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
                      <motion.button
                        onClick={(event) => { event.stopPropagation(); viewDocument(doc) }}
                        className="p-2 rounded-lg bg-secondary/80 text-foreground"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={(event) => { event.stopPropagation(); downloadDocument(doc) }}
                        className="p-2 rounded-lg bg-secondary/80 text-foreground"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={(event) => { event.stopPropagation(); shareDocument(doc) }}
                        className="p-2 rounded-lg bg-secondary/80 text-foreground"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Share2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {doc.title || doc.originalFileName}
                      </p>
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id) }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Star className={`w-4 h-4 ${doc.favorite ? "text-chart-4 fill-chart-4" : "text-muted-foreground"}`} />
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs">
                        {doc.subjectName || t("uncategorized")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(doc.createdAt, language)}</span>
                      <span>{formatFileSize(doc.fileSize, t("unknownSize"))}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.title || doc.originalFileName}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs">
                        {doc.subjectName || t("uncategorized")}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize, t("unknownSize"))}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt, language)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <motion.button
                      onClick={() => toggleFavorite(doc.id)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star className={`w-4 h-4 ${doc.favorite ? "text-chart-4 fill-chart-4" : "text-muted-foreground"}`} />
                    </motion.button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          className="p-1 rounded-lg hover:bg-secondary"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-border/50">
                        <DropdownMenuItem onClick={() => viewDocument(doc)} className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                          <Eye className="w-4 h-4" /> {t("view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadDocument(doc)} className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                          <Download className="w-4 h-4" /> {t("download")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(doc)} className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                          <Edit3 className="w-4 h-4" /> {t("editDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareDocument(doc)} className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                          <Share2 className="w-4 h-4" /> {t("share")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                          <Tag className="w-4 h-4" /> {t("addTag")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteDocument(doc.id)} className="text-destructive focus:text-destructive cursor-pointer gap-2">
                          <X className="w-4 h-4" /> {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {editingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            onClick={() => setEditingDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="glass-card w-full max-w-lg rounded-xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t("editDocument")}</h2>
                  <p className="text-sm text-muted-foreground">{editingDoc.originalFileName}</p>
                </div>
                <button
                  onClick={() => setEditingDoc(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t("title")}</label>
                  <input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t("description")}</label>
                  <textarea
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{t("visibility")}</label>
                  <select
                    value={editVisibility}
                    onChange={(event) => setEditVisibility(event.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="PRIVATE">{t("private")}</option>
                    <option value="PUBLIC">{t("public")}</option>
                    <option value="SHARED">{t("shared")}</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingDoc(null)}
                  className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={saveEdit}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {t("saveChanges")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
