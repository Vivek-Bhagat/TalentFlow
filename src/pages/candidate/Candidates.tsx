import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, AlertCircle, UserPlus } from "lucide-react";
import type { Candidate } from "@/types";
import { apiClient } from "@/api";
import { useToast } from "@/hooks/use-toast";
import VirtualizedCandidateList from "@/components/Candidates/VirtualizeCandidateList";

const stages = [
  { key: "all", label: "All Candidates" },
  { key: "applied", label: "Applied" },
  { key: "screen", label: "Screening" },
  { key: "technical", label: "Technical" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

export default function Candidates() {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const { toast } = useToast();

  // Fetch all candidates once
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getCandidates({
        stage: stageFilter === "all" ? undefined : stageFilter,
      });

      setAllCandidates(response.candidates);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch candidates";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates client-side for real-time search
  const filteredCandidates = useMemo(() => {
    let filtered = allCandidates;

    // Client-side search (name/email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allCandidates, searchQuery]);

  // Calculate stage counts for current filtered results
  const stageCounts = useMemo(() => {
    const counts = stages.reduce((acc, stage) => {
      acc[stage.key] =
        stage.key === "all"
          ? filteredCandidates.length
          : filteredCandidates.filter((c) => c.stage === stage.key).length;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  }, [filteredCandidates]);

  useEffect(() => {
    fetchCandidates();
  }, [stageFilter]); // Re-fetch when stage filter changes

  if (error && !loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground">
              Manage and track candidate applications
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Failed to load candidates
            </h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={fetchCandidates}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground">
            {loading
              ? "Loading..."
              : `${filteredCandidates.length.toLocaleString()} candidates found`}
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {stages.map((stage) => (
                <Button
                  key={stage.key}
                  variant={stageFilter === stage.key ? "default" : "outline"}
                  onClick={() => setStageFilter(stage.key)}
                  size="sm"
                  className="flex items-center gap-2">
                  {stage.label}
                  <Badge
                    variant="secondary"
                    className="text-xs">
                    {stageCounts[stage.key] || 0}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates by name or email... (real-time client-side search)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Stats */}
            {searchQuery && (
              <div className="mt-2 text-sm text-muted-foreground">
                Found {filteredCandidates.length} candidate
                {filteredCandidates.length !== 1 ? "s" : ""}
                {searchQuery ? ` matching "${searchQuery}"` : ""}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                High Performance List
              </h3>
              <p className="text-sm text-muted-foreground">
                Displaying {allCandidates.length.toLocaleString()} candidates
                with virtualized rendering for optimal performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtualized Candidates List */}
      <VirtualizedCandidateList
        candidates={filteredCandidates}
        loading={loading}
      />
    </motion.div>
  );
}
