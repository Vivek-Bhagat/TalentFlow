import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Plus, Edit, Trash2, Pin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Helper function to render content with highlighted @mentions
const renderContentWithMentions = (content: string, mentions: string[]) => {
  // Split content by @mentions pattern
  const parts = content.split(/(@\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const username = part.slice(1);
      // Check if this mention is in the mentions array
      if (mentions.includes(username)) {
        return (
          <span
            key={index}
            className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1 rounded font-medium">
            {part}
          </span>
        );
      }
    }
    return <span key={index}>{part}</span>;
  });
};

export interface Note {
  id: string;
  candidateId: string;
  content: string;
  author: string;
  authorAvatar?: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isPrivate: boolean;
  tags: string[];
  type: "general" | "interview" | "technical" | "reference" | "concern";
}

interface NotesManagerProps {
  candidateId: string;
  notes: Note[];
  onAddNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  className?: string;
}

export default function NotesManager({
  candidateId,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  className,
}: NotesManagerProps) {
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<Note["type"]>("general");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { toast } = useToast();

  const noteTypes = [
    { value: "general", label: "General", color: "bg-gray-100 text-gray-800" },
    {
      value: "interview",
      label: "Interview",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "technical",
      label: "Technical",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "reference",
      label: "Reference",
      color: "bg-purple-100 text-purple-800",
    },
    { value: "concern", label: "Concern", color: "bg-red-100 text-red-800" },
  ];

  // Helper function to extract mentions from content
  const extractMentions = (content: string): string[] => {
    const mentionPattern = /@(\w+)/g;
    const matches = content.match(mentionPattern);
    if (!matches) return [];
    return matches.map((match) => match.slice(1)); // Remove @ symbol
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: "Empty Note",
        description: "Please enter some content for the note",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingNote(true);

      const note: Omit<Note, "id" | "createdAt" | "updatedAt"> = {
        candidateId,
        content: newNoteContent,
        author: "Current User", // This would come from auth context
        mentions: extractMentions(newNoteContent),
        isPinned: false,
        isPrivate: false,
        tags: [],
        type: newNoteType,
      };

      onAddNote(note);
      setNewNoteContent("");
      setNewNoteType("general");

      toast({
        title: "Note Added",
        description: "Your note has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      onUpdateNote(noteId, {
        content: editContent,
        mentions: extractMentions(editContent),
        updatedAt: new Date(),
      });
      setEditingNote(null);
      setEditContent("");

      toast({
        title: "Note Updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditContent("");
  };

  const handleTogglePin = (noteId: string, isPinned: boolean) => {
    onUpdateNote(noteId, { isPinned: !isPinned });
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      onDeleteNote(noteId);
      toast({
        title: "Note Deleted",
        description: "The note has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: Note["type"]) => {
    return (
      noteTypes.find((t) => t.value === type)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Add Note Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 100, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
                <MessageSquare className="h-5 w-5" />
              </motion.div>
              Add Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}>
              <div className="flex gap-2 mb-2">
                {noteTypes.map((type, index) => (
                  <motion.button
                    key={type.value}
                    onClick={() => setNewNoteType(type.value as Note["type"])}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      newNoteType === type.value
                        ? type.color
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}>
                    {type.label}
                  </motion.button>
                ))}
              </div>
              <Textarea
                placeholder="Add a note about this candidate... (Use @username to mention team members)"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
              />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleAddNote}
                disabled={isAddingNote || !newNoteContent.trim()}>
                {isAddingNote ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Note
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}>
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                </motion.div>
                <motion.h3
                  className="text-lg font-medium text-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}>
                  No Notes Yet
                </motion.h3>
                <motion.p
                  className="text-muted-foreground text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}>
                  Start documenting your interactions and thoughts about this
                  candidate
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                layout>
                <Card
                  className={cn("relative", note.isPinned && "border-warning")}>
                  {note.isPinned && (
                    <motion.div
                      className="absolute top-2 right-2"
                      initial={{ rotate: -45, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}>
                      <Pin className="h-4 w-4 text-warning" />
                    </motion.div>
                  )}

                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: index * 0.05 + 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={note.authorAvatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(note.author)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>

                      <div className="flex-1 space-y-2">
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 + 0.15 }}>
                          <span className="font-medium text-sm">
                            {note.author}
                          </span>
                          <Badge
                            className={cn("text-xs", getTypeColor(note.type))}>
                            {
                              noteTypes.find((t) => t.value === note.type)
                                ?.label
                            }
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(note.createdAt, "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {note.updatedAt > note.createdAt && (
                            <span className="text-xs text-muted-foreground italic">
                              (edited)
                            </span>
                          )}
                        </motion.div>

                        {editingNote === note.id ? (
                          <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}>
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(note.id)}>
                                  Save
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="space-y-2">
                            <motion.p
                              className="text-sm text-foreground whitespace-pre-wrap"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 + 0.2 }}>
                              {renderContentWithMentions(
                                note.content,
                                note.mentions
                              )}
                            </motion.p>

                            <motion.div
                              className="flex items-center gap-2 pt-2"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 + 0.25 }}>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleTogglePin(note.id, note.isPinned)
                                  }
                                  className="h-7 px-2 text-xs">
                                  <Pin
                                    className={cn(
                                      "h-3 w-3",
                                      note.isPinned && "text-warning"
                                    )}
                                  />
                                  {note.isPinned ? "Unpin" : "Pin"}
                                </Button>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditNote(note)}
                                  className="h-7 px-2 text-xs">
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                              </motion.div>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-destructive hover:text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                      Delete
                                    </Button>
                                  </motion.div>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Note</DialogTitle>
                                  </DialogHeader>
                                  <p className="text-sm text-muted-foreground">
                                    Are you sure you want to delete this note?
                                    This action cannot be undone.
                                  </p>
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm">
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteNote(note.id)}>
                                      Delete
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
