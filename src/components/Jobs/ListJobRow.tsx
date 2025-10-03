import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Archive,
  RotateCcw,
  Eye,
  Loader,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {  ListJobRowProps } from "@/types";

const ListJobRow = memo(function ListJobRow({
  job,
  orderNumber,
  onArchiveToggle,
  archivingJob,
  onView,
  isReorderMode = false,
}: ListJobRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, disabled: !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatSalary = (min: number, max: number) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    return `$${formatNumber(min)} - $${formatNumber(max)}`;
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200",
        isDragging &&
          "shadow-xl shadow-primary/20 scale-[1.01] z-50 ring-2 ring-primary/30",
        isReorderMode && "cursor-grab active:cursor-grabbing"
      )}>
      <div className="flex flex-col lg:flex-row gap-4 p-6 w-full">
        {/* Left Section */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs font-medium px-2 py-1 border-primary/40 text-primary">
                #{orderNumber}
              </Badge>

              {isReorderMode && (
                <div
                  className="p-1 hover:bg-primary/10 rounded cursor-grab active:cursor-grabbing transition-colors"
                  {...attributes}
                  {...listeners}>
                  <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                Job ID: {job.id}
              </span>
            </div>

            {/* Status Badge */}
            <Badge
              className={cn(
                "text-xs px-2.5 py-1 border shadow-sm",
                getStatusColor(job.status)
              )}>
              {job.status === "active" ? "Active" : "Archived"}
            </Badge>
          </div>

          {/* Job Title */}
          <h3 className="font-semibold text-lg text-foreground truncate">
            {job.title}
          </h3>

          {/* Department + Location + Type + Salary */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              <span>{job.department}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="capitalize">{job.type.replace("-", " ")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>{formatSalary(job.salary.min, job.salary.max)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {job.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-2 py-0.5 bg-muted/50 hover:bg-primary/10 transition-colors">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 4 && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 border-primary/30 text-primary">
                +{job.tags.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Right Section – Actions */}
        <div className="flex flex-col justify-between gap-3 w-full lg:w-auto">
          <div className="flex lg:flex-col sm:flex-row items-end justify-between lg:gap-4">
            {!isReorderMode && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(job);
                  }}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  <span className="sm:inline">View Job</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveToggle(job);
                  }}
                  disabled={archivingJob === job.id}
                  className={cn(
                    "text-xs h-8 px-3 transition-colors cursor-pointer rounded-2xl",
                    job.status === "active"
                      ? "hover:bg-muted hover:border-border"
                      : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-orange-500"
                  )}>
                  {archivingJob === job.id ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : job.status === "active" ? (
                    <>
                      <Archive className="h-3 w-3" />
                      <span className="sm:inline ml-1.5">Archive</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3" />
                      <span className="sm:inline ml-1.5">Activate</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground lg:mt-16">
              Created:{" "}
              {new Date(job.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ListJobRow;
