"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  FolderOpen,
  Hash,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { LogoLoader } from "@/components/layout/logo-loader"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

interface SubjectDto {
  id: number
  code: string
  name: string
  description?: string | null
  documentCount: number
  createdAt: string
}

interface DocumentDto {
  id: number
  ownerId: number
  title: string
  originalFileName: string
  subjectId?: number | null
  subjectName?: string | null
  fileSize?: number | null
  visibility: string
  createdAt: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return "Unknown size"
  }

  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export default function SubjectsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [subjects, setSubjects] = useState<SubjectDto[]>([])
  const [documents, setDocuments] = useState<DocumentDto[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [subjectName, setSubjectName] = useState("")
  const [subjectCode, setSubjectCode] = useState("")
  const [subjectDescription, setSubjectDescription] = useState("")
  const [isSavingSubject, setIsSavingSubject] = useState(false)
  const [assigningDocumentId, setAssigningDocumentId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    if (!user) {
      return
    }

    setIsLoading(true)
    setError("")
    try {
      const [subjectsResponse, documentsResponse] = await Promise.all([
        fetch(`${getApiUrl()}/api/subjects?userId=${user.id}`),
        fetch(`${getApiUrl()}/api/documents?userId=${user.id}`),
      ])

      if (!subjectsResponse.ok) {
        const body = await subjectsResponse.json().catch(() => null)
        throw new Error(body?.message || "Could not load subjects")
      }
      if (!documentsResponse.ok) {
        const body = await documentsResponse.json().catch(() => null)
        throw new Error(body?.message || t("couldNotLoadDocuments"))
      }

      const subjectsData = await subjectsResponse.json() as SubjectDto[]
      const documentsData = await documentsResponse.json() as DocumentDto[]
      setSubjects(subjectsData)
      setDocuments(documentsData)
      setSelectedSubjectId((current) => current ?? subjectsData[0]?.id ?? null)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [t, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredSubjects = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) {
      return subjects
    }
    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(keyword) ||
      subject.code.toLowerCase().includes(keyword) ||
      (subject.description || "").toLowerCase().includes(keyword)
    )
  }, [searchQuery, subjects])

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) || filteredSubjects[0] || null,
    [filteredSubjects, selectedSubjectId, subjects]
  )

  const selectedDocuments = useMemo(() => {
    if (!selectedSubject) {
      return []
    }
    return documents.filter((doc) => doc.subjectId === selectedSubject.id)
  }, [documents, selectedSubject])

  const assignableDocuments = useMemo(() => {
    if (!selectedSubject || !user) {
      return []
    }
    return documents.filter((doc) => {
      const canManage = user.roles.includes("ADMIN") || String(doc.ownerId) === user.id
      return canManage && doc.subjectId !== selectedSubject.id
    })
  }, [documents, selectedSubject, user])

  const createSubject = async () => {
    if (!user || !subjectName.trim()) {
      setError("Subject name is required")
      return
    }

    setIsSavingSubject(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`${getApiUrl()}/api/subjects?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectCode: subjectCode.trim() || null,
          subjectName: subjectName.trim(),
          description: subjectDescription.trim() || null,
        }),
      })

      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not create subject")
      }

      const created = body as SubjectDto
      setSubjects((current) => [created, ...current.filter((subject) => subject.id !== created.id)])
      setSelectedSubjectId(created.id)
      setSubjectName("")
      setSubjectCode("")
      setSubjectDescription("")
      setIsCreateOpen(false)
      setMessage("Subject created")
      setTimeout(() => setMessage(""), 1400)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSavingSubject(false)
    }
  }

  const assignDocument = async (document: DocumentDto) => {
    if (!user || !selectedSubject) {
      return
    }

    setAssigningDocumentId(document.id)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`${getApiUrl()}/api/documents/${document.id}?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject.id }),
      })

      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not add document to subject")
      }

      const updated = body as DocumentDto
      setDocuments((current) => current.map((doc) => doc.id === updated.id ? updated : doc))
      setSubjects((current) => current.map((subject) => {
        if (subject.id === selectedSubject.id) {
          return { ...subject, documentCount: subject.documentCount + 1 }
        }
        if (document.subjectId && subject.id === document.subjectId) {
          return { ...subject, documentCount: Math.max(0, subject.documentCount - 1) }
        }
        return subject
      }))
      setMessage("Document added to subject")
      setTimeout(() => setMessage(""), 1400)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setAssigningDocumentId(null)
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("subjects")}</h1>
          <p className="mt-1 text-muted-foreground">Create study subjects and organize your uploaded documents.</p>
        </div>
        <motion.button
          onClick={() => setIsCreateOpen(true)}
          className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          New Subject
        </motion.button>
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

      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search subjects..."
          className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
        />
      </motion.div>

      {isLoading ? (
        <LogoLoader compact label="AI Study Hub" sublabel="Loading subjects..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <motion.div variants={item} className="space-y-3">
            {filteredSubjects.map((subject) => (
              <motion.button
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={`glass-card w-full rounded-xl p-4 text-left transition-all ${
                  selectedSubject?.id === subject.id ? "border-primary/40 bg-primary/10" : "hover:border-primary/30"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{subject.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary/70 px-2 py-0.5">
                        <Hash className="h-3 w-3" />
                        {subject.code}
                      </span>
                      <span>{subject.documentCount} documents</span>
                    </div>
                    {subject.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{subject.description}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}

            {filteredSubjects.length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
                No subjects found.
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="glass-card rounded-xl p-5">
            {selectedSubject ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <FolderOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{selectedSubject.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedSubject.code} - Created {formatDate(selectedSubject.createdAt)}
                        </p>
                      </div>
                    </div>
                    {selectedSubject.description && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedSubject.description}</p>
                    )}
                  </div>
                  <motion.button
                    onClick={() => setIsAddOpen(true)}
                    className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    Add Document
                  </motion.button>
                </div>

                <div className="space-y-3">
                  {selectedDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      className="flex cursor-pointer items-center gap-4 rounded-xl border border-border/50 bg-secondary/25 p-4 transition-colors hover:bg-secondary/45"
                      onClick={() => router.push(`/documents/${doc.id}/view`)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{doc.title || doc.originalFileName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>{doc.visibility}</span>
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  ))}

                  {selectedDocuments.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-12 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="font-medium text-foreground">No documents in this subject yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">Add uploaded documents to keep this subject organized.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">Create a subject to get started.</div>
            )}
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div
              className="glass-card w-full max-w-lg rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">New Subject</h2>
                  <p className="text-sm text-muted-foreground">Create a subject to group your learning files.</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Subject Name</label>
                  <input
                    value={subjectName}
                    onChange={(event) => setSubjectName(event.target.value)}
                    placeholder="Data Structures and Algorithms"
                    className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Code</label>
                  <input
                    value={subjectCode}
                    onChange={(event) => setSubjectCode(event.target.value)}
                    placeholder="CSD201"
                    className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                  <textarea
                    value={subjectDescription}
                    onChange={(event) => setSubjectDescription(event.target.value)}
                    rows={3}
                    placeholder="Notes, lectures, assignments, and reference material."
                    className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={createSubject}
                  disabled={isSavingSubject}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create Subject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddOpen && selectedSubject && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddOpen(false)}
          >
            <motion.div
              className="glass-card w-full max-w-2xl rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add Document</h2>
                  <p className="text-sm text-muted-foreground">Choose one of your uploaded documents for {selectedSubject.name}.</p>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {assignableDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{doc.title || doc.originalFileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.subjectName || t("uncategorized")}</p>
                    </div>
                    <button
                      onClick={() => assignDocument(doc)}
                      disabled={assigningDocumentId === doc.id}
                      className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {assigningDocumentId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add
                    </button>
                  </div>
                ))}

                {assignableDocuments.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/60 px-6 py-10 text-center text-sm text-muted-foreground">
                    No available documents to add. Upload a document first or choose another subject.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
