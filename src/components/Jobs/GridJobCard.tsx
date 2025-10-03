import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  DollarSign,
  Archive,
  RotateCcw,
  Eye,
  Loader,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {  GridJobCardProps } from "@/types";

const GridJobCard = memo(function GridJobCard({
  job,
  orderNumber,
  onArchiveToggle,
  archivingJob,
  onView,
}: GridJobCardProps) {
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-card border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2.5 py-1 border-primary/40 text-primary">
              #{orderNumber}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Job ID: {job.id}
            </span>
          </div>
          <Badge
            className={cn(
              "text-xs px-2.5 py-1 border shadow-sm rounded-3xl",
              getStatusColor(job.status)
            )}>
            {job.status === "active" ? "Active" : "Archived"}
          </Badge>
        </div>

        {/* Job Title */}
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-1">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground">{job.department}</p>
        </div>

        {/* Job Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0 text-purple-500" />
            <span className="capitalize">{job.type.replace("-", " ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span className="font-medium text-foreground">
              {formatSalary(job.salary.min, job.salary.max)}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {job.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-muted/50 hover:bg-primary/10 transition-colors">
              {tag}
            </Badge>
          ))}
          {job.tags.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 border-primary/30 text-primary">
              +{job.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onView(job);
            }}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Job
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
              "flex-1 text-xs h-8",
              job.status === "active"
                ? "hover:bg-muted"
                : "hover:bg-emerald-50 hover:border-emerald-300"
            )}>
            {archivingJob === job.id ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : job.status === "active" ? (
              <>
                <Archive className="h-3.5 w-3.5 mr-1.5" />
                Archive
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Activate
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {job.applicationCount} applications •{" "}
          {new Date(job.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </motion.div>
  );
});

export default GridJobCard;
