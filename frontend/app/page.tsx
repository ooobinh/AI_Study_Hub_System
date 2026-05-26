"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  FileSearch,
  FileText,
  Layers,
  ListChecks,
  MessageSquare,
  Sparkles,
  Tags,
  Upload,
  UsersRound,
} from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const modules = [
  {
    icon: <Upload className="h-5 w-5" />,
    title: "Upload real documents",
    text: "Store PDF, Word, and slide files, then keep them searchable by subject, owner, status, and tags.",
  },
  {
    icon: <Bot className="h-5 w-5" />,
    title: "Ask AI from your files",
    text: "Summarize documents, ask study questions, generate quizzes, and turn notes into flashcards.",
  },
  {
    icon: <UsersRound className="h-5 w-5" />,
    title: "Study in workspaces",
    text: "Invite classmates, assign tasks, discuss internally, and track who contributed to each group.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Share in the forum",
    text: "Post questions, answer other students, share public documents, and follow active learners.",
  },
]

const workflow = [
  { icon: <FileText className="h-5 w-5" />, title: "Collect", text: "Upload course material and organize it by subject." },
  { icon: <FileSearch className="h-5 w-5" />, title: "Understand", text: "Let AI read, rename, summarize, and classify documents." },
  { icon: <BrainCircuit className="h-5 w-5" />, title: "Practice", text: "Generate quizzes, flashcards, and review questions." },
  { icon: <UsersRound className="h-5 w-5" />, title: "Collaborate", text: "Work with your group in a private or public workspace." },
]

