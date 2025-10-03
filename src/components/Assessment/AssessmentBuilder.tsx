import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Clock,
  FileText,
  CheckSquare,
  List,
  Type,
  Hash,
  Upload,
  Edit,
  Check,
  Briefcase,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Assessment, AssessmentSection, Question, Job } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useAssessmentStorage } from "@/service/assessment-storage";

const QUESTION_TYPES = [
  {
    id: "single-choice",
    label: "Single Choice",
    icon: CheckSquare,
    description: "Select one option",
  },
  {
    id: "multi-choice",
    label: "Multiple Choice",
    icon: List,
    description: "Select multiple options",
  },
  {
    id: "short-text",
    label: "Short Text",
    icon: Type,
    description: "Brief text response",
  },
  {
    id: "long-text",
    label: "Long Text",
    icon: FileText,
    description: "Detailed text response",
  },
  { id: "numeric", label: "Number", icon: Hash, description: "Numeric input" },
  {
    id: "file-upload",
    label: "File Upload",
    icon: Upload,
    description: "Upload documents",
  },
] as const;

// Draggable Question Component
function DraggableQuestion({
  question,
  sectionIndex,
  questionIndex,
  sectionQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
}: {
  question: Question;
  sectionIndex: number;
  questionIndex: number;
  sectionQuestions: Question[];
  onUpdateQuestion: (
    sectionIndex: number,
    questionIndex: number,
    updates: Partial<Question>
  ) => void;
  onDeleteQuestion: (sectionIndex: number, questionIndex: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getQuestionTypeIcon = (type: Question["type"]) => {
    const questionType = QUESTION_TYPES.find((t) => t.id === type);
    return questionType?.icon || Type;
  };

  const handleAddOption = () => {
    const currentOptions = question.options || [];
    onUpdateQuestion(sectionIndex, questionIndex, {
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const handleUpdateOption = (optionIndex: number, value: string) => {
    const updatedOptions = [...(question.options || [])];
    updatedOptions[optionIndex] = value;
    onUpdateQuestion(sectionIndex, questionIndex, { options: updatedOptions });
  };

  const handleRemoveOption = (optionIndex: number) => {
    const updatedOptions = (question.options || []).filter(
      (_, i) => i !== optionIndex
    );
    onUpdateQuestion(sectionIndex, questionIndex, { options: updatedOptions });
  };

  const QuestionIcon = getQuestionTypeIcon(question.type);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-4 group border-l-4 border-l-primary/20 hover:border-l-primary/50 transition-all",
        isDragging && "rotate-1 shadow-lg"
      )}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 w-full min-w-0">
            <div
              className="drag-handle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block flex-shrink-0"
              {...attributes}
              {...listeners}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <QuestionIcon className="h-4 w-4 text-primary flex-shrink-0" />
              <Badge
                variant="outline"
                className="text-xs whitespace-nowrap">
                {QUESTION_TYPES.find((t) => t.id === question.type)?.label}
              </Badge>
              {question.required && (
                <Badge
                  variant="secondary"
                  className="text-xs whitespace-nowrap">
                  Required
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-start flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteQuestion(sectionIndex, questionIndex)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-${question.id}-text`}>
                Question Text
              </Label>
              <Textarea
                id={`question-${question.id}-text`}
                value={question.text}
                onChange={(e) =>
                  onUpdateQuestion(sectionIndex, questionIndex, {
                    text: e.target.value,
                  })
                }
                placeholder="Enter your question..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`question-${question.id}-description`}>
                Description (Optional)
              </Label>
              <Input
                id={`question-${question.id}-description`}
                value={question.description || ""}
                onChange={(e) =>
                  onUpdateQuestion(sectionIndex, questionIndex, {
                    description: e.target.value,
                  })
                }
                placeholder="Add helpful context..."
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id={`question-${question.id}-required`}
                checked={question.required}
                onCheckedChange={(checked) =>
                  onUpdateQuestion(sectionIndex, questionIndex, {
                    required: checked,
                  })
                }
              />
              <Label htmlFor={`question-${question.id}-required`}>
                Required
              </Label>
            </div>

            {/* Options for choice questions */}
            {(question.type === "single-choice" ||
              question.type === "multi-choice") && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Options</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddOption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) =>
                          handleUpdateOption(optionIndex, e.target.value)
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveOption(optionIndex)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation for text/numeric questions */}
            {(question.type === "short-text" ||
              question.type === "long-text" ||
              question.type === "numeric") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.type !== "numeric" ? (
                  <>
                    <div>
                      <Label>Min Length</Label>
                      <Input
                        type="number"
                        value={question.validation?.minLength || ""}
                        onChange={(e) =>
                          onUpdateQuestion(sectionIndex, questionIndex, {
                            validation: {
                              ...question.validation,
                              minLength: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Max Length</Label>
                      <Input
                        type="number"
                        value={question.validation?.maxLength || ""}
                        onChange={(e) =>
                          onUpdateQuestion(sectionIndex, questionIndex, {
                            validation: {
                              ...question.validation,
                              maxLength: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        placeholder="1000"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Min Value</Label>
                      <Input
                        type="number"
                        value={question.validation?.min || ""}
                        onChange={(e) =>
                          onUpdateQuestion(sectionIndex, questionIndex, {
                            validation: {
                              ...question.validation,
                              min: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Max Value</Label>
                      <Input
                        type="number"
                        value={question.validation?.max || ""}
                        onChange={(e) =>
                          onUpdateQuestion(sectionIndex, questionIndex, {
                            validation: {
                              ...question.validation,
                              max: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        placeholder="100"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Conditional Question Settings */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">
                  Conditional Question
                </Label>
                <Switch
                  checked={!!question.conditional}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdateQuestion(sectionIndex, questionIndex, {
                        conditional: {
                          dependsOn: "",
                          showWhen: "",
                        },
                      });
                    } else {
                      onUpdateQuestion(sectionIndex, questionIndex, {
                        conditional: undefined,
                      });
                    }
                  }}
                />
              </div>

              {question.conditional && (
                <div className="space-y-3 bg-muted/50 p-3 rounded-md">
                  <div>
                    <Label className="text-xs">Show this question when:</Label>
                    <Select
                      value={question.conditional.dependsOn || ""}
                      onValueChange={(value) =>
                        onUpdateQuestion(sectionIndex, questionIndex, {
                          conditional: {
                            ...question.conditional!,
                            dependsOn: value,
                          },
                        })
                      }>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a question" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Get all previous questions in the section */}
                        {questionIndex > 0 ? (
                          (() => {
                            const seen = new Set();
                            return Array.from({ length: questionIndex }).map(
                              (_, idx) => {
                                const prevQuestion = sectionQuestions[idx];
                                let key = prevQuestion.id;
                                if (seen.has(key)) {
                                  key = `${key}-${idx}`;
                                }
                                seen.add(key);
                                return (
                                  <SelectItem
                                    key={key}
                                    value={prevQuestion.id}>
                                    Q{idx + 1}:{" "}
                                    {prevQuestion.text.substring(0, 40)}
                                    {prevQuestion.text.length > 40 ? "..." : ""}
                                  </SelectItem>
                                );
                              }
                            );
                          })()
                        ) : (
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            No previous questions available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Answer equals:</Label>
                    <Input
                      value={question.conditional.showWhen || ""}
                      onChange={(e) =>
                        onUpdateQuestion(sectionIndex, questionIndex, {
                          conditional: {
                            ...question.conditional!,
                            showWhen: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., 'Yes' or 'Option 1'"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This question will only appear when the selected
                      question's answer matches this value
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Preview Mode
          <div>
            <h4 className="font-medium text-foreground mb-2">
              {question.text}
            </h4>
            {question.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {question.description}
              </p>
            )}

            {/* Question Preview */}
            {question.type === "single-choice" && (
              <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`preview-${question.id}`}
                      disabled
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            )}

            {question.type === "multi-choice" && (
              <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      disabled
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            )}

            {question.type === "short-text" && (
              <Input
                placeholder="Short answer..."
                disabled
              />
            )}

            {question.type === "long-text" && (
              <Textarea
                placeholder="Long answer..."
                disabled
              />
            )}

            {question.type === "numeric" && (
              <Input
                type="number"
                placeholder="Enter number..."
                disabled
              />
            )}

            {question.type === "file-upload" && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Assessment Section Component
function AssessmentSectionComponent({
  section,
  sectionIndex,
  onUpdateSection,
  onDeleteSection,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
}: {
  section: AssessmentSection;
  sectionIndex: number;
  onUpdateSection: (
    sectionIndex: number,
    updates: Partial<AssessmentSection>
  ) => void;
  onDeleteSection: (sectionIndex: number) => void;
  onUpdateQuestion: (
    sectionIndex: number,
    questionIndex: number,
    updates: Partial<Question>
  ) => void;
  onDeleteQuestion: (sectionIndex: number, questionIndex: number) => void;
  onAddQuestion: (sectionIndex: number, type: Question["type"]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    // Section card - Building Assessment
    <Card className="mb-6 border-2 border-primary/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 w-full sm:mr-3">
            <Input
              value={section.title}
              onChange={(e) =>
                onUpdateSection(sectionIndex, { title: e.target.value })
              }
              placeholder="Section Title"
              className="text-base sm:text-lg font-medium border-none p-2 h-auto bg-transparent border-0 w-full"
            />
            <Input
              value={section.description || ""}
              onChange={(e) =>
                onUpdateSection(sectionIndex, { description: e.target.value })
              }
              placeholder="Section Description (Optional)"
              className="text-sm text-muted-foreground border-none p-2 h-auto bg-transparent mt-1 w-full"
            />
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-start">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteSection(sectionIndex)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {/* Questions */}
          <SortableContext
            items={section.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}>
            {section.questions.map((question, questionIndex) => (
              <DraggableQuestion
                key={question.id}
                question={question}
                sectionIndex={sectionIndex}
                questionIndex={questionIndex}
                sectionQuestions={section.questions}
                onUpdateQuestion={onUpdateQuestion}
                onDeleteQuestion={onDeleteQuestion}
              />
            ))}
          </SortableContext>

          {/* Add Question */}
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Add a new question
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {QUESTION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.id}
                        variant="outline"
                        onClick={() => onAddQuestion(sectionIndex, type.id)}
                        className="h-auto p-3 flex flex-col items-center space-y-2">
                        <Icon className="h-4 w-4" />
                        <div className="text-center">
                          <div className="text-xs font-medium">
                            {type.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
}

interface AssessmentBuilderProps {
  jobId?: string;
  assessment?: Assessment;
  jobs?: Job[];
  onSave?: (assessment: Assessment) => void;
}

export default function AssessmentBuilder({
  jobId,
  assessment: initialAssessment,
  jobs = [],
  onSave,
}: AssessmentBuilderProps) {
  const storage = useAssessmentStorage();

  const [assessment, setAssessment] = useState<Assessment>(() => {
    // First try to load from localStorage if we have an ID
    if (initialAssessment?.id && storage.isAvailable) {
      const stored = storage.loadAssessmentDraft(initialAssessment.id);
      if (stored) {
        // Show toast about restored draft
        setTimeout(() => {
          toast({
            title: "Draft Restored",
            description:
              "Your unsaved changes have been restored from local storage.",
            duration: 5000,
          });
        }, 100);
        return stored;
      }
    }

    if (initialAssessment) return initialAssessment;

    return {
      id: crypto.randomUUID(),
      jobId: jobId || "",
      title: "",
      description: "",
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false,
    };
  });

  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    assessment.jobId || jobId || (jobs.length > 0 ? jobs[0].id : "")
  );
  const { toast } = useToast();

  // Sync selectedJobId with assessment.jobId when assessment changes
  useEffect(() => {
    if (assessment.jobId && assessment.jobId !== selectedJobId) {
      setSelectedJobId(assessment.jobId);
    }
  }, [assessment.jobId, selectedJobId]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!storage.isAvailable) return;

    const autoSaveTimer = setTimeout(() => {
      setAutoSaving(true);
      const success = storage.saveAssessmentDraft(assessment);
      if (success) {
        setLastSaved(new Date());
      }
      setTimeout(() => setAutoSaving(false), 500);
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [assessment, storage]);

  // Cleanup localStorage when component unmounts or assessment is successfully saved
  useEffect(() => {
    return () => {
      // Don't cleanup if we're just switching views - only on unmount
      if (!saving && storage.isAvailable) {
        // Keep the draft for a bit longer in case user comes back
        setTimeout(() => {
          storage.cleanupOldData();
        }, 5000);
      }
    };
  }, [storage, saving]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUpdateAssessment = (updates: Partial<Assessment>) => {
    setAssessment((prev) => ({ ...prev, ...updates, updatedAt: new Date() }));
  };

  const handleAddSection = () => {
    const newSection: AssessmentSection = {
      id: crypto.randomUUID(),
      title: `Section ${assessment.sections.length + 1}`,
      description: "",
      questions: [],
      order: assessment.sections.length,
    };

    setAssessment((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date(),
    }));
  };

  const handleUpdateSection = (
    sectionIndex: number,
    updates: Partial<AssessmentSection>
  ) => {
    setAssessment((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...updates } : section
      ),
      updatedAt: new Date(),
    }));
  };

  const handleDeleteSection = (sectionIndex: number) => {
    setAssessment((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
      updatedAt: new Date(),
    }));
  };

  const handleAddQuestion = (sectionIndex: number, type: Question["type"]) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      text: "New Question",
      description: "",
      required: false,
      order: assessment.sections[sectionIndex].questions.length,
      ...(type === "single-choice" || type === "multi-choice"
        ? { options: ["Option 1", "Option 2"] }
        : {}),
    };

    setAssessment((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      ),
      updatedAt: new Date(),
    }));
  };

  const handleUpdateQuestion = (
    sectionIndex: number,
    questionIndex: number,
    updates: Partial<Question>
  ) => {
    setAssessment((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIdx) =>
                qIdx === questionIndex ? { ...question, ...updates } : question
              ),
            }
          : section
      ),
      updatedAt: new Date(),
    }));
  };

  const handleDeleteQuestion = (
    sectionIndex: number,
    questionIndex: number
  ) => {
    setAssessment((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sIdx) =>
        sIdx === sectionIndex
          ? {
              ...section,
              questions: section.questions.filter(
                (_, qIdx) => qIdx !== questionIndex
              ),
            }
          : section
      ),
      updatedAt: new Date(),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuestionId(null);

    if (!over || active.id === over.id) return;

    // Find which section and question we're moving
    let activeSection = -1;
    let activeQuestion = -1;
    let overSection = -1;
    let overQuestion = -1;

    assessment.sections.forEach((section, sIdx) => {
      section.questions.forEach((question, qIdx) => {
        if (question.id === active.id) {
          activeSection = sIdx;
          activeQuestion = qIdx;
        }
        if (question.id === over.id) {
          overSection = sIdx;
          overQuestion = qIdx;
        }
      });
    });

    if (activeSection === -1 || overSection === -1) return;

    // Move within same section
    if (activeSection === overSection) {
      setAssessment((prev) => ({
        ...prev,
        sections: prev.sections.map((section, sIdx) =>
          sIdx === activeSection
            ? {
                ...section,
                questions: arrayMove(
                  section.questions,
                  activeQuestion,
                  overQuestion
                ),
              }
            : section
        ),
        updatedAt: new Date(),
      }));
    }
  };

  const validateAssessment = () => {
    const errors: string[] = [];

    // Check required fields
    if (!assessment.title?.trim()) {
      errors.push("Assessment title is required");
    }

    if (!selectedJobId && !jobId) {
      errors.push("Please select a job for this assessment");
    }

    // Check sections and questions
    if (assessment.sections.length === 0) {
      errors.push("At least one section is required");
    }

    // Validate each section
    assessment.sections.forEach((section, sectionIndex) => {
      if (!section.title?.trim()) {
        errors.push(`Section ${sectionIndex + 1} must have a title`);
      }

      if (section.questions.length === 0) {
        errors.push(
          `Section "${section.title}" must have at least one question`
        );
      }

      // Validate each question
      section.questions.forEach((question, questionIndex) => {
        if (!question.text?.trim()) {
          errors.push(
            `Question ${questionIndex + 1} in section "${
              section.title
            }" must have text`
          );
        }

        // Validate choice questions have options
        if (
          (question.type === "single-choice" ||
            question.type === "multi-choice") &&
          (!question.options || question.options.length < 2)
        ) {
          errors.push(
            `Question "${question.text}" must have at least 2 options`
          );
        }

        // Validate options are not empty
        if (question.options) {
          question.options.forEach((option, optionIndex) => {
            if (!option?.trim()) {
              errors.push(
                `Option ${optionIndex + 1} in question "${
                  question.text
                }" cannot be empty`
              );
            }
          });
        }
      });
    });

    return errors;
  };

  const handleSave = async () => {
    // Validate assessment first
    const validationErrors = validateAssessment();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors[0], // Show first error
        variant: "destructive",
      });
      return;
    }

    const targetJobId = selectedJobId || jobId;

    console.log("💾 Saving assessment:", {
      assessmentId: assessment.id,
      title: assessment.title,
      jobId: targetJobId,
      sections: assessment.sections.length,
    });

    const saveWithRetry = async (attempts = 3): Promise<void> => {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          setSaving(true);
          const savedAssessment = await apiClient.saveAssessment(
            targetJobId!,
            assessment
          );

          // Clear localStorage draft after successful save
          if (storage.isAvailable) {
            storage.clearAssessmentDraft(assessment.id);
          }

          toast({
            title: "Success",
            description: "Assessment saved successfully",
          });

          if (onSave) {
            onSave(savedAssessment);
          }
          return; // Success, exit function
        } catch (error) {
          console.error(`Save attempt ${attempt} failed:`, error);

          if (attempt === attempts) {
            // Final attempt failed, show error
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error occurred";

            let userMessage = "Failed to save assessment. Please try again.";
            if (errorMessage.includes("API endpoint returned HTML")) {
              userMessage =
                "Service temporarily unavailable. Please check your connection and try again.";
            } else if (errorMessage.includes("API Error: 500")) {
              userMessage =
                "Server error occurred. Please try saving again in a moment.";
            } else if (errorMessage.includes("Invalid JSON")) {
              userMessage =
                "Communication error with server. Please refresh and try again.";
            }

            toast({
              title: "Save Failed",
              description: `${userMessage} Click here to retry.`,
              variant: "destructive",
            });
          } else {
            // Wait before retry (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 500)
            );
          }
        }
      }
    };

    try {
      await saveWithRetry();
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = assessment.sections.reduce(
    (total, section) => total + section.questions.length,
    0
  );

  // Create Assessment Header
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 space-y-2 w-full lg:mr-2">
              <Input
                value={assessment.title}
                onChange={(e) =>
                  handleUpdateAssessment({ title: e.target.value })
                }
                placeholder="Enter Assessment Title"
                className="text-lg md:text-xl font-medium border-none p-2 h-auto bg-transparent w-full"
              />
              <Textarea
                value={assessment.description}
                onChange={(e) =>
                  handleUpdateAssessment({ description: e.target.value })
                }
                placeholder="Assessment Description"
                className="border-none p-2 bg-transparent resize-none w-full"
              />

              {/* Job Selection */}
              <div className="pt-2">
                <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-primary" />
                  Job Position
                </Label>
                {jobs.length > 0 ? (
                  <Select
                    value={selectedJobId}
                    onValueChange={(value) => {
                      setSelectedJobId(value);
                      handleUpdateAssessment({ jobId: value });
                    }}>
                    <SelectTrigger className="w-full md:max-w-md">
                      <SelectValue placeholder="Select a job for this assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem
                          key={job.id}
                          value={job.id}>
                          <div className="flex  items-start gap-6">
                            <span className="text-muted-foreground gap-2">
                              {job.title}
                            </span>
                            <span className="text-muted-foreground">
                              Job ID: {job.id}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">
                      No jobs available. Please create a job first before
                      creating assessments.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 lg:gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3 sm:gap-4 order-2 sm:order-1">
                <div className="text-left sm:text-right text-sm text-muted-foreground">
                  <div>{assessment.sections.length} sections</div>
                  <div>{totalQuestions} questions</div>
                </div>

                {/* Auto-save status */}
                {storage.isAvailable && (
                  <div className="text-xs text-muted-foreground hidden ">
                    {autoSaving ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : lastSaved ? (
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>Saved {lastSaved.toLocaleTimeString()}</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !assessment.title?.trim()}
                className="w-full sm:w-auto order-1 sm:order-2">
                {saving ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Save Assessment</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="time-limit"
                  checked={!!assessment.timeLimit}
                  onCheckedChange={(checked) =>
                    handleUpdateAssessment({
                      timeLimit: checked ? 60 : undefined,
                    })
                  }
                />
                <Label htmlFor="time-limit">Time Limit</Label>
              </div>

              {assessment.timeLimit && (
                <div className="flex items-center space-x-2 ml-0 sm:ml-0">
                  <Input
                    type="number"
                    value={assessment.timeLimit}
                    onChange={(e) =>
                      handleUpdateAssessment({
                        timeLimit: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-20"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={assessment.isPublished}
                onCheckedChange={(checked) =>
                  handleUpdateAssessment({ isPublished: checked })
                }
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveQuestionId(event.active.id as string)}
        onDragEnd={handleDragEnd}>
        {assessment.sections.map((section, sectionIndex) => (
          <AssessmentSectionComponent
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAddQuestion={handleAddQuestion}
          />
        ))}

        <DragOverlay>
          {activeQuestionId ? (
            <Card className="opacity-90">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Moving question...</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Section */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="p-8 text-center">
          <Button
            onClick={handleAddSection}
            variant="outline"
            size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
