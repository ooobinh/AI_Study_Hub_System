"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback } from "react"
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
  Folder,
  Clock,
  Tag,
  X,
  Check
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const subjects = ["All", "Computer Science", "Mathematics", "Chemistry", "Physics", "Psychology", "Biology"]

const documents = [
  { id: 1, name: "Machine Learning Notes.pdf", subject: "Computer Science", date: "2 hours ago", pages: 24, size: "2.4 MB", isFavorite: true },
  { id: 2, name: "Organic Chemistry Ch.5.pdf", subject: "Chemistry", date: "5 hours ago", pages: 18, size: "1.8 MB", isFavorite: false },
  { id: 3, name: "Linear Algebra Review.pdf", subject: "Mathematics", date: "Yesterday", pages: 32, size: "3.2 MB", isFavorite: true },
  { id: 4, name: "Quantum Physics Intro.pdf", subject: "Physics", date: "2 days ago", pages: 28, size: "2.8 MB", isFavorite: false },
  { id: 5, name: "Psychology Lecture Notes.pdf", subject: "Psychology", date: "3 days ago", pages: 15, size: "1.5 MB", isFavorite: false },
  { id: 6, name: "Calculus II Formulas.pdf", subject: "Mathematics", date: "4 days ago", pages: 12, size: "1.1 MB", isFavorite: true },
  { id: 7, name: "Data Structures.pdf", subject: "Computer Science", date: "5 days ago", pages: 45, size: "4.2 MB", isFavorite: false },
  { id: 8, name: "Molecular Biology.pdf", subject: "Biology", date: "1 week ago", pages: 36, size: "3.6 MB", isFavorite: false },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedSubject, setSelectedSubject] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<number[]>(documents.filter(d => d.isFavorite).map(d => d.id))

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setUploadProgress(null), 1000)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] }
  })

  const filteredDocuments = documents.filter(doc => {
    const matchesSubject = selectedSubject === "All" || doc.subject === selectedSubject
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSubject && matchesSearch
  })

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your study materials</p>
        </div>
      </motion.div>

      {/* Upload Area */}
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
                {isDragActive ? "Drop your files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse (PDF files only)
              </p>
            </div>
          </motion.div>

          {/* Upload Progress */}
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
                      <p className="text-sm text-foreground">Uploading... {uploadProgress}%</p>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 text-accent"
                    >
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Upload Complete!</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Subject Filter */}
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

        {/* View Toggle */}
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

      {/* Documents Grid/List */}
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
            className={`glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group ${
              viewMode === "list" ? "p-4" : "p-4"
            }`}
            whileHover={{ y: -4 }}
          >
            {viewMode === "grid" ? (
              <div className="space-y-3">
                {/* Preview */}
                <div className="aspect-[4/3] rounded-lg bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                  <FileText className="w-12 h-12 text-muted-foreground/50" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2"
                  >
                    <motion.button
                      className="p-2 rounded-lg bg-secondary/80 text-foreground"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      className="p-2 rounded-lg bg-secondary/80 text-foreground"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id) }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(doc.id) ? "text-chart-4 fill-chart-4" : "text-muted-foreground"}`} />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs">
                      {doc.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doc.date}
                    </span>
                    <span>{doc.pages} pages</span>
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
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs">
                      {doc.subject}
                    </span>
                    <span className="text-xs text-muted-foreground">{doc.pages} pages</span>
                    <span className="text-xs text-muted-foreground">{doc.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden md:block">{doc.date}</span>
                  <motion.button
                    onClick={() => toggleFavorite(doc.id)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(doc.id) ? "text-chart-4 fill-chart-4" : "text-muted-foreground"}`} />
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
                      <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                        <Download className="w-4 h-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                        <Share2 className="w-4 h-4" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                        <Tag className="w-4 h-4" /> Add Tag
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2">
                        <X className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
