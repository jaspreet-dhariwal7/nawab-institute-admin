import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const goToPage = (nextPage) => {
    onPageChange(Math.min(Math.max(nextPage, 1), totalPages));
  };

  return (
    <div className="flex flex-col gap-3 border-t border-outline-variant bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] font-semibold text-on-surface-variant">
        Showing <span className="text-primary">{start}-{end}</span> of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-on-surface-variant">Rows</span>
          <select
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
              onPageChange(1);
            }}
            className="rounded-lg border border-outline-variant bg-white px-2 py-1.5 text-[12px] font-bold text-primary outline-none focus:border-primary"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div> */}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              className={`h-8 min-w-8 rounded-lg px-2 text-[12px] font-bold transition-colors ${
                item === page
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant text-on-surface hover:bg-surface-container"
              }`}
            >
              {item}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
