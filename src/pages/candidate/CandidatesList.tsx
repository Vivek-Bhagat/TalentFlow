import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Loader,
  ListFilter,
  SlidersHorizontal,
} from "lucide-react";
import { apiClient } from "@/api";
import type { Candidate } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import VirtualizedCandidateList from "@/components/Candidates/VirtualizeCandidateList";

const CandidatesList = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("order");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  // Debounce search term to reduce filtering frequency
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch candidates only once
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await apiClient.getCandidates({ pageSize: 500 });
        setCandidates(response.candidates);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Memoized filtered candidates with client-side search
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    // Apply search filter with debounced term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower) ||
          candidate.position.toLowerCase().includes(searchLower) ||
          candidate.location.toLowerCase().includes(searchLower) ||
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(searchLower)
          )
      );
    }

    // Apply stage filter
    if (stageFilter !== "all") {
      filtered = filtered.filter(
        (candidate) => candidate.stage === stageFilter
      );
    }

    // Apply sorting (skip if "order" is selected to maintain original order)
    if (sortBy !== "order") {
      filtered = [...filtered].sort((a, b) => {
        const field = sortBy;
        const isDescending = sortOrder === "desc";

        let aVal: any = a[field as keyof Candidate];
        let bVal: any = b[field as keyof Candidate];

        // Handle different types
        if (typeof aVal === "string" && typeof bVal === "string") {
          const comparison = aVal.localeCompare(bVal);
          return isDescending ? -comparison : comparison;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          const comparison = aVal.getTime() - bVal.getTime();
          return isDescending ? -comparison : comparison;
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          const comparison = aVal - bVal;
          return isDescending ? -comparison : comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [candidates, debouncedSearchTerm, stageFilter, sortBy, sortOrder]);

  // Memoized handlers to prevent child re-renders
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleStageFilterChange = useCallback((value: string) => {
    setStageFilter(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  const handleSortOrderChange = useCallback((value: string) => {
    setSortOrder(value);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          {/* <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div> */}
          <Loader className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="px-4 py-2 space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}>
      {/* Header */}
      <motion.div
        className=""
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        <div>
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}>
            Candidates Lists
          </motion.h1>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full p-0">
        <div className="p-0">
          <div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4  s">
                <Select
                  value={stageFilter}
                  onValueChange={handleStageFilterChange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <ListFilter className="h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="appliedDate">Applied Date</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortOrder}
                  onValueChange={handleSortOrderChange}
                  disabled={sortBy === "order"}>
                  <SelectTrigger className=" sm:w-[150px]">
                    <Filter className="h-4 w-4 " />
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Des</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Virtualized Candidates List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}>
        <VirtualizedCandidateList
          candidates={filteredCandidates}
          loading={false}
        />
      </motion.div>
    </motion.div>
  );
};

export default CandidatesList;
