import { ChevronLeft, ChevronRight } from "lucide-react";

// Presentational page controls. Products owns URL/API state; this child only reports
// the requested page through onPageChange and prevents invalid page navigation.
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="mt-14 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="flex h-11 w-11 items-center justify-center border border-border/15 transition enabled:hover:border-primary enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, idx) =>
        page === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 text-muted-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`flex h-11 min-w-11 items-center justify-center px-3 text-sm font-medium transition ${
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "border border-border/15 text-foreground hover:border-primary/40"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="flex h-11 w-11 items-center justify-center border border-border/15 transition enabled:hover:border-primary enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