const stats = [
  ["Documents", "Smart library"],
  ["AI Assistant", "Context-aware answers"],
  ["Workspace", "Tasks and discussion"],
  ["Forum", "Public sharing"],
]

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -90])
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0.45])

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="bg-gradient-to-r from-primary via-accent to-chart-4 bg-clip-text text-sm font-black text-transparent">
                AI Study Hub
              </p>
              <p className="text-xs text-muted-foreground">Smart learning platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-transform hover:scale-[1.02] sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[88svh] overflow-hidden pt-16">
        <motion.div style={{ y: sceneY, opacity: sceneOpacity }} className="absolute inset-0">
          <LearningScene />
        </motion.div>
        <div className="absolute inset-0 bg-background/20" />
        <div className="relative z-10 mx-auto flex min-h-[calc(88svh-4rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Documents, AI, workspaces, and study practice in one place
            </motion.div>
            <motion.h1 variants={fadeUp} className="max-w-[11ch] text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-primary via-accent to-chart-4 bg-clip-text text-transparent">
                AI Study Hub
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              A modern study platform where students upload real documents, ask AI from their materials, work in private groups, and turn notes into quizzes and flashcards.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
              >
                Start learning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/70 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-secondary"
              >
                See how it works
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/50 bg-card/70 p-3 backdrop-blur">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{value}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="relative border-t border-border/50 bg-secondary/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]"
          >
            <motion.div variants={fadeUp}>
              <p className="text-sm font-semibold text-primary">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                From messy files to focused study sessions.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                AI Study Hub keeps the practical workflow simple: collect course files, let AI process them, practice from the content, then collaborate with your group.
              </p>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflow.map((step, index) => (
                <motion.div key={step.title} variants={fadeUp} className="rounded-xl border border-border/50 bg-card/70 p-5 backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      {step.icon}
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-10"
          >
            <motion.div variants={fadeUp} className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">Core modules</p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                Built around real student workflows.
              </h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {modules.map((feature) => (
                <motion.div key={feature.title} variants={fadeUp} className="rounded-xl border border-border/50 bg-card/70 p-5 backdrop-blur transition-colors hover:border-primary/35">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-secondary/20 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
            className="rounded-xl border border-border/50 bg-card/75 p-5 backdrop-blur"
          >
            <DashboardPreview />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col justify-center"
          >
            <p className="text-sm font-semibold text-primary">Inside the app</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              A quiet dashboard for repeat study work.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The interface is designed for scanning, comparing, and taking action: document status, workspace tasks, AI outputs, and group activity stay close together.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["AI classification", "Document preview", "Member roles", "Quiz results"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/65 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-sm font-semibold text-primary">Ready to study smarter</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
              Bring your course documents into one AI-powered workspace.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Start with your existing account, upload a file, and let AI Study Hub organize the next study session.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
              >
                Go to login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

function LearningScene() {
  const documents = [
    { title: "Database Notes", type: "PDF", position: "left-[3%] top-[12%]", delay: 0 },
    { title: "MVC Lecture", type: "DOCX", position: "right-[2%] top-[22%]", delay: 0.2 },
    { title: "AI Summary", type: "AI", position: "left-[5%] bottom-[14%]", delay: 0.4 },
    { title: "Quiz Set", type: "QUIZ", position: "right-[4%] bottom-[8%]", delay: 0.6 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      <div className="absolute inset-y-0 right-0 hidden w-[54%] xl:block">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15"
          animate={{ rotate: -360 }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute left-1/2 top-1/2 flex h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-primary/25 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="mt-3 bg-gradient-to-r from-primary via-accent to-chart-4 bg-clip-text text-sm font-black text-transparent">
              AI Study Hub
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Processing notes</p>
          </motion.div>
        </div>
        {documents.map((document) => (
          <motion.div
            key={document.title}
            className={`absolute w-48 rounded-xl border border-border/50 bg-card/85 p-4 shadow-xl shadow-background/20 backdrop-blur ${document.position}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { delay: document.delay, duration: 0.45 },
              y: { delay: document.delay, duration: 6, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                {document.type === "AI" ? <Bot className="h-4 w-4" /> : document.type === "QUIZ" ? <ListChecks className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <span className="rounded-md bg-secondary/70 px-2 py-1 text-[11px] font-medium text-muted-foreground">{document.type}</span>
            </div>
            <p className="truncate text-sm font-semibold text-foreground">{document.title}</p>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded-full bg-secondary" />
              <div className="h-2 w-4/5 rounded-full bg-secondary" />
              <div className="h-2 w-2/3 rounded-full bg-primary/25" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-background">
      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <div className="h-2.5 w-2.5 rounded-full bg-chart-4" />
          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
        </div>
        <div className="h-2 w-32 rounded-full bg-secondary" />
      </div>
      <div className="grid min-h-[360px] grid-cols-[170px_1fr]">
        <div className="border-r border-border/50 bg-secondary/25 p-4">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="h-2 w-20 rounded-full bg-foreground/25" />
          </div>
          <div className="space-y-2">
            {["Dashboard", "Documents", "Workspaces", "Forum", "Settings"].map((item, index) => (
              <div key={item} className={`rounded-lg px-3 py-2 text-xs ${index === 2 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="h-3 w-44 rounded-full bg-foreground/25" />
              <div className="mt-2 h-2 w-64 rounded-full bg-secondary" />
            </div>
            <div className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Upload</div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Documents", "42"],
              ["Tasks", "12"],
              ["AI outputs", "28"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Recent documents</p>
              </div>
              <div className="space-y-3">
                {["Java MVC Lecture", "Database Normalization", "AI Ethics Notes"].map((doc, index) => (
                  <div key={doc} className="flex items-center justify-between rounded-lg bg-secondary/45 px-3 py-2">
                    <span className="text-xs text-foreground">{doc}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] ${index === 1 ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                      {index === 1 ? "Processing" : "Ready"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Tags className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Flashcards</p>
              </div>
              <div className="h-32 rounded-lg bg-secondary/45 p-3">
                <p className="text-xs font-medium text-foreground">What is normalization?</p>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full rounded-full bg-secondary" />
                  <div className="h-2 w-5/6 rounded-full bg-secondary" />
                  <div className="h-2 w-2/3 rounded-full bg-primary/25" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
