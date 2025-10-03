import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  Mail,
  MapPin,
  GripVertical,
  ChevronDown,
  Users,
  Contact,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Candidate } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
// import { useNavigate } from "react-router-dom";

const STAGES = [
  { id: "applied", label: "Applied", color: "bg-blue-500" },
  { id: "screen", label: "Screening", color: "bg-orange-500" },
  { id: "technical", label: "Technical", color: "bg-purple-500" },
  { id: "offer", label: "Offer", color: "bg-green-500" },
  { id: "hired", label: "Hired", color: "bg-pink-500" },
  { id: "rejected", label: "Rejected", color: "bg-red-500" },
] as const;

// Draggable Candidate Card Component
function DraggableCandidateCard({ candidate }: { candidate: Candidate }) {
  // const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    //data card
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-400  border-1 border-gray-600 dark:border-gray-400 hover:border-primary/70",
        "transform hover:-translate-y-1 active:scale-95",
        isDragging && "rotate-2 shadow-xl scale-105 z-50 cursor-grabbing"
      )}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-gray-600/10">
              <AvatarImage src={candidate.avatar} />
              <AvatarFallback className="bg-blue-500 font-medium text-xs sm:text-sm text-white">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1 mb-0.5 sm:mb-1">
                {candidate.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 font-medium">
                {candidate.position}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/50 group-hover:text-blue-500" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
        {/* Contact Info */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
            <Mail className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 opacity-75" />
            <span className="truncate font-medium">{candidate.email}</span>
          </div>
          <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
            <MapPin className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 opacity-75" />
            <span className="truncate font-medium">{candidate.location}</span>
          </div>
          <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
            <Contact className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 opacity-75" />
            <span className="truncate font-medium">
              Job ID: {candidate.jobId}
            </span>
          </div>
        </div>

        {/* Application Date */}
        {/* <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/60"></div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              Applied{" "}
              {new Date(candidate.appliedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}

// Kanban Column Component
function KanbanColumn({
  stage,
  candidates,
  totalStages,
}: {
  stage: (typeof STAGES)[number];
  candidates: Candidate[];
  onAddCandidate?: () => void;
  totalStages: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 10; // Show fewer candidates initially for better performance

  const visibleCandidates = showAll
    ? candidates
    : candidates.slice(0, INITIAL_LIMIT);
  const hasMore = candidates.length > INITIAL_LIMIT;

  // Make the column droppable
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${stage.id}`,
  });

  // Determine if we should use flexible width (for fewer stages) or fixed width
  const shouldUseFlex = totalStages <= 4;

  // header  and count
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] h-[400px] sm:h-[500px] lg:h-screen transition-all duration-200 bg-card/50 backdrop-blur-sm shadow-md border border-border rounded-lg scroll-smooth",
        shouldUseFlex
          ? "w-full sm:flex-1 sm:min-w-[280px]"
          : "w-full sm:w-72 flex-shrink-0",
        isOver &&
          "ring-2 ring-emerald-500/50 shadow-lg scale-[1.02] bg-emerald-50/50 dark:bg-emerald-900/20"
      )}>
      {/* Column Header */}
      <div className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4 border-b-black/45 dark:border-b-white/20 border-b-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div
              className={cn(
                "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm",
                stage.color
              )}
            />
            <div className="flex flex-col">
              <h3 className="font-semibold text-foreground text-xs sm:text-sm">
                {stage.label}
              </h3>
            </div>
          </div>

          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 transition-colors",
              candidates.length > 0 &&
                "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
            )}>
            {candidates.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div
        className={cn(
          "flex-1 p-2 sm:p-3 overflow-y-auto transition-all duration-200",
          isOver
            ? "bg-emerald-50/30 dark:bg-emerald-900/10"
            : "bg-background/50"
        )}>
        <SortableContext
          items={visibleCandidates.map((c) => c.id)}
          strategy={verticalListSortingStrategy}>
          <div className="space-y-2 sm:space-y-3">
            {visibleCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="group">
                <DraggableCandidateCard candidate={candidate} />
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Load More Button */}
        {hasMore && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full mt-2 sm:mt-3 text-xs h-8 sm:h-9 border border-dashed border-muted-foreground/30 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Show {candidates.length - INITIAL_LIMIT} more
          </Button>
        )}

        {/* Empty State */}
        {candidates.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center h-32 sm:h-48 text-muted-foreground text-center rounded-lg border-2 border-dashed transition-all duration-200",
              isOver
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 scale-105"
                : "border-muted-foreground/20 hover:border-muted-foreground/40"
            )}>
            <div
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors",
                isOver ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-muted/50"
              )}>
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <p className="text-xs sm:text-sm font-medium mb-1">
              {isOver ? "Drop candidate here" : "No candidates"}
            </p>
            <p className="text-[10px] sm:text-xs opacity-75 px-2">
              {isOver
                ? `Add to ${stage.label}`
                : `No candidates in ${stage.label.toLowerCase()}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CandidateKanbanProps {
  candidates: Candidate[];
  onCandidatesChange: (candidates: Candidate[]) => void;
  activeStageGroup?: string;
}

export default function CandidateKanban({
  candidates,
  onCandidatesChange,
  activeStageGroup = "all",
}: CandidateKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

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

  // Define stage groups for filtering display
  const STAGE_GROUPS = [
    {
      id: "all",
      label: "All Stages",
      stages: ["applied", "screen", "technical", "offer", "hired", "rejected"],
    },
    {
      id: "early",
      label: "Early Stage",
      stages: ["applied", "screen", "technical"],
    },
    {
      id: "active",
      label: "Active Process",
      stages: ["screen", "technical", "offer"],
    },
    {
      id: "final",
      label: "Final Status",
      stages: ["offer", "hired", "rejected"],
    },
  ];

  // Filter stages based on active group
  const visibleStages = useMemo(() => {
    if (activeStageGroup === "all") {
      return STAGES;
    }

    const activeGroup = STAGE_GROUPS.find((g) => g.id === activeStageGroup);
    if (!activeGroup) return STAGES;

    return STAGES.filter((stage) => activeGroup.stages.includes(stage.id));
  }, [activeStageGroup]);

  // Group candidates by stage with memoization for performance
  const candidatesByStage = useMemo(() => {
    const result: Record<string, Candidate[]> = {};
    visibleStages.forEach((stage) => {
      result[stage.id] = candidates.filter((c) => c.stage === stage.id);
    });
    return result;
  }, [candidates, visibleStages]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the candidate being dragged
    const activeCandidate = candidates.find((c) => c.id === activeId);
    if (!activeCandidate) return;

    // Determine the target stage
    let targetStage: string | null = null;

    // Check if we're over a candidate (move to their stage)
    const overCandidate = candidates.find((c) => c.id === overId);
    if (overCandidate) {
      targetStage = overCandidate.stage;
    } else if (overId.startsWith("droppable-")) {
      // Check if we're over a droppable column area
      targetStage = overId.replace("droppable-", "");
    }

    // Validate that the target stage exists in our stages
    const validStage = STAGES.find((s) => s.id === targetStage);
    if (!validStage || activeCandidate.stage === targetStage) return;

    // Update candidate stage optimistically
    const updatedCandidates = candidates.map((c) =>
      c.id === activeId ? { ...c, stage: targetStage as Candidate["stage"] } : c
    );

    onCandidatesChange(updatedCandidates);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!active) return;

    const activeId = active.id as string;
    const activeCandidate = candidates.find((c) => c.id === activeId);
    if (!activeCandidate) return;

    try {
      await apiClient.updateCandidate(activeId, {
        stage: activeCandidate.stage,
        updatedAt: new Date(),
      });

      // Force parent to re-render with updated candidates
      const updatedCandidates = candidates.map((c) =>
        c.id === activeId
          ? { ...c, stage: activeCandidate.stage, updatedAt: new Date() }
          : c
      );
      onCandidatesChange(updatedCandidates);

      toast({
        title: "Success",
        description: `Candidate moved to ${
          STAGES.find((s) => s.id === activeCandidate.stage)?.label
        }`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update candidate stage. Please try again.",
        variant: "warning",
      });

      // Rollback the optimistic update
      onCandidatesChange([...candidates]);
    }
  };

  const activeDragCandidate = activeId
    ? candidates.find((c) => c.id === activeId)
    : null;

  // Determine if we need horizontal scroll or flex layout
  const shouldUseFlex = visibleStages.length <= 4;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}>
      {/* Mobile: Vertical stack, Desktop: Horizontal scroll or flex */}
      <div className="relative rounded-lg overflow-hidden">
        <div
          className={cn(
            "relative w-full z-10 flex flex-col md:flex-row gap-3 sm:gap-4 p-2 sm:p-3 lg:p-4",
            "min-h-screen",
            shouldUseFlex ? "" : "md:overflow-x-auto",
            isDragging && "cursor-grabbing"
          )}>
          {visibleStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              candidates={candidatesByStage[stage.id] || []}
              totalStages={visibleStages.length}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeDragCandidate ? (
          <DraggableCandidateCard candidate={activeDragCandidate} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
