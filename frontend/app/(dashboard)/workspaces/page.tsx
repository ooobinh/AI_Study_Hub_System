"use client"

import { AnimatePresence, motion } from "framer-motion"
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import {
  Activity,
  Bot,
  Check,
  Clipboard,
  Copy,
  FileText,
  Globe2,
  Layers,
  ListChecks,
  Loader2,
  Lock,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Tags,
  Trash2,
  Trophy,
  Upload,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { LogoLoader } from "@/components/layout/logo-loader"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

type WorkspaceTab =
  | "overview"
  | "documents"
  | "ai"
  | "tasks"
  | "discussion"
  | "quiz"
  | "flashcards"
  | "members"
  | "activity"
  | "settings"

interface SubjectDto {
  id: number
  code: string
  name: string
}

interface WorkspaceDto {
  id: number
  name: string
  description?: string | null
  inviteCode: string
  ownerId: number
  ownerName: string
  subjectId?: number | null
  subjectName?: string | null
  visibility: string
  memberCount: number
  documentCount: number
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface WorkspaceMemberDto {
  userId: number
  fullName: string
  email: string
  avatarUrl?: string | null
  role: string
  uploadedDocuments: number
  messageCount: number
  contributionScore: number
  joinedAt: string
}

interface WorkspaceDocumentDto {
  id: number
  ownerId: number
  ownerName: string
  subjectId?: number | null
  subjectName?: string | null
  categoryName?: string | null
  title: string
  description?: string | null
  originalFileName: string
  fileUrl: string
  previewUrl?: string | null
  fileType?: string | null
  fileSize?: number | null
  visibility: string
  status: string
  processingStatus: string
  addedById: number
  addedByName: string
  tags: string[]
  addedAt: string
  createdAt: string
  updatedAt: string
}

interface WorkspaceMessageDto {
  id: number
  workspaceId: number
  userId: number
  userName: string
  userAvatarUrl?: string | null
  content: string
  createdAt: string
}

interface WorkspaceTaskDto {
  id: number
  workspaceId: number
  title: string
  description?: string | null
  assignedTo?: number | null
  assignedToName?: string | null
  createdBy: number
  createdByName: string
  status: string
  deadlineAt?: string | null
  createdAt: string
  updatedAt: string
}

interface WorkspaceCommentDto {
  id: number
  postId: number
  userId: number
  userName: string
  userAvatarUrl?: string | null
  content: string
  createdAt: string
}

interface WorkspacePostDto {
  id: number
  workspaceId: number
  authorId: number
  authorName: string
  authorAvatarUrl?: string | null
  title: string
  content: string
  pinned: boolean
  attachedDocumentId?: number | null
  attachedDocumentTitle?: string | null
  createdAt: string
  updatedAt: string
  comments: WorkspaceCommentDto[]
}

interface WorkspaceActivityDto {
  id: number
  workspaceId: number
  userId?: number | null
  userName?: string | null
  userAvatarUrl?: string | null
  activityType: string
  entityType?: string | null
  entityId?: number | null
  description: string
  createdAt: string
}

interface WorkspaceInvitationDto {
  id: number
  workspaceId: number
  invitedEmail?: string | null
  inviteToken: string
  inviteUrl: string
  role: string
  invitedBy: number
  invitedByName: string
  status: string
  expiresAt?: string | null
  createdAt: string
}

interface WorkspaceAiOutputDto {
  id: number
  workspaceId: number
  documentId?: number | null
  documentTitle?: string | null
  requestedBy: number
  requestedByName: string
  outputType: string
  prompt?: string | null
  resultText: string
  createdAt: string
}

interface WorkspaceQuizDto {
  id: number
  workspaceId: number
  documentId?: number | null
  documentTitle?: string | null
  title: string
  createdBy: number
  createdByName: string
  questionsJson: string
  attemptCount: number
  bestScore?: number | null
  createdAt: string
}

interface WorkspaceFlashcardSetDto {
  id: number
  workspaceId: number
  documentId?: number | null
  documentTitle?: string | null
  title: string
  createdBy: number
  createdByName: string
  cardsJson: string
  reviewedCount: number
  totalCount: number
  createdAt: string
}

interface WorkspaceDetailDto {
  workspace: WorkspaceDto
  members: WorkspaceMemberDto[]
  documents: WorkspaceDocumentDto[]
  messages: WorkspaceMessageDto[]
  tasks: WorkspaceTaskDto[]
  posts: WorkspacePostDto[]
  activities: WorkspaceActivityDto[]
  aiOutputs: WorkspaceAiOutputDto[]
  invitations: WorkspaceInvitationDto[]
  quizzes: WorkspaceQuizDto[]
  flashcardSets: WorkspaceFlashcardSetDto[]
}

const tabs: Array<{ id: WorkspaceTab; label: string; icon: ReactNode }> = [
  { id: "overview", label: "Overview", icon: <Layers className="h-4 w-4" /> },
  { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
  { id: "ai", label: "AI", icon: <Bot className="h-4 w-4" /> },
  { id: "tasks", label: "Tasks", icon: <ListChecks className="h-4 w-4" /> },
  { id: "discussion", label: "Discussion", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "quiz", label: "Quiz", icon: <Trophy className="h-4 w-4" /> },
  { id: "flashcards", label: "Flashcards", icon: <Tags className="h-4 w-4" /> },
  { id: "members", label: "Members", icon: <UsersRound className="h-4 w-4" /> },
  { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

function formatDate(value?: string | null) {
  if (!value) return "No date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No date"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "Unknown size"
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

function initials(name?: string | null) {
  return (name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

function roleTone(role: string) {
  if (role === "OWNER") return "bg-primary/15 text-primary border-primary/20"
  if (role === "ADMIN") return "bg-accent/15 text-accent border-accent/20"
  if (role === "VIEWER") return "bg-muted/60 text-muted-foreground border-border/50"
  return "bg-secondary/70 text-foreground border-border/50"
}

function statusTone(status: string) {
  if (status === "DONE" || status === "PROCESSED") return "bg-accent/15 text-accent border-accent/20"
  if (status === "IN_PROGRESS" || status === "PROCESSING") return "bg-primary/15 text-primary border-primary/20"
  if (status === "ERROR") return "bg-destructive/10 text-destructive border-destructive/20"
  return "bg-secondary/70 text-muted-foreground border-border/50"
}

function normalizeTaskLabel(status: string) {
  if (status === "TODO") return "To do"
  if (status === "IN_PROGRESS") return "In progress"
  if (status === "DONE") return "Done"
  return status
}

async function uploadWorkspaceFile(file: File, ownerId: string, workspaceId: number): Promise<WorkspaceDocumentDto> {
  const formData = new FormData()
  formData.append("ownerId", ownerId)
  formData.append("workspaceId", String(workspaceId))
  formData.append("file", file)

  const response = await fetch(`${getApiUrl()}/api/uploads/documents`, {
    method: "POST",
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || "Could not upload document")
  }

  return body as WorkspaceDocumentDto
}

export default function WorkspacesPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const [detail, setDetail] = useState<WorkspaceDetailDto | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview")
  const [workspaceSearch, setWorkspaceSearch] = useState("")
  const [documentSearch, setDocumentSearch] = useState("")
  const [documentStatus, setDocumentStatus] = useState("ALL")
  const [documentSubject, setDocumentSubject] = useState("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadLabel, setUploadLabel] = useState("")

  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceDescription, setWorkspaceDescription] = useState("")
  const [workspaceSubjectId, setWorkspaceSubjectId] = useState("")
  const [workspaceVisibility, setWorkspaceVisibility] = useState("PRIVATE")
  const [inviteCode, setInviteCode] = useState("")

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("MEMBER")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskAssignedTo, setTaskAssignedTo] = useState("")
  const [taskDeadline, setTaskDeadline] = useState("")
  const [postTitle, setPostTitle] = useState("")
  const [postContent, setPostContent] = useState("")
  const [postPinned, setPostPinned] = useState(false)
  const [postDocumentId, setPostDocumentId] = useState("")
  const [commentByPost, setCommentByPost] = useState<Record<number, string>>({})
  const [aiType, setAiType] = useState("CHAT")
  const [aiDocumentId, setAiDocumentId] = useState("")
  const [aiQuestion, setAiQuestion] = useState("")
  const [isAiRunning, setIsAiRunning] = useState(false)
  const [quizScores, setQuizScores] = useState<Record<number, string>>({})
  const [flashcardProgress, setFlashcardProgress] = useState<Record<number, string>>({})

  const currentMember = detail?.members.find((member) => String(member.userId) === user?.id)
  const canManageWorkspace = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN"
  const canContribute = currentMember ? currentMember.role !== "VIEWER" : false
  const isOwner = currentMember?.role === "OWNER"

  const loadSubjects = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`${getApiUrl()}/api/subjects?userId=${user.id}`)
      if (response.ok) {
        setSubjects(await response.json() as SubjectDto[])
      }
    } catch {
      setSubjects([])
    }
  }, [user])

  const loadWorkspaces = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces?userId=${user.id}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load workspaces")
      }

      const data = body as WorkspaceDto[]
      setWorkspaces(data)
      setSelectedWorkspaceId((current) => {
        if (current && data.some((workspace) => workspace.id === current)) return current
        return data[0]?.id ?? null
      })
      if (data.length === 0) setDetail(null)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadDetail = useCallback(async (workspaceId: number) => {
    if (!user) return
    setIsDetailLoading(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${workspaceId}?userId=${user.id}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load workspace")
      }

      const nextDetail = body as WorkspaceDetailDto
      setDetail(nextDetail)
      setWorkspaceName(nextDetail.workspace.name)
      setWorkspaceDescription(nextDetail.workspace.description || "")
      setWorkspaceSubjectId(nextDetail.workspace.subjectId ? String(nextDetail.workspace.subjectId) : "")
      setWorkspaceVisibility(nextDetail.workspace.visibility || "PRIVATE")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsDetailLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSubjects()
    loadWorkspaces()
  }, [loadSubjects, loadWorkspaces])

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadDetail(selectedWorkspaceId)
    }
  }, [loadDetail, selectedWorkspaceId])

  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    const token = params.get("invite")
    if (!token) return

    const acceptInvite = async () => {
      setError("")
      try {
        const response = await fetch(`${getApiUrl()}/api/workspaces/invitations/${token}/accept?userId=${user.id}`, {
          method: "POST",
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) throw new Error(body?.message || "Could not accept workspace invite")
        const workspace = body as WorkspaceDto
        setMessage("Workspace invitation accepted")
        setSelectedWorkspaceId(workspace.id)
        await loadWorkspaces()
        window.history.replaceState({}, "", window.location.pathname)
      } catch (err) {
        setError(getNetworkErrorMessage(err))
      }
    }

    acceptInvite()
  }, [loadWorkspaces, user])

  const selectedWorkspace = detail?.workspace || workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null

  const filteredWorkspaces = useMemo(() => {
    const keyword = workspaceSearch.trim().toLowerCase()
    if (!keyword) return workspaces
    return workspaces.filter((workspace) =>
      `${workspace.name} ${workspace.description || ""} ${workspace.inviteCode} ${workspace.subjectName || ""}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [workspaceSearch, workspaces])

  const documentSubjectOptions = useMemo(() => {
    const names = (detail?.documents || []).map((document) => document.subjectName || "Uncategorized")
    return ["ALL", ...Array.from(new Set(names))]
  }, [detail?.documents])

  const filteredDocuments = useMemo(() => {
    const keyword = documentSearch.trim().toLowerCase()
    return (detail?.documents || []).filter((document) => {
      const subject = document.subjectName || "Uncategorized"
      const haystack = `${document.title} ${document.originalFileName} ${document.ownerName} ${document.addedByName} ${subject} ${document.categoryName || ""}`.toLowerCase()
      const statusOk = documentStatus === "ALL" || document.processingStatus === documentStatus
      const subjectOk = documentSubject === "ALL" || subject === documentSubject
      return statusOk && subjectOk && (!keyword || haystack.includes(keyword))
    })
  }, [detail?.documents, documentSearch, documentStatus, documentSubject])

  const topContributors = useMemo(() => {
    return [...(detail?.members || [])].sort((a, b) => b.contributionScore - a.contributionScore).slice(0, 5)
  }, [detail?.members])

  const tasksByStatus = useMemo(() => {
    const tasks = detail?.tasks || []
    return {
      TODO: tasks.filter((task) => task.status === "TODO"),
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
      DONE: tasks.filter((task) => task.status === "DONE"),
    }
  }, [detail?.tasks])

  const showMessage = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(""), 1600)
  }

  const createWorkspace = async () => {
    if (!user || !workspaceName.trim()) {
      setError("Workspace name is required")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces?ownerId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          description: workspaceDescription.trim() || null,
          subjectId: workspaceSubjectId ? Number(workspaceSubjectId) : null,
          visibility: workspaceVisibility,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not create workspace")

      const created = body as WorkspaceDto
      setWorkspaces((current) => [created, ...current.filter((workspace) => workspace.id !== created.id)])
      setSelectedWorkspaceId(created.id)
      setIsCreateOpen(false)
      setWorkspaceName("")
      setWorkspaceDescription("")
      setWorkspaceSubjectId("")
      setWorkspaceVisibility("PRIVATE")
      showMessage("Workspace created")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const joinWorkspace = async () => {
    if (!user || !inviteCode.trim()) {
      setError("Workspace code or invite token is required")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/join?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not join workspace")
      const joined = body as WorkspaceDto
      setWorkspaces((current) => [joined, ...current.filter((workspace) => workspace.id !== joined.id)])
      setSelectedWorkspaceId(joined.id)
      setInviteCode("")
      setIsJoinOpen(false)
      showMessage("Workspace joined")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    showMessage(label)
  }

  const refreshSelected = async () => {
    if (selectedWorkspaceId) {
      await Promise.all([loadWorkspaces(), loadDetail(selectedWorkspaceId)])
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !selectedWorkspaceId || acceptedFiles.length === 0) return
    if (!canContribute) {
      setError("Viewer role cannot upload documents")
      return
    }

    setError("")
    for (const file of acceptedFiles) {
      try {
        setUploadProgress(20)
        setUploadLabel(`Uploading ${file.name}`)
        await uploadWorkspaceFile(file, user.id, selectedWorkspaceId)
        setUploadProgress(85)
      } catch (err) {
        setError(getNetworkErrorMessage(err))
        setUploadProgress(null)
        setUploadLabel("")
        return
      }
    }

    setUploadProgress(100)
    setUploadLabel("Upload complete")
    await refreshSelected()
    setTimeout(() => {
      setUploadProgress(null)
      setUploadLabel("")
    }, 1200)
  }, [canContribute, selectedWorkspaceId, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !canContribute,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  })

  const inviteMember = async () => {
    if (!user || !selectedWorkspaceId) return
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/invitations?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() || null, role: inviteRole }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not create invitation")
      const invitation = body as WorkspaceInvitationDto
      setInviteEmail("")
      await refreshSelected()
      showMessage(invitation.invitedEmail ? "Invitation email sent" : "Invite link created")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const updateMemberRole = async (memberId: number, role: string) => {
    if (!user || !selectedWorkspaceId) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/members/${memberId}/role?userId=${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not update member role")
      return
    }
    await refreshSelected()
  }

  const removeMember = async (memberId: number) => {
    if (!user || !selectedWorkspaceId) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/members/${memberId}?userId=${user.id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not remove member")
      return
    }
    await refreshSelected()
  }

  const createTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !selectedWorkspaceId || !taskTitle.trim()) return
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/tasks?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          assignedTo: taskAssignedTo ? Number(taskAssignedTo) : null,
          deadlineAt: taskDeadline ? taskDeadline : null,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not create task")
      setTaskTitle("")
      setTaskDescription("")
      setTaskAssignedTo("")
      setTaskDeadline("")
      await refreshSelected()
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const updateTaskStatus = async (task: WorkspaceTaskDto, status: string) => {
    if (!user || !selectedWorkspaceId) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/tasks/${task.id}?userId=${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not update task")
      return
    }
    await refreshSelected()
  }

  const createPost = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !selectedWorkspaceId || !postTitle.trim() || !postContent.trim()) return
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/posts?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle.trim(),
          content: postContent.trim(),
          pinned: postPinned,
          attachedDocumentId: postDocumentId ? Number(postDocumentId) : null,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not create post")
      setPostTitle("")
      setPostContent("")
      setPostPinned(false)
      setPostDocumentId("")
      await refreshSelected()
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const createComment = async (postId: number) => {
    if (!user || !selectedWorkspaceId || !commentByPost[postId]?.trim()) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/posts/${postId}/comments?userId=${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentByPost[postId].trim() }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not send comment")
      return
    }
    setCommentByPost((current) => ({ ...current, [postId]: "" }))
    await refreshSelected()
  }

  const setPinned = async (postId: number, pinned: boolean) => {
    if (!user || !selectedWorkspaceId) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/posts/${postId}/pin?userId=${user.id}&pinned=${pinned}`, {
      method: "PATCH",
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not update pinned post")
      return
    }
    await refreshSelected()
  }

  const runAi = async () => {
    if (!user || !selectedWorkspaceId) return
    setIsAiRunning(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/ai?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: aiType,
          documentId: aiDocumentId ? Number(aiDocumentId) : null,
          question: aiQuestion.trim() || null,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not run workspace AI")
      setAiQuestion("")
      await refreshSelected()
      setActiveTab(aiType === "QUIZ" ? "quiz" : aiType === "FLASHCARD" ? "flashcards" : "ai")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsAiRunning(false)
    }
  }

  const completeQuiz = async (quizId: number) => {
    if (!user || !selectedWorkspaceId) return
    const scoreValue = quizScores[quizId] || "0"
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/quizzes/${quizId}/attempts?userId=${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(scoreValue), answersJson: null }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not save quiz result")
      return
    }
    await refreshSelected()
    showMessage("Quiz result saved")
  }

  const updateFlashcardProgress = async (set: WorkspaceFlashcardSetDto) => {
    if (!user || !selectedWorkspaceId) return
    const nextReviewed = Number(flashcardProgress[set.id] || set.reviewedCount || 0)
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/flashcards/${set.id}/progress?userId=${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewedCount: nextReviewed, totalCount: set.totalCount }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not update flashcard progress")
      return
    }
    await refreshSelected()
  }

  const saveSettings = async () => {
    if (!user || !selectedWorkspaceId) return
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          description: workspaceDescription.trim() || null,
          subjectId: workspaceSubjectId ? Number(workspaceSubjectId) : null,
          visibility: workspaceVisibility,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.message || "Could not update workspace")
      await refreshSelected()
      showMessage("Workspace updated")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const leaveWorkspace = async () => {
    if (!user || !selectedWorkspaceId) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/leave?userId=${user.id}`, {
      method: "POST",
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not leave workspace")
      return
    }
    setSelectedWorkspaceId(null)
    setDetail(null)
    await loadWorkspaces()
  }

  const deleteWorkspace = async () => {
    if (!user || !selectedWorkspaceId) return
    const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}?userId=${user.id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.message || "Could not delete workspace")
      return
    }
    setSelectedWorkspaceId(null)
    setDetail(null)
    await loadWorkspaces()
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("workspaces")}</h1>
          <p className="mt-1 text-muted-foreground">Study rooms for team documents, AI work, tasks, quizzes, and discussion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <UserPlus className="h-4 w-4 text-primary" />
            Join
          </button>
          <button
            onClick={() => {
              setWorkspaceName("")
              setWorkspaceDescription("")
              setWorkspaceSubjectId("")
              setWorkspaceVisibility("PRIVATE")
              setIsCreateOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </button>
        </div>
      </motion.div>

      {(error || message) && (
        <motion.div
          variants={item}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {error || message}
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <motion.aside variants={item} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={workspaceSearch}
              onChange={(event) => setWorkspaceSearch(event.target.value)}
              placeholder="Search workspaces..."
              className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {isLoading ? (
            <LogoLoader compact label="AI Study Hub" sublabel="Loading workspaces..." className="rounded-xl border border-border/50 bg-secondary/20" />
          ) : filteredWorkspaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-8 text-center">
              <UsersRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">No workspaces yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create one or join with a code.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    setSelectedWorkspaceId(workspace.id)
                    setActiveTab("overview")
                  }}
                  className={`glass-card w-full rounded-xl p-4 text-left transition-all ${
                    selectedWorkspace?.id === workspace.id ? "border-primary/40 bg-primary/10" : "hover:border-primary/30"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <UsersRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
                        {workspace.visibility === "PUBLIC" ? (
                          <Globe2 className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{workspace.subjectName || "No subject"}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{workspace.memberCount} members</span>
                        <span>{workspace.documentCount} docs</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.aside>

        <motion.main variants={item} className="min-w-0">
          {!selectedWorkspace ? (
            <div className="glass-card rounded-xl px-6 py-20 text-center">
              <UsersRound className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">Choose a workspace</p>
              <p className="mt-1 text-sm text-muted-foreground">Team documents, tasks, AI outputs, and discussion will appear here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <section className="glass-card rounded-xl p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <UsersRound className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-foreground">{selectedWorkspace.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>Owner: {selectedWorkspace.ownerName}</span>
                          <span className="rounded-md bg-secondary/70 px-2 py-0.5 text-xs">{selectedWorkspace.subjectName || "No subject"}</span>
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${statusTone(selectedWorkspace.visibility === "PUBLIC" ? "PROCESSED" : "TODO")}`}>
                            {selectedWorkspace.visibility === "PUBLIC" ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {selectedWorkspace.visibility}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedWorkspace.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{selectedWorkspace.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copyText(selectedWorkspace.inviteCode, "Workspace code copied")}
                      className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      <Clipboard className="h-4 w-4 text-primary" />
                      {selectedWorkspace.inviteCode}
                    </button>
                    <button
                      onClick={() => setActiveTab("members")}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <MetricCard label="Members" value={selectedWorkspace.memberCount} />
                  <MetricCard label="Documents" value={selectedWorkspace.documentCount} />
                  <MetricCard label="Tasks" value={detail?.tasks.length || 0} />
                  <MetricCard label="Discussions" value={detail?.posts.length || selectedWorkspace.messageCount} />
                </div>
              </section>

              <div className="flex gap-2 overflow-x-auto rounded-xl border border-border/50 bg-secondary/30 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {isDetailLoading && !detail ? (
                <LogoLoader compact label="AI Study Hub" sublabel="Loading workspace..." className="rounded-xl border border-border/50 bg-secondary/20" />
              ) : (
                <>
                  {activeTab === "overview" && (
                    <OverviewTab detail={detail} topContributors={topContributors} tasksByStatus={tasksByStatus} setActiveTab={setActiveTab} />
                  )}
                  {activeTab === "documents" && (
                    <section className="space-y-4">
                      <div
                        {...getRootProps()}
                        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                          isDragActive
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
                        } ${!canContribute ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                            <Upload className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {canContribute ? (isDragActive ? "Drop files here" : "Upload workspace documents") : "Viewer role can only read documents"}
                          </p>
                          <p className="text-xs text-muted-foreground">PDF, Word, and PowerPoint</p>
                        </div>
                        <AnimatePresence>
                          {uploadProgress !== null && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <div className="flex flex-col items-center gap-3">
                                {uploadProgress < 100 ? (
                                  <>
                                    <div className="h-2 w-48 overflow-hidden rounded-full bg-secondary">
                                      <motion.div className="h-full bg-primary" animate={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <p className="text-sm text-foreground">{uploadLabel}</p>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 text-accent">
                                    <Check className="h-4 w-4" />
                                    <span className="text-sm font-medium">{uploadLabel}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="glass-card rounded-xl p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              value={documentSearch}
                              onChange={(event) => setDocumentSearch(event.target.value)}
                              placeholder="Search files, subjects, owners..."
                              className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <select
                            value={documentStatus}
                            onChange={(event) => setDocumentStatus(event.target.value)}
                            className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
                          >
                            <option value="ALL">All statuses</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="PROCESSED">Processed</option>
                            <option value="ERROR">Error</option>
                          </select>
                          <select
                            value={documentSubject}
                            onChange={(event) => setDocumentSubject(event.target.value)}
                            className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
                          >
                            {documentSubjectOptions.map((subject) => (
                              <option key={subject} value={subject}>{subject === "ALL" ? "All subjects" : subject}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {filteredDocuments.map((document) => (
                          <DocumentRow key={document.id} document={document} onView={() => router.push(`/documents/${document.id}/view`)} />
                        ))}
                        {filteredDocuments.length === 0 && <EmptyState icon={<FileText />} title="No documents found" subtitle="Upload a file or adjust your filters." />}
                      </div>
                    </section>
                  )}

                  {activeTab === "ai" && (
                    <section className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                      <div className="glass-card rounded-xl p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Workspace AI</h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Action</label>
                            <select value={aiType} onChange={(event) => setAiType(event.target.value)} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
                              <option value="CHAT">Ask AI</option>
                              <option value="SUMMARY">Summarize document</option>
                              <option value="QUIZ">Create quiz</option>
                              <option value="FLASHCARD">Create flashcards</option>
                              <option value="REVIEW_QUESTIONS">Create review questions</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Document context</label>
                            <select value={aiDocumentId} onChange={(event) => setAiDocumentId(event.target.value)} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
                              <option value="">Whole workspace</option>
                              {(detail?.documents || []).map((document) => (
                                <option key={document.id} value={document.id}>{document.title || document.originalFileName}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Prompt</label>
                            <textarea
                              value={aiQuestion}
                              onChange={(event) => setAiQuestion(event.target.value)}
                              rows={5}
                              placeholder="Ask a question or add instructions..."
                              className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <button
                            onClick={runAi}
                            disabled={isAiRunning}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                          >
                            {isAiRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                            Run AI
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(detail?.aiOutputs || []).map((output) => (
                          <AiOutputCard key={output.id} output={output} />
                        ))}
                        {(detail?.aiOutputs || []).length === 0 && <EmptyState icon={<Bot />} title="No AI outputs yet" subtitle="Ask AI, summarize a document, or generate quiz and flashcards." />}
                      </div>
                    </section>
                  )}

                  {activeTab === "tasks" && (
                    <section className="space-y-5">
                      <form onSubmit={createTask} className="glass-card rounded-xl p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <ListChecks className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Create task</h3>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[1fr_220px_210px_auto]">
                          <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
                          <select value={taskAssignedTo} onChange={(event) => setTaskAssignedTo(event.target.value)} className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
                            <option value="">Unassigned</option>
                            {(detail?.members || []).map((member) => <option key={member.userId} value={member.userId}>{member.fullName}</option>)}
                          </select>
                          <input type="datetime-local" value={taskDeadline} onChange={(event) => setTaskDeadline(event.target.value)} className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
                          <button disabled={!canContribute || isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                            <Plus className="h-4 w-4" /> Add
                          </button>
                        </div>
                        <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} rows={2} placeholder="Description" className="mt-3 w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
                      </form>
                      <div className="grid gap-4 lg:grid-cols-3">
                        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => (
                          <div key={status} className="glass-card rounded-xl p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="font-semibold text-foreground">{normalizeTaskLabel(status)}</h3>
                              <span className="rounded-md bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">{tasksByStatus[status].length}</span>
                            </div>
                            <div className="space-y-3">
                              {tasksByStatus[status].map((task) => (
                                <TaskCard key={task.id} task={task} canContribute={canContribute} onStatusChange={(nextStatus) => updateTaskStatus(task, nextStatus)} />
                              ))}
                              {tasksByStatus[status].length === 0 && <p className="rounded-lg border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">No tasks</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {activeTab === "discussion" && (
                    <section className="space-y-5">
                      <form onSubmit={createPost} className="glass-card rounded-xl p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">New discussion</h3>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
                          <input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="Post title" className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
                          <select value={postDocumentId} onChange={(event) => setPostDocumentId(event.target.value)} className="rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
                            <option value="">No attachment</option>
                            {(detail?.documents || []).map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
                          </select>
                          <label className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 text-sm text-foreground">
                            <input type="checkbox" checked={postPinned} disabled={!canManageWorkspace} onChange={(event) => setPostPinned(event.target.checked)} />
                            Pin
                          </label>
                        </div>
                        <textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} rows={4} placeholder="Write details, questions, or notes..." className="mt-3 w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50" />
                        <div className="mt-3 flex justify-end">
                          <button disabled={!canContribute || isSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                            <Send className="h-4 w-4" /> Post
                          </button>
                        </div>
                      </form>
                      <div className="space-y-4">
                        {(detail?.posts || []).map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            canManageWorkspace={canManageWorkspace}
                            canContribute={canContribute}
                            comment={commentByPost[post.id] || ""}
                            onCommentChange={(value) => setCommentByPost((current) => ({ ...current, [post.id]: value }))}
                            onSendComment={() => createComment(post.id)}
                            onSetPinned={(pinned) => setPinned(post.id, pinned)}
                          />
                        ))}
                        {(detail?.posts || []).length === 0 && <EmptyState icon={<MessageSquare />} title="No discussion yet" subtitle="Create the first post for this workspace." />}
                      </div>
                    </section>
                  )}

                  {activeTab === "quiz" && (
                    <section className="space-y-4">
                      {(detail?.quizzes || []).map((quiz) => (
                        <div key={quiz.id} className="glass-card rounded-xl p-5">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Created by {quiz.createdByName} | {formatDate(quiz.createdAt)} | {quiz.attemptCount} attempts
                              </p>
                              {quiz.documentTitle && <p className="mt-1 text-xs text-primary">From {quiz.documentTitle}</p>}
                            </div>
                            <div className="rounded-xl border border-border/50 bg-secondary/25 px-3 py-2 text-sm">
                              Best score: <span className="font-semibold text-foreground">{quiz.bestScore ?? "--"}</span>
                            </div>
                          </div>
                          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-secondary/25 p-4 text-sm leading-6 text-muted-foreground">{quiz.questionsJson}</pre>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <input
                              value={quizScores[quiz.id] || ""}
                              onChange={(event) => setQuizScores((current) => ({ ...current, [quiz.id]: event.target.value }))}
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Score 0-100"
                              className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
                            />
                            <button onClick={() => completeQuiz(quiz.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                              <Check className="h-4 w-4" /> Save result
                            </button>
                          </div>
                        </div>
                      ))}
                      {(detail?.quizzes || []).length === 0 && <EmptyState icon={<Trophy />} title="No group quizzes yet" subtitle="Use the AI tab to create a quiz from workspace documents." />}
                    </section>
                  )}

                  {activeTab === "flashcards" && (
                    <section className="space-y-4">
                      {(detail?.flashcardSets || []).map((set) => (
                        <div key={set.id} className="glass-card rounded-xl p-5">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{set.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Created by {set.createdByName} | {formatDate(set.createdAt)}
                              </p>
                              {set.documentTitle && <p className="mt-1 text-xs text-primary">From {set.documentTitle}</p>}
                            </div>
                            <div className="rounded-xl border border-border/50 bg-secondary/25 px-3 py-2 text-sm">
                              Progress: <span className="font-semibold text-foreground">{set.reviewedCount}/{set.totalCount}</span>
                            </div>
                          </div>
                          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-secondary/25 p-4 text-sm leading-6 text-muted-foreground">{set.cardsJson}</pre>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <input
                              value={flashcardProgress[set.id] ?? String(set.reviewedCount)}
                              onChange={(event) => setFlashcardProgress((current) => ({ ...current, [set.id]: event.target.value }))}
                              type="number"
                              min="0"
                              max={Math.max(set.totalCount, 1)}
                              className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
                            />
                            <button onClick={() => updateFlashcardProgress(set)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                              <Check className="h-4 w-4" /> Update progress
                            </button>
                          </div>
                        </div>
                      ))}
                      {(detail?.flashcardSets || []).length === 0 && <EmptyState icon={<Tags />} title="No flashcard sets yet" subtitle="Use the AI tab to generate a shared flashcard set." />}
                    </section>
                  )}

                  {activeTab === "members" && (
                    <section className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                      <div className="space-y-5">
                        <div className="glass-card rounded-xl p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-foreground">Invite member</h3>
                          </div>
                          <div className="space-y-3">
                            <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Email address, or leave empty for link" className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
                            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                            <button disabled={!canManageWorkspace || isSaving} onClick={inviteMember} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              Send invite
                            </button>
                          </div>
                        </div>
                        <div className="glass-card rounded-xl p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <Clipboard className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-foreground">Invite links</h3>
                          </div>
                          <div className="space-y-2">
                            {(detail?.invitations || []).slice(0, 5).map((invitation) => (
                              <div key={invitation.id} className="rounded-xl border border-border/50 bg-secondary/25 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{invitation.invitedEmail || "Shareable link"}</p>
                                    <p className="text-xs text-muted-foreground">{invitation.role} | {invitation.status}</p>
                                  </div>
                                  <button onClick={() => copyText(invitation.inviteUrl, "Invite link copied")} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {(detail?.invitations || []).length === 0 && <p className="text-sm text-muted-foreground">No invitations yet.</p>}
                          </div>
                        </div>
                      </div>
                      <div className="glass-card rounded-xl p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <UsersRound className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Members</h3>
                        </div>
                        <div className="space-y-3">
                          {(detail?.members || []).map((member) => (
                            <div key={member.userId} className="flex flex-col gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3 md:flex-row md:items-center">
                              <Avatar name={member.fullName} src={member.avatarUrl} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{member.fullName}</p>
                                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{member.uploadedDocuments} uploads | {member.messageCount} actions | {member.contributionScore} pts</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {canManageWorkspace && member.role !== "OWNER" && String(member.userId) !== user?.id ? (
                                  <select value={member.role} onChange={(event) => updateMemberRole(member.userId, event.target.value)} className="rounded-lg border border-border/50 bg-background px-2 py-1.5 text-xs text-foreground">
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="MEMBER">MEMBER</option>
                                    <option value="VIEWER">VIEWER</option>
                                  </select>
                                ) : (
                                  <span className={`rounded-md border px-2 py-1 text-xs ${roleTone(member.role)}`}>{member.role}</span>
                                )}
                                {canManageWorkspace && member.role !== "OWNER" && String(member.userId) !== user?.id && (
                                  <button onClick={() => removeMember(member.userId)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {activeTab === "activity" && (
                    <section className="glass-card rounded-xl p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Recent activity</h3>
                      </div>
                      <div className="space-y-3">
                        {(detail?.activities || []).map((activity) => (
                          <div key={activity.id} className="flex gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
                            <Avatar name={activity.userName || "System"} src={activity.userAvatarUrl} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground">
                                <span className="font-medium">{activity.userName || "System"}</span> {activity.description}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">{activity.activityType} | {formatDate(activity.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                        {(detail?.activities || []).length === 0 && <EmptyState icon={<Activity />} title="No activity yet" subtitle="Uploads, tasks, comments, and AI events will appear here." />}
                      </div>
                    </section>
                  )}

                  {activeTab === "settings" && (
                    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="glass-card rounded-xl p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Workspace settings</h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Name</label>
                            <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} disabled={!canManageWorkspace} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60" />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                            <textarea value={workspaceDescription} onChange={(event) => setWorkspaceDescription(event.target.value)} disabled={!canManageWorkspace} rows={4} className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60" />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">Related subject</label>
                              <select value={workspaceSubjectId} onChange={(event) => setWorkspaceSubjectId(event.target.value)} disabled={!canManageWorkspace} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60">
                                <option value="">No subject</option>
                                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">Visibility</label>
                              <select value={workspaceVisibility} onChange={(event) => setWorkspaceVisibility(event.target.value)} disabled={!canManageWorkspace} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 disabled:opacity-60">
                                <option value="PRIVATE">Private</option>
                                <option value="PUBLIC">Public</option>
                              </select>
                            </div>
                          </div>
                          <button onClick={saveSettings} disabled={!canManageWorkspace || isSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save settings
                          </button>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="glass-card rounded-xl p-5">
                          <div className="mb-3 flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            <h3 className="font-semibold">Danger zone</h3>
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Members can leave this workspace. Only the owner can delete it.
                          </p>
                          <div className="mt-4 space-y-2">
                            <button onClick={leaveWorkspace} disabled={isOwner} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                              Leave workspace
                            </button>
                            <button onClick={deleteWorkspace} disabled={!isOwner} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50">
                              <Trash2 className="h-4 w-4" /> Delete workspace
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </motion.main>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <WorkspaceModal
            title="New Workspace"
            icon={<Plus className="h-5 w-5" />}
            onClose={() => setIsCreateOpen(false)}
            footer={
              <>
                <button onClick={() => setIsCreateOpen(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{t("cancel")}</button>
                <button onClick={createWorkspace} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create
                </button>
              </>
            }
          >
            <WorkspaceForm
              subjects={subjects}
              name={workspaceName}
              description={workspaceDescription}
              subjectId={workspaceSubjectId}
              visibility={workspaceVisibility}
              setName={setWorkspaceName}
              setDescription={setWorkspaceDescription}
              setSubjectId={setWorkspaceSubjectId}
              setVisibility={setWorkspaceVisibility}
            />
          </WorkspaceModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isJoinOpen && (
          <WorkspaceModal
            title="Join Workspace"
            icon={<Clipboard className="h-5 w-5" />}
            onClose={() => setIsJoinOpen(false)}
            footer={
              <>
                <button onClick={() => setIsJoinOpen(false)} className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{t("cancel")}</button>
                <button onClick={joinWorkspace} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Join
                </button>
              </>
            }
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Workspace Code or Invite Token</label>
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="WSABC123 or invite token" className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30" />
            </div>
          </WorkspaceModal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function OverviewTab({
  detail,
  topContributors,
  tasksByStatus,
  setActiveTab,
}: {
  detail: WorkspaceDetailDto | null
  topContributors: WorkspaceMemberDto[]
  tasksByStatus: Record<"TODO" | "IN_PROGRESS" | "DONE", WorkspaceTaskDto[]>
  setActiveTab: (tab: WorkspaceTab) => void
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <button onClick={() => setActiveTab("documents")} className="glass-card rounded-xl p-4 text-left hover:border-primary/30">
            <FileText className="mb-3 h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Documents</p>
            <p className="mt-1 text-sm text-muted-foreground">{detail?.documents.length || 0} files in this workspace</p>
          </button>
          <button onClick={() => setActiveTab("tasks")} className="glass-card rounded-xl p-4 text-left hover:border-primary/30">
            <ListChecks className="mb-3 h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Open tasks</p>
            <p className="mt-1 text-sm text-muted-foreground">{tasksByStatus.TODO.length + tasksByStatus.IN_PROGRESS.length} active items</p>
          </button>
          <button onClick={() => setActiveTab("ai")} className="glass-card rounded-xl p-4 text-left hover:border-primary/30">
            <Bot className="mb-3 h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">AI outputs</p>
            <p className="mt-1 text-sm text-muted-foreground">{detail?.aiOutputs.length || 0} generated notes</p>
          </button>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Latest activity</h3>
          </div>
          <div className="space-y-3">
            {(detail?.activities || []).slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
                <Avatar name={activity.userName || "System"} src={activity.userAvatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground"><span className="font-medium">{activity.userName || "System"}</span> {activity.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            ))}
            {(detail?.activities || []).length === 0 && <p className="rounded-xl border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Top contributors</h3>
        </div>
        <div className="space-y-3">
          {topContributors.map((member, index) => (
            <div key={member.userId} className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
              <Avatar name={member.fullName} src={member.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{member.fullName}</p>
                  {index === 0 && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Top</span>}
                </div>
                <p className="text-xs text-muted-foreground">{member.uploadedDocuments} uploads | {member.messageCount} actions</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{member.contributionScore}</span>
            </div>
          ))}
          {topContributors.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
        </div>
      </div>
    </section>
  )
}

function DocumentRow({ document, onView }: { document: WorkspaceDocumentDto; onView: () => void }) {
  return (
    <button onClick={onView} className="glass-card rounded-xl p-4 text-left transition-all hover:border-primary/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{document.title || document.originalFileName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Uploaded by {document.addedByName}</span>
            <span>Owner {document.ownerName}</span>
            <span>{formatFileSize(document.fileSize)}</span>
            <span>{formatDate(document.addedAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-xs ${statusTone(document.processingStatus)}`}>{document.processingStatus}</span>
            <span className="rounded-md bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">{document.subjectName || "Uncategorized"}</span>
            {document.categoryName && <span className="rounded-md bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">{document.categoryName}</span>}
            {document.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{tag}</span>)}
          </div>
        </div>
      </div>
    </button>
  )
}

function TaskCard({ task, canContribute, onStatusChange }: { task: WorkspaceTaskDto; canContribute: boolean; onStatusChange: (status: string) => void }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/25 p-3">
      <p className="text-sm font-medium text-foreground">{task.title}</p>
      {task.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{task.description}</p>}
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>Assigned: {task.assignedToName || "Unassigned"}</p>
        <p>Deadline: {task.deadlineAt ? formatDate(task.deadlineAt) : "No deadline"}</p>
      </div>
      {canContribute && (
        <select value={task.status} onChange={(event) => onStatusChange(event.target.value)} className="mt-3 w-full rounded-lg border border-border/50 bg-background px-2 py-1.5 text-xs text-foreground">
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
      )}
    </div>
  )
}

function PostCard({
  post,
  canManageWorkspace,
  canContribute,
  comment,
  onCommentChange,
  onSendComment,
  onSetPinned,
}: {
  post: WorkspacePostDto
  canManageWorkspace: boolean
  canContribute: boolean
  comment: string
  onCommentChange: (value: string) => void
  onSendComment: () => void
  onSetPinned: (pinned: boolean) => void
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <Avatar name={post.authorName} src={post.authorAvatarUrl} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{post.title}</h3>
              {post.pinned && <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs text-primary"><Pin className="h-3 w-3" /> Pinned</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">By {post.authorName} | {formatDate(post.createdAt)}</p>
          </div>
        </div>
        {canManageWorkspace && (
          <button onClick={() => onSetPinned(!post.pinned)} className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground hover:bg-secondary">
            <Pin className="h-4 w-4 text-primary" />
            {post.pinned ? "Unpin" : "Pin"}
          </button>
        )}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{post.content}</p>
      {post.attachedDocumentTitle && <p className="mt-3 inline-flex rounded-md bg-secondary/70 px-2 py-1 text-xs text-muted-foreground">Attached: {post.attachedDocumentTitle}</p>}
      <div className="mt-5 space-y-3">
        {post.comments.map((reply) => (
          <div key={reply.id} className="flex gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
            <Avatar name={reply.userName} src={reply.userAvatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{reply.userName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{reply.content}</p>
            </div>
          </div>
        ))}
      </div>
      {canContribute && (
        <div className="mt-4 flex gap-2">
          <input value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <button onClick={onSendComment} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function AiOutputCard({ output }: { output: WorkspaceAiOutputDto }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{output.outputType}</span>
            {output.documentTitle && <span className="rounded-md bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">{output.documentTitle}</span>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Generated by {output.requestedByName} | {formatDate(output.createdAt)}</p>
        </div>
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-secondary/25 p-4 text-sm leading-6 text-muted-foreground">{output.resultText}</pre>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function Avatar({ name, src }: { name?: string | null; src?: string | null }) {
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-xs font-semibold text-primary">
      {src ? <img src={src} alt={name || "User"} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  )
}

function WorkspaceForm({
  subjects,
  name,
  description,
  subjectId,
  visibility,
  setName,
  setDescription,
  setSubjectId,
  setVisibility,
}: {
  subjects: SubjectDto[]
  name: string
  description: string
  subjectId: string
  visibility: string
  setName: (value: string) => void
  setDescription: (value: string) => void
  setSubjectId: (value: string) => void
  setVisibility: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Group name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="SE1847 Study Group" className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Lectures, project notes, and exam materials." className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Related subject</label>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-foreground outline-none focus:border-primary/50">
            <option value="">No subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Visibility</label>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-foreground outline-none focus:border-primary/50">
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function WorkspaceModal({
  title,
  icon,
  children,
  footer,
  onClose,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="glass-card w-full max-w-lg rounded-xl p-6" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">{footer}</div>
      </motion.div>
    </motion.div>
  )
}
