"use client"

import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Note {
  id: string
  content: string
  tag: string
  createdAt: string
}

const tagColors: Record<string, string> = {
  meeting: "bg-primary/10 text-primary ring-primary/20",
  briefing: "bg-secondary text-secondary-foreground ring-border/30",
  strategy: "bg-destructive/10 text-destructive ring-destructive/20",
  general: "bg-muted text-muted-foreground ring-border/30",
}

export function ClientNotesPanel({ notes, onAdd, onDelete, onEdit }: {
  notes: Note[]
  onAdd: (content: string, tag: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: string, tag: string) => void
}) {
  const [newNote, setNewNote] = useState("")
  const [selectedTag, setSelectedTag] = useState("general")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editTag, setEditTag] = useState("general")

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
    setEditTag(note.tag)
  }

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      onEdit(editingId, editContent, editTag)
      setEditingId(null)
      setEditContent("")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Adicionar nota de reunião, briefing ou alinhamento..."
          className="bg-muted/10 border-border/40 text-xs min-h-[80px]"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {["meeting", "briefing", "strategy", "general"].map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ring-1 transition-all ${
                  selectedTag === tag ? tagColors[tag] : "bg-muted/20 text-muted-foreground ring-border/20"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => { if (newNote.trim()) { onAdd(newNote, selectedTag); setNewNote("") } }}
            className="h-6 text-[9px] font-bold uppercase tracking-wider"
          >
            Salvar
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
        {notes.map(note => (
          <div key={note.id} className="p-3 bg-muted/10 border border-border/30 rounded-xl space-y-1.5 group">
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="bg-muted/10 border-border/40 text-xs min-h-[80px]"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {["meeting", "briefing", "strategy", "general"].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setEditTag(tag)}
                        className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ring-1 transition-all ${
                          editTag === tag ? tagColors[tag] : "bg-muted/20 text-muted-foreground ring-border/20"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-6 text-[9px] font-bold uppercase tracking-wider"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-6 text-[9px] font-bold uppercase tracking-wider"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full ring-1 ${tagColors[note.tag] || tagColors.general}`}>
                    {note.tag}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(note)}
                      className="size-5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(note.id)}
                      className="size-5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-2.5" />
                    </Button>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="size-2.5" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-foreground font-medium leading-relaxed">{note.content}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
