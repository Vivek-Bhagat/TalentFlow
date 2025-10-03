import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  Loader2,
} from "lucide-react";

import type {
  
  VirtualizedCandidateListProps,
  CandidateItemProps,
} from "@/types";
import { useNavigate } from "react-router-dom";

const CandidateItem = memo(
  ({ candidate, onCandidateClick }: CandidateItemProps) => {
    const navigate = useNavigate();

    const getStatusBadge = (stage: string) => {
      switch (stage) {
        case "applied":
          return <Badge className="status-badge status-pending">Applied</Badge>;
        case "screen":
          return (
            <Badge className="status-badge status-pending">Screening</Badge>
          );
        case "technical":
          return (
            <Badge className="status-badge status-warning">Technical</Badge>
          );
        case "offer":
          return <Badge className="status-badge status-success">Offer</Badge>;
        case "hired":
          return <Badge className="status-badge status-success">Hired</Badge>;
        case "rejected":
          return (
            <Badge className="status-badge status-rejected">Rejected</Badge>
          );
        default:
          return <Badge className="status-badge">{stage}</Badge>;
      }
    };

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    };

    const handleCandidateClick = () => {
      if (onCandidateClick) {
        onCandidateClick(candidate);
      } else {
        navigate(`/app/candidates/${candidate.id}`);
      }
    };

    return (
      <Card
        className="card-hover group cursor-pointer transition-all duration-200 hover:shadow-lg"
        onClick={handleCandidateClick}>
        <CardContent className="px-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={candidate.avatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-foreground truncate">
                    {candidate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.position}
                  </p>
                  {candidate.jobId && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Job ID: {candidate.jobId}
                    </p>
                  )}
                </div>
                <div className="ml-4 shrink-0">
                  {getStatusBadge(candidate.stage)}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center min-w-0">
                  <Mail className="mr-1 h-3 w-3 shrink-0 text-blue-500" />
                  <span className="truncate text-blue-500">
                    {candidate.email}
                  </span>
                </div>
                <div className="flex items-center min-w-0">
                  <Phone className="mr-1 h-3 w-3 shrink-0 text-yellow-500" />
                  <span className="truncate text-green-500">
                    {candidate.phone}
                  </span>
                </div>
                <div className="flex items-center min-w-0">
                  <MapPin className="mr-1 h-3 w-3 shrink-0 text-purple-500" />
                  <span className="truncate text-purple-500">
                    {candidate.location}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {candidate.skills.slice(0, 4).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 4 && (
                  <Badge
                    variant="secondary"
                    className="text-xs">
                    +{candidate.skills.length - 4}
                  </Badge>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Applied {new Date(candidate.appliedAt).toLocaleDateString()}
                  </div>

                  <div className="hidden sm:block">
                    {candidate.experience} experience
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/candidates/${candidate.id}`);
                    }}>
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      // navigate(`/app/messages/compose?to=${candidate.id}`);
                      // Handle message action
                    }}>
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

CandidateItem.displayName = "CandidateItem";

// Improved virtualization with better performance
export default function VirtualizedCandidateList({
  candidates,
  loading = false,
  onCandidateClick,
}: VirtualizedCandidateListProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);
  const itemsPerBatch = 25;

  // Simple slice without complex buffer logic to prevent breaking
  const visibleCandidates = useMemo(() => {
    return candidates.slice(visibleRange.start, visibleRange.end);
  }, [candidates, visibleRange]);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll updates
      scrollTimeoutRef.current = setTimeout(() => {
        // Load more when approaching bottom (300px threshold)
        if (
          scrollHeight - scrollTop - clientHeight < 300 &&
          visibleRange.end < candidates.length
        ) {
          setVisibleRange((prev) => ({
            start: prev.start,
            end: Math.min(prev.end + itemsPerBatch, candidates.length),
          }));
        }
      }, 100); // 100ms debounce for stability
    },
    [candidates.length, visibleRange.end, itemsPerBatch]
  );

  // Reset visible range when candidates change
  useEffect(() => {
    setVisibleRange({
      start: 0,
      end: Math.min(50, candidates.length),
    });

    // Scroll to top when candidates change
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [candidates.length]); // Only trigger on length change, not entire array

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">
          Loading candidates...
        </span>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No candidates found
          </h3>
          <p className="text-muted-foreground text-center">
            Try adjusting your search or filters to find candidates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Performance indicator */}
      <div className="text-sm text-muted-foreground mb-4 flex items-center justify-between  ">
        <span>
          Rendering {visibleCandidates.length} of{" "}
          {candidates.length.toLocaleString()} candidates
        </span>
        {visibleRange.end < candidates.length && (
          <span className="text-xs">Scroll to load more</span>
        )}
      </div>

      {/* Scrollable container with smooth virtualization */}
      <div
        ref={containerRef}
        className="h-[calc(100vh-300px)]  lg:min-h-[600px] overflow-y-auto pr-2 [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]"
        onScroll={handleScroll}>
        <div className="space-y-5">
          {visibleCandidates.map((candidate) => (
            <CandidateItem
              key={candidate.id}
              candidate={candidate}
              onCandidateClick={onCandidateClick}
            />
          ))}
        </div>

        {/* Loading indicator for scroll-based loading */}
        {visibleRange.end < candidates.length && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Scroll down to load more candidates...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
