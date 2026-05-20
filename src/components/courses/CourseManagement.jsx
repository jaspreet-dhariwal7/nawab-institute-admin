import { useMemo, useState } from "react";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { mockCourses } from "../../lib/data.js";
import Pagination from "../common/Pagination.jsx";

export default function CourseManagement() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase();
    return mockCourses.filter((course) => {
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.type.toLowerCase().includes(q) ||
        course.duration.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const pageCourses = filteredCourses.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Course Catalog</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">{filteredCourses.length} courses found</p>
        </div>
        <Link
          to="/courses/add"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </Link>
      </div>

      <div className="rounded-xl border border-outline-variant bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            placeholder="Search courses..."
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-outline-variant bg-white py-2 pl-9 pr-3 text-[13px] font-semibold outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Course", "Type", "Duration", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pageCourses.map((course) => (
                <tr key={course.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3">
                    <div className="font-bold text-primary">{course.title}</div>
                    <div className="max-w-[360px] truncate text-[12px] text-on-surface-variant">{course.description}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-on-surface-variant">{course.type}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{course.duration}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/courses/view/${course.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="View course"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/courses/edit/${course.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="Edit course"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Delete course">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredCourses.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
