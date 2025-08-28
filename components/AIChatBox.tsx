"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Globe, Paperclip, Send, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

const MIN_HEIGHT = 48
const MAX_HEIGHT = 164

const AnimatedPlaceholder = ({ showSearch }: { showSearch: boolean }) => (
  <AnimatePresence mode="wait">
    <motion.p
      key={showSearch ? "search" : "ask"}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.1 }}
      className="pointer-events-none w-[150px] text-sm absolute text-muted-foreground"
    >
      {showSearch ? "Search the web..." : "Ask anything..."}
    </motion.p>
  </AnimatePresence>
)

export function AiInput({ onSubmit, loading = false }: { onSubmit: (text: string, imageDataUrl?: string, webSearch?: boolean) => void; loading?: boolean }) {
  const [value, setValue] = useState("")
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  })
  const [showSearch, setShowSearch] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handelClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset file input
    }
    setImagePreview(null) // Use null instead of empty string
  }

  const handelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    let dataUrl: string | undefined
    if (imageFile) {
      dataUrl = await new Promise<string>((resolve) => {
        const fr = new FileReader()
        fr.onload = () => resolve(String(fr.result))
        fr.readAsDataURL(imageFile)
      })
    }
    onSubmit(value.trim(), dataUrl, showSearch)
    setValue("")
    setImageFile(null)
    setImagePreview(null)
    adjustHeight(true)
  }

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])
  return (
    <div className="w-full">
      <div className="relative max-w-2xl border border-border bg-input w-full mx-auto">
        <div className="relative bg-input flex flex-col">
          <div className="overflow-y-auto" style={{ maxHeight: `${MAX_HEIGHT}px` }}>
            {imagePreview ? (
              <div className="grid grid-cols-[96px_1fr] gap-4 p-4">
                <div className="relative h-[96px] w-[96px] overflow-hidden border border-border shadow-sm">
                  <Image
                    className="object-cover h-full w-full"
                    src={imagePreview}
                    height={240}
                    width={240}
                    alt="attached image"
                  />
                  <button
                    onClick={handelClose}
                    className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative bg-background border border-border">
                  <Textarea
                    id="ai-input-04"
                    value={value}
                    placeholder=""
                    className="w-full px-4 py-3 bg-transparent border-none text-foreground resize-none focus-visible:ring-0 leading-[1.2]"
                    ref={textareaRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    onChange={(e) => {
                      setValue(e.target.value)
                      adjustHeight()
                    }}
                  />
                  {!value && (
                    <div className="absolute left-4 top-3">
                      <AnimatedPlaceholder showSearch={showSearch} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Textarea
                  id="ai-input-04"
                  value={value}
                  placeholder=""
                  className="w-full px-4 py-3 bg-background border-none text-foreground resize-none focus-visible:ring-0 leading-[1.2]"
                  ref={textareaRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  onChange={(e) => {
                    setValue(e.target.value)
                    adjustHeight()
                  }}
                />
                {!value && (
                  <div className="absolute left-4 top-3">
                    <AnimatedPlaceholder showSearch={showSearch} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-12 bg-background border-t border-border">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <label
                className={cn(
                  "cursor-pointer relative p-2 bg-secondary",
                  imagePreview
                    ? "bg-primary/15 border border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handelChange}
                  className="hidden"
                />
                <Paperclip
                  className={cn("w-4 h-4 transition-colors", imagePreview ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowSearch(!showSearch)
                }}
                className={cn(
                  "transition-all flex items-center gap-2 px-2 py-1 border h-8",
                  showSearch
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{
                      rotate: showSearch ? 180 : 0,
                      scale: showSearch ? 1.1 : 1,
                    }}
                    whileHover={{
                      rotate: showSearch ? 180 : 15,
                      scale: 1.1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 10,
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Globe
                      className={cn(
                        "w-4 h-4",
                        showSearch ? "text-primary" : "text-inherit"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap text-primary flex-shrink-0"
                    >
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <div className="absolute right-3 bottom-3">
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "weeble-button p-2",
                  loading && "opacity-50 cursor-not-allowed",
                  !value && !loading && "bg-secondary hover:bg-muted"
                )}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
