"use client"

import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  Presentation,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

interface DocumentDto {
  id: number
  ownerId: number
  ownerName: string
  subjectName?: string | null
  title: string
  description?: string | null
  originalFileName: string
  fileType?: string | null
  fileSize?: number | null
  visibility: string
  createdAt: string
}

interface DocumentPreviewDto {
  previewType: string
  content: string
  message?: string | null
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

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || ""
}

function getPreviewKind(document: DocumentDto) {
  const type = (document.fileType || "").toLowerCase()
  const extension = getExtension(document.originalFileName)

  if (type.includes("pdf") || extension === "pdf") return "pdf"
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "image"
  if (type.startsWith("text/") || ["txt", "md", "csv"].includes(extension)) return "text"
  if (["doc", "docx"].includes(extension)) return "word"
  if (["ppt", "pptx"].includes(extension)) return "slides"
  return "unsupported"
}

export default function DocumentViewerPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [document, setDocument] = useState<DocumentDto | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [textPreview, setTextPreview] = useState("")
  const [previewMessage, setPreviewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const apiUrl = getApiUrl()
  const documentId = params.id

  const fileEndpoint = useMemo(() => {
    const userParam = user ? `?userId=${user.id}` : ""
    return `${apiUrl}/api/documents/${documentId}/file${userParam}`
  }, [apiUrl, documentId, user])

  const downloadEndpoint = useMemo(() => {
    const userParam = user ? `?userId=${user.id}&download=true` : "?download=true"
    return `${apiUrl}/api/documents/${documentId}/file${userParam}`
  }, [apiUrl, documentId, user])

  useEffect(() => {
    if (!user) return

    const currentUser = user
    let objectUrl = ""
    let cancelled = false

    async function loadDocument() {
      setIsLoading(true)
      setError("")

      try {
        setPreviewUrl("")
        setTextPreview("")
        setPreviewMessage("")

        const metadataResponse = await fetch(`${apiUrl}/api/documents/${documentId}?userId=${currentUser.id}`)
        if (!metadataResponse.ok) {
          throw new Error("Document was not found or you do not have access.")
        }

        const metadata = await metadataResponse.json() as DocumentDto
        if (cancelled) return

        setDocument(metadata)
        const kind = getPreviewKind(metadata)

        if (kind === "pdf" || kind === "image" || kind === "text") {
          const fileResponse = await fetch(fileEndpoint)
          if (!fileResponse.ok) {
            throw new Error("Could not load this file preview.")
          }

          const blob = await fileResponse.blob()
          if (cancelled) return

          if (kind === "text") {
            setTextPreview(await blob.text())
          } else {
            objectUrl = URL.createObjectURL(blob)
            setPreviewUrl(objectUrl)
          }
        } else {
          const previewResponse = await fetch(`${apiUrl}/api/documents/${documentId}/preview?userId=${currentUser.id}`)
          if (!previewResponse.ok) {
            throw new Error("Could not build a readable preview for this file.")
          }

          const preview = await previewResponse.json() as DocumentPreviewDto
          if (cancelled) return

          setTextPreview(preview.content)
          setPreviewMessage(preview.message || "Extracted preview")
        }
      } catch (err) {
        if (!cancelled) {
          setError(getNetworkErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [apiUrl, documentId, fileEndpoint, user])

  const previewKind = document ? getPreviewKind(document) : "unsupported"

  const downloadDocument = () => {
    window.open(downloadEndpoint, "_blank")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => router.push("/documents")}
            className="mt-1 rounded-xl border border-border/50 bg-secondary/40 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Document Viewer</p>
            <h1 className="truncate text-2xl font-bold text-foreground md:text-3xl">
              {document?.title || "Loading document"}
            </h1>
            {document && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{document.originalFileName}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{formatFileSize(document.fileSize)}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{document.subjectName || "Uncategorized"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {document && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {document.visibility}
            </span>
          )}
          <button
            onClick={downloadDocument}
            disabled={!document}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[70vh] overflow-hidden rounded-xl border border-border/50 bg-secondary/20"
      >
        {isLoading ? (
          <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading preview...
          </div>
        ) : document && previewKind === "pdf" && previewUrl ? (
          <iframe
            src={previewUrl}
            title={document.title}
            className="h-[75vh] w-full bg-background"
          />
        ) : document && previewKind === "image" && previewUrl ? (
          <div className="flex min-h-[70vh] items-center justify-center p-6">
            <img src={previewUrl} alt={document.title} className="max-h-[72vh] max-w-full rounded-lg object-contain shadow-2xl" />
          </div>
        ) : document && (previewKind === "text" || textPreview) ? (
          <div className="min-h-[70vh] bg-background/70">
            {previewMessage && (
              <div className="border-b border-border/50 bg-secondary/30 px-5 py-3 text-sm text-muted-foreground">
                {previewMessage}
              </div>
            )}
            <pre className="min-h-[70vh] overflow-auto whitespace-pre-wrap p-6 text-sm leading-6 text-foreground">
              {textPreview}
            </pre>
          </div>
        ) : document ? (
          <div className="flex min-h-[70vh] items-center justify-center p-6">
            <div className="max-w-xl text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                {previewKind === "slides" ? (
                  <Presentation className="h-10 w-10" />
                ) : previewKind === "word" ? (
                  <FileText className="h-10 w-10" />
                ) : (
                  <FileArchive className="h-10 w-10" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground">Preview is not available for this file type</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Word and PowerPoint files cannot be rendered directly by the browser yet. The file is stored safely in Supabase and can be downloaded from here.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={downloadDocument}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Download className="h-4 w-4" />
                  Download file
                </button>
                <a
                  href="/documents"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  Back to documents
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">
            <FileImage className="mr-2 h-5 w-5" />
            No preview available
          </div>
        )}
      </motion.div>
    </div>
  )
}
