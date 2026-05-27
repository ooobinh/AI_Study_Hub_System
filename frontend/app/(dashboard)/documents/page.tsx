"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  Grid,
  List,
  MessageSquare,
  MoreVertical,
  MoveRight,
  Search,
  Share2,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { LogoLoader } from "@/components/layout/logo-loader"
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
  subjectId?: number | null
  subjectName?: string | null
  folderId?: number | null
  folderName?: string | null
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
  updatedAt?: string | null
}

interface DocumentFolderDto {
  id: number
  ownerId: number
  name: string
  documentCount: number
  totalSize: number
  createdAt: string
  updatedAt?: string | null
}

interface DocumentShareDto {
  shareUrl: string
}

interface SubjectDto {
  id: number
  code: string
  name: string
}

type FolderFilter = "all" | "root" | string
type FileTypeFilter = "all" | "pdf" | "word" | "powerpoint" | "other"
type DateRangeFilter = "all" | "today" | "7d" | "30d"
type SortOrder = "newest" | "oldest" | "name" | "size"

async function uploadFileToBackend(file: File, ownerId: string, folderId?: number | null): Promise<DocumentDto> {
  const formData = new FormData()
  formData.append("ownerId", ownerId)
  if (folderId) {
    formData.append("folderId", String(folderId))
  }
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
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function formatFileSize(bytes: number | null | undefined, unknownSize: string) {
  if (bytes == null) return unknownSize
  if (bytes === 0) return "0 KB"
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`
}

function formatClock(value: string | null | undefined) {
  if (!value) return ""
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  if (Number.isNaN(diff)) return ""
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `about ${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function getExtension(fileName: string) {
  const parts = fileName.split(".")
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "FILE" : "FILE"
}

function getFileKind(doc: DocumentDto): FileTypeFilter {
  const value = `${doc.fileType || ""} ${doc.originalFileName || ""}`.toLowerCase()
  if (value.includes("pdf") || value.endsWith(".pdf")) return "pdf"
  if (value.includes("word") || value.endsWith(".doc") || value.endsWith(".docx")) return "word"
  if (value.includes("powerpoint") || value.endsWith(".ppt") || value.endsWith(".pptx")) return "powerpoint"
  return "other"
}

function matchesDateRange(value: string, range: DateRangeFilter) {
  if (range === "all") return true
  const created = new Date(value).getTime()
  if (Number.isNaN(created)) return true
  const now = Date.now()
  if (range === "today") {
    return new Date(value).toDateString() === new Date().toDateString()
  }
  const days = range === "7d" ? 7 : 30
  return now - created <= days * 24 * 60 * 60 * 1000
}

function fileAccent(kind: FileTypeFilter) {
  if (kind === "pdf") return "bg-rose-600"
  if (kind === "word") return "bg-blue-600"
  if (kind === "powerpoint") return "bg-orange-600"
  return "bg-slate-600"
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [selectedFolderId, setSelectedFolderId] = useState<FolderFilter>("all")
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all")
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadMessage, setUploadMessage] = useState("")
  const [documents, setDocuments] = useState<DocumentDto[]>([])
  const [folders, setFolders] = useState<DocumentFolderDto[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<SubjectDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [createFolderError, setCreateFolderError] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [movingDoc, setMovingDoc] = useState<DocumentDto | null>(null)
  const [moveTargetFolderId, setMoveTargetFolderId] = useState("")
  const [moveError, setMoveError] = useState("")
  const [editingDoc, setEditingDoc] = useState<DocumentDto | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editVisibility, setEditVisibility] = useState("PRIVATE")
  const [editSubjectId, setEditSubjectId] = useState("")

  const copy = useMemo(() => ({
    title: t("documents"),
    subtitle: language === "vi" ? "Quan ly tai lieu hoc tap va thu muc cua ban." : "View all your uploaded documents here",
    createFolder: language === "vi" ? "Tao folder" : "Create folder",
    allFolders: language === "vi" ? "Tat ca folder" : "All Folders",
    outsideFolder: language === "vi" ? "Ben ngoai folder" : "Outside folder",
    fileType: language === "vi" ? "Loai file" : "File type",
    dateRange: language === "vi" ? "Khoang ngay" : "Date range",
    sortOrder: language === "vi" ? "Sap xep" : "Sort order",
    gridView: language === "vi" ? "Grid view" : "Grid view",
    listView: language === "vi" ? "List view" : "List view",
    fileName: language === "vi" ? "Ten file" : "File Name",
    size: language === "vi" ? "Dung luong" : "Size",
    dateCreated: language === "vi" ? "Ngay tao" : "Date created",
    nothingMore: language === "vi" ? "Khong con gi de hien thi..." : "Nothing more to show...",
    openFolder: language === "vi" ? "Mo folder" : "Open folder",
    moveToFolder: language === "vi" ? "Chuyen toi folder" : "Move to folder",
    folderName: language === "vi" ? "Ten folder" : "Folder name",
    create: language === "vi" ? "Tao" : "Create",
    uploadTo: language === "vi" ? "Upload vao" : "Upload to",
    documentCount: language === "vi" ? "tai lieu" : "document",
    processing: language === "vi" ? "Dang xu ly" : "Processing",
    processed: language === "vi" ? "Da xu ly" : "Processed",
    failed: language === "vi" ? "Loi" : "Failed",
    move: language === "vi" ? "Chuyen" : "Move",
    newest: language === "vi" ? "Moi nhat" : "Newest first",
    oldest: language === "vi" ? "Cu nhat" : "Oldest first",
    name: language === "vi" ? "Ten A-Z" : "Name A-Z",
    largest: language === "vi" ? "Dung luong" : "Largest size",
    today: language === "vi" ? "Hom nay" : "Today",
    last7Days: language === "vi" ? "7 ngay" : "Last 7 days",
    last30Days: language === "vi" ? "30 ngay" : "Last 30 days",
    folderAlreadyOpen: language === "vi" ? "Dang xem folder nay" : "Current folder",
  }), [language, t])

  const selectedFolder = useMemo(() => {
    if (selectedFolderId === "all" || selectedFolderId === "root") return null
    return folders.find((folder) => String(folder.id) === selectedFolderId) || null
  }, [folders, selectedFolderId])

  const uploadFolderId = selectedFolder ? selectedFolder.id : null
  const uploadTargetName = selectedFolder ? selectedFolder.name : copy.outsideFolder

  const loadDocuments = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError("")

    try {
      const [documentsResponse, subjectsResponse, foldersResponse] = await Promise.all([
        fetch(`${getApiUrl()}/api/documents?userId=${user.id}`),
        fetch(`${getApiUrl()}/api/subjects?userId=${user.id}`),
        fetch(`${getApiUrl()}/api/documents/folders?userId=${user.id}`),
      ])
      if (!documentsResponse.ok) {
        throw new Error(t("couldNotLoadDocuments"))
      }
      if (!subjectsResponse.ok) {
        throw new Error("Could not load subjects")
      }
      if (!foldersResponse.ok) {
        const body = await foldersResponse.json().catch(() => null)
        throw new Error(body?.message || "Could not load folders")
      }
      const data = await documentsResponse.json() as DocumentDto[]
      const subjectsData = await subjectsResponse.json() as SubjectDto[]
      const folderData = await foldersResponse.json() as DocumentFolderDto[]
      setDocuments(data)
      setAvailableSubjects(subjectsData)
      setFolders(folderData)
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

        setUploadProgress(25)
        const uploadedDoc = await uploadFileToBackend(file, user.id, uploadFolderId)
        uploadedDocs.push(uploadedDoc)
        setDocuments(prev => [uploadedDoc, ...prev.filter(doc => doc.id !== uploadedDoc.id)])
        setUploadProgress(90)
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

    setSearchQuery("")
    setUploadProgress(100)
    setUploadMessage(uploadedDocs.length === 1 ? t("uploadCompleteShort") : `${uploadedDocs.length} ${t("filesUploaded")}`)
    await loadDocuments()
    setTimeout(() => {
      setUploadProgress(null)
      setUploadMessage("")
    }, 1400)
  }, [loadDocuments, t, uploadFolderId, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  })

  const visibleFolders = useMemo(() => {
    if (selectedFolderId !== "all" || fileTypeFilter !== "all" || dateRange !== "all") return []
    const keyword = searchQuery.trim().toLowerCase()
    return folders.filter((folder) => !keyword || folder.name.toLowerCase().includes(keyword))
  }, [dateRange, fileTypeFilter, folders, searchQuery, selectedFolderId])

  const filteredDocuments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    const filtered = documents.filter((doc) => {
      const folderMatch =
        selectedFolderId === "all"
          ? true
          : selectedFolderId === "root"
            ? !doc.folderId
            : String(doc.folderId || "") === selectedFolderId
      const typeMatch = fileTypeFilter === "all" || getFileKind(doc) === fileTypeFilter
      const dateMatch = matchesDateRange(doc.createdAt, dateRange)
      const haystack = `${doc.title} ${doc.originalFileName} ${doc.subjectName || ""} ${doc.folderName || ""}`.toLowerCase()
      const searchMatch = !keyword || haystack.includes(keyword)
      return folderMatch && typeMatch && dateMatch && searchMatch
    })

    return filtered.sort((a, b) => {
      if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortOrder === "name") return (a.title || a.originalFileName).localeCompare(b.title || b.originalFileName)
      if (sortOrder === "size") return (b.fileSize || 0) - (a.fileSize || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [dateRange, documents, fileTypeFilter, searchQuery, selectedFolderId, sortOrder])

  const canManageDocument = (doc: DocumentDto) => {
    if (!user) return false
    return user.roles.includes("ADMIN") || String(doc.ownerId) === user.id
  }

  const canMoveDocument = (doc: DocumentDto) => {
    if (!user) return false
    return String(doc.ownerId) === user.id
  }

  const createFolder = async () => {
    if (!user) return
    const name = newFolderName.trim()
    if (!name) {
      setCreateFolderError("Folder name is required")
      return
    }

    setIsCreatingFolder(true)
    setCreateFolderError("")
    const response = await fetch(`${getApiUrl()}/api/documents/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: Number(user.id), name }),
    })
    setIsCreatingFolder(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setCreateFolderError(body?.message || "Could not create folder")
      return
    }

    const folder = await response.json() as DocumentFolderDto
    setFolders(prev => [folder, ...prev.filter(item => item.id !== folder.id)])
    setNewFolderName("")
    setCreateFolderOpen(false)
    setSelectedFolderId("all")
  }

  const toggleFavorite = async (id: number) => {
    if (!user) return
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))

    const response = await fetch(`${getApiUrl()}/api/documents/${id}/favorite?userId=${user.id}`, { method: "POST" })
    if (!response.ok) {
      setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, favorite: !doc.favorite } : doc))
      setError(t("couldNotUpdateFavorite"))
    }
  }

  const viewDocument = (doc: DocumentDto) => {
    router.push(`/documents/${doc.id}/view`)
  }

  const downloadDocument = (doc: DocumentDto) => {
    const separator = user ? "&" : "?"
    const userParam = user ? `?userId=${user.id}` : ""
    window.open(`${getApiUrl()}/api/documents/${doc.id}/file${userParam}${separator}download=true`, "_blank")
  }

  const deleteDocument = async (id: number) => {
    if (!user) return
    const response = await fetch(`${getApiUrl()}/api/documents/${id}?userId=${user.id}`, { method: "DELETE" })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || t("couldNotDeleteDocument"))
      return
    }
    setDocuments(prev => prev.filter(doc => doc.id !== id))
    await loadDocuments()
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
    setTimeout(() => setUploadMessage(""), 1400)
  }

  const openEditDialog = (doc: DocumentDto) => {
    setEditingDoc(doc)
    setEditTitle(doc.title || doc.originalFileName)
    setEditDescription(doc.description || "")
    setEditVisibility(doc.visibility || "PRIVATE")
    setEditSubjectId(doc.subjectId ? String(doc.subjectId) : "")
  }

  const saveEdit = async () => {
    if (!editingDoc || !user) return

    const response = await fetch(`${getApiUrl()}/api/documents/${editingDoc.id}?userId=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        visibility: editVisibility,
        subjectId: editSubjectId ? Number(editSubjectId) : null,
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
    setTimeout(() => setUploadMessage(""), 1400)
  }

  const openMoveDialog = (doc: DocumentDto) => {
    setMovingDoc(doc)
    setMoveTargetFolderId(doc.folderId ? String(doc.folderId) : "")
    setMoveError("")
  }

  const moveDocumentToFolder = async () => {
    if (!movingDoc || !user) return
    const folderId = moveTargetFolderId ? Number(moveTargetFolderId) : null

    const response = await fetch(`${getApiUrl()}/api/documents/${movingDoc.id}/folder?userId=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setMoveError(body?.message || "Could not move document")
      return
    }

    const updated = await response.json() as DocumentDto
    setDocuments(prev => prev.map(doc => doc.id === updated.id ? updated : doc))
    setMovingDoc(null)
    await loadDocuments()
  }

  const documentStatus = (status: string) => {
    if (status === "PENDING_REVIEW") return copy.processing
    if (status === "REJECTED") return copy.failed
    return copy.processed
  }

  const uploadRootProps = getRootProps()

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{copy.subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
            <Folder className="h-3.5 w-3.5" />
            <span>{copy.uploadTo}: {uploadTargetName}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateFolderOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary/70"
          >
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
            {copy.createFolder}
          </button>
          <div
            {...uploadRootProps}
            className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all ${
              isDragActive ? "bg-primary/80 ring-4 ring-primary/20" : "bg-foreground hover:bg-foreground/90"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-4 w-4" />
            {t("upload")}
          </div>
        </div>
      </motion.div>

      {(error || uploadMessage || uploadProgress !== null) && (
        <motion.div
          variants={item}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {uploadProgress !== null && !error ? (
            <div className="flex items-center gap-3">
              {uploadProgress < 100 ? (
                <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                  <motion.div className="h-full bg-accent" animate={{ width: `${uploadProgress}%` }} />
                </div>
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{uploadMessage || `${t("uploading")}...`}</span>
            </div>
          ) : (
            error || uploadMessage
          )}
        </motion.div>
      )}

      <motion.div variants={item} className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:flex-wrap">
            <label className="relative min-w-[240px] flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchDocuments")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/70 bg-background pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              />
            </label>

            <div className="relative">
              <Folder className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedFolderId}
                onChange={(event) => setSelectedFolderId(event.target.value)}
                className="h-11 min-w-[170px] appearance-none rounded-xl border border-border/70 bg-background pl-11 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">{copy.allFolders}</option>
                <option value="root">{copy.outsideFolder}</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={fileTypeFilter}
                onChange={(event) => setFileTypeFilter(event.target.value as FileTypeFilter)}
                className="h-11 min-w-[150px] appearance-none rounded-xl border border-border/70 bg-background pl-11 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">{copy.fileType}</option>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="powerpoint">PowerPoint</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value as DateRangeFilter)}
                className="h-11 min-w-[160px] appearance-none rounded-xl border border-border/70 bg-background pl-11 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">{copy.dateRange}</option>
                <option value="today">{copy.today}</option>
                <option value="7d">{copy.last7Days}</option>
                <option value="30d">{copy.last30Days}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="h-11 min-w-[160px] appearance-none rounded-xl border border-border/70 bg-background pl-11 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              >
                <option value="newest">{copy.newest}</option>
                <option value="oldest">{copy.oldest}</option>
                <option value="name">{copy.name}</option>
                <option value="size">{copy.largest}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              {viewMode === "list" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              {viewMode === "list" ? copy.gridView : copy.listView}
            </button>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <LogoLoader compact label="AI Study Hub" sublabel={t("loadingDocuments")} />
      ) : viewMode === "grid" ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleFolders.map((folder) => (
            <motion.button
              key={`folder-${folder.id}`}
              variants={item}
              onClick={() => setSelectedFolderId(String(folder.id))}
              className="rounded-xl border border-border/70 bg-background p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600">
                    <Folder className="h-7 w-7 fill-orange-500/20" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{folder.name}</p>
                    <p className="text-sm text-muted-foreground">{folder.documentCount} {copy.documentCount}{folder.documentCount === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatFileSize(folder.totalSize, "0 KB")}</span>
              </div>
            </motion.button>
          ))}
          {filteredDocuments.map((doc) => {
            const kind = getFileKind(doc)
            return (
              <motion.div
                key={doc.id}
                variants={item}
                className="rounded-xl border border-border/70 bg-background p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-secondary/30"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => viewDocument(doc)}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${fileAccent(kind)} text-white`}
                  >
                    <FileText className="h-6 w-6" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => viewDocument(doc)}
                      className="block max-w-full truncate text-left font-semibold text-foreground hover:text-primary"
                    >
                      {doc.title || doc.originalFileName}
                    </button>
                    <p className="mt-1 text-sm uppercase text-muted-foreground">{getExtension(doc.originalFileName)}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.fileSize, t("unknownSize"))}</span>
                      <span>{formatRelativeTime(doc.createdAt)}</span>
                      {doc.folderName && <span>{doc.folderName}</span>}
                    </div>
                  </div>
                  <DocumentActions
                    doc={doc}
                    canManage={canManageDocument(doc)}
                    canMove={canMoveDocument(doc)}
                    onView={() => viewDocument(doc)}
                    onDownload={() => downloadDocument(doc)}
                    onShare={() => shareDocument(doc)}
                    onEdit={() => openEditDialog(doc)}
                    onMove={() => openMoveDialog(doc)}
                    onDelete={() => deleteDocument(doc.id)}
                    onFavorite={() => toggleFavorite(doc.id)}
                    t={t}
                    copy={copy}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <motion.div variants={item} className="overflow-x-auto rounded-xl border border-border/70 bg-background shadow-sm">
          <div className="grid min-w-[780px] grid-cols-[48px_minmax(260px,1fr)_140px_190px_96px] items-center bg-secondary/55 px-4 py-3 text-sm font-medium text-muted-foreground">
            <input type="checkbox" aria-label="Select all" className="h-4 w-4 rounded border-border" />
            <span>{copy.fileName}</span>
            <span>{copy.size}</span>
            <span>{copy.dateCreated}</span>
            <span className="text-right"> </span>
          </div>

          {visibleFolders.map((folder) => (
            <div
              key={`folder-row-${folder.id}`}
              className="grid min-w-[780px] cursor-pointer grid-cols-[48px_minmax(260px,1fr)_140px_190px_96px] items-center border-t border-border/60 px-4 py-4 transition-colors hover:bg-secondary/35"
              onClick={() => setSelectedFolderId(String(folder.id))}
            >
              <input
                type="checkbox"
                aria-label={`Select ${folder.name}`}
                className="h-4 w-4 rounded border-border"
                onClick={(event) => event.stopPropagation()}
              />
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600">
                  <Folder className="h-8 w-8 fill-orange-500/20" />
                  <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{folder.name}</p>
                  <p className="text-sm text-muted-foreground">{folder.documentCount} {copy.documentCount}{folder.documentCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <span className="text-sm text-foreground">{formatFileSize(folder.totalSize, "0 KB")}</span>
              <div className="text-sm">
                <p className="font-medium text-foreground">{formatRelativeTime(folder.createdAt)}</p>
                <p className="text-muted-foreground">{formatClock(folder.createdAt)}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Folder actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card border-border/50">
                    <DropdownMenuItem onClick={() => setSelectedFolderId(String(folder.id))} className="cursor-pointer gap-2">
                      <Folder className="h-4 w-4" /> {copy.openFolder}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {filteredDocuments.map((doc) => {
            const kind = getFileKind(doc)
            return (
              <div
                key={`doc-row-${doc.id}`}
                className="grid min-w-[780px] cursor-pointer grid-cols-[48px_minmax(260px,1fr)_140px_190px_96px] items-center border-t border-border/60 px-4 py-4 transition-colors hover:bg-secondary/35"
                onClick={() => viewDocument(doc)}
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${doc.title || doc.originalFileName}`}
                  className="h-4 w-4 rounded border-border"
                  onClick={(event) => event.stopPropagation()}
                />
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${fileAccent(kind)} text-white shadow-sm`}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{doc.title || doc.originalFileName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="uppercase">{getExtension(doc.originalFileName)}</span>
                      {doc.folderName && (
                        <>
                          <span>in</span>
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">{doc.folderName}</span>
                        </>
                      )}
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent">{documentStatus(doc.status)}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-foreground">{formatFileSize(doc.fileSize, t("unknownSize"))}</span>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{formatRelativeTime(doc.createdAt)}</p>
                  <p className="text-muted-foreground">{formatClock(doc.createdAt)}</p>
                </div>
                <div className="flex items-center justify-end gap-3" onClick={(event) => event.stopPropagation()}>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <DocumentActions
                    doc={doc}
                    canManage={canManageDocument(doc)}
                    canMove={canMoveDocument(doc)}
                    onView={() => viewDocument(doc)}
                    onDownload={() => downloadDocument(doc)}
                    onShare={() => shareDocument(doc)}
                    onEdit={() => openEditDialog(doc)}
                    onMove={() => openMoveDialog(doc)}
                    onDelete={() => deleteDocument(doc.id)}
                    onFavorite={() => toggleFavorite(doc.id)}
                    t={t}
                    copy={copy}
                  />
                </div>
              </div>
            )
          })}

          {visibleFolders.length === 0 && filteredDocuments.length === 0 && (
            <div className="border-t border-border/60 px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">{t("noDocuments")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("noDocumentsSubtext")}</p>
            </div>
          )}

          {(visibleFolders.length > 0 || filteredDocuments.length > 0) && (
            <div className="border-t border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
              {copy.nothingMore}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {createFolderOpen && (
          <ModalFrame onClose={() => setCreateFolderOpen(false)}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{copy.createFolder}</h2>
                <p className="text-sm text-muted-foreground">Create a place to keep related documents together.</p>
              </div>
              <button
                onClick={() => setCreateFolderOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-foreground">{copy.folderName}</label>
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createFolder()
                }
              }}
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              placeholder="Java MVC, Algorithms, IELTS..."
              autoFocus
            />
            {createFolderError && (
              <p className="mt-2 text-sm text-destructive">{createFolderError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCreateFolderOpen(false)}
                className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t("cancel")}
              </button>
              <button
                onClick={createFolder}
                disabled={isCreatingFolder}
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
              >
                {isCreatingFolder ? t("pleaseWait") : copy.create}
              </button>
            </div>
          </ModalFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {movingDoc && (
          <ModalFrame onClose={() => setMovingDoc(null)}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{copy.moveToFolder}</h2>
                <p className="max-w-sm truncate text-sm text-muted-foreground">{movingDoc.title || movingDoc.originalFileName}</p>
              </div>
              <button
                onClick={() => setMovingDoc(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-foreground">{copy.allFolders}</label>
            <select
              value={moveTargetFolderId}
              onChange={(event) => setMoveTargetFolderId(event.target.value)}
              className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
            >
              <option value="">{copy.outsideFolder}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
            {moveError && (
              <p className="mt-2 text-sm text-destructive">{moveError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setMovingDoc(null)}
                className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t("cancel")}
              </button>
              <button
                onClick={moveDocumentToFolder}
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                {copy.move}
              </button>
            </div>
          </ModalFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDoc && (
          <ModalFrame onClose={() => setEditingDoc(null)}>
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
                  className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("description")}</label>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("visibility")}</label>
                <select
                  value={editVisibility}
                  onChange={(event) => setEditVisibility(event.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                >
                  <option value="PRIVATE">{t("private")}</option>
                  <option value="PUBLIC">{t("public")}</option>
                  <option value="SHARED">{t("shared")}</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("subjects")}</label>
                <select
                  value={editSubjectId}
                  onChange={(event) => setEditSubjectId(event.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">{t("uncategorized")}</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingDoc(null)}
                className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t("cancel")}
              </button>
              <button
                onClick={saveEdit}
                className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                {t("saveChanges")}
              </button>
            </div>
          </ModalFrame>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ModalFrame({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="glass-card w-full max-w-lg rounded-xl p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function DocumentActions({
  doc,
  canManage,
  canMove,
  onView,
  onDownload,
  onShare,
  onEdit,
  onMove,
  onDelete,
  onFavorite,
  t,
  copy,
}: {
  doc: DocumentDto
  canManage: boolean
  canMove: boolean
  onView: () => void
  onDownload: () => void
  onShare: () => void
  onEdit: () => void
  onMove: () => void
  onDelete: () => void
  onFavorite: () => void
  t: (key: string) => string
  copy: Record<string, string>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Document actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card min-w-48 border-border/50">
        <DropdownMenuItem onClick={onView} className="cursor-pointer gap-2">
          <Eye className="h-4 w-4" /> {t("view")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload} className="cursor-pointer gap-2">
          <Download className="h-4 w-4" /> {t("download")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="cursor-pointer gap-2">
          <Share2 className="h-4 w-4" /> {t("share")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFavorite} className="cursor-pointer gap-2">
          <Star className={`h-4 w-4 ${doc.favorite ? "fill-chart-4 text-chart-4" : ""}`} /> {t("favorites")}
        </DropdownMenuItem>
        {canMove && (
          <DropdownMenuItem onClick={onMove} className="cursor-pointer gap-2">
            <MoveRight className="h-4 w-4" /> {copy.moveToFolder}
          </DropdownMenuItem>
        )}
        {canManage && (
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2">
            <Edit3 className="h-4 w-4" /> {t("editDetails")}
          </DropdownMenuItem>
        )}
        {canManage && (
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" /> {t("delete")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
