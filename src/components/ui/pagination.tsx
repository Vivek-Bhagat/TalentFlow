import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { memo } from "react";
import type { PaginationProps } from "@/types";

const Pagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
  }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 px-4 sm:px-6 py-4 border-t">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>

        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          {/* First and Previous buttons - hidden on mobile for space */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="hidden sm:flex">
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {/* Mobile: Show 3 pages */}
            <div className="flex sm:hidden">
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNumber;

                if (totalPages <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage <= 2) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 1) {
                  pageNumber = totalPages - 2 + i;
                } else {
                  pageNumber = currentPage - 1 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className="w-8 h-8 p-0 text-xs">
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            {/* Desktop: Show 5 pages */}
            <div className="hidden sm:flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;

                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className="w-8 h-8 p-0">
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}>
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last button - hidden on mobile for space */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="hidden sm:flex">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

Pagination.displayName = "Pagination";

export default Pagination;
