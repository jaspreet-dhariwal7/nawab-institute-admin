import { useEffect, useState } from "react";
import { AlertTriangle, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../common/Pagination.jsx";
import { callApi } from "../../services/ApiService.js";
import Loader from "../common/Loader.jsx";
import NoDataFound from "../common/NoDataFound.jsx";

const getCourseList = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];

  return list.map((course) => ({
    ...course,
    title: course.title || "",
    description: course.description || "",
    duration: course.duration || "",
    type: course.type || "",
  }));
};

const formatCourseType = (type) => {
  const labels = {
    diploma: "Diploma",
    short_term: "Short-Term",
  };

  return labels[type] || type;
};

export default function CourseManagement() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          url: "/courses/",
          method: "get",
          params: {
            page,
             page_size: pageSize,
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });

        if (isActive) {
          setCourses(getCourseList(response));
          setTotalCourses(response?.count ?? getCourseList(response).length);
        }
      } catch {
        if (isActive) {
          setCourses([]);
          setTotalCourses(0);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      isActive = false;
    };
  }, [page, pageSize, search]);

  const openDeleteModal = (course) => {
    setCourseToDelete(course);
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setCourseToDelete(null);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setDeleting(true);
      await callApi({
        url: `/courses/${courseToDelete.id}/`,
        method: "delete",
      });

      setCourses((currentCourses) => currentCourses.filter((course) => course.id !== courseToDelete.id));
      setTotalCourses((currentTotal) => Math.max(currentTotal - 1, 0));
      toast.success("Course deleted successfully.");
      setCourseToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Course Catalog</h1>
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
             
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <Loader variant="block" label="Loading courses..." />
                  </td>
                </tr>
              )
            :(
               courses.map((course) => (
                <tr key={course.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3">
                    <div className="font-bold text-primary">{course.title}</div>
                    <div className="max-w-[360px] truncate text-[12px] text-on-surface-variant">{course.description}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-on-surface-variant">{formatCourseType(course.type)}</td>
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
                      <button
                        type="button"
                        onClick={() => openDeleteModal(course)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                        aria-label="Delete course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))

            )}
              {!loading && courses.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <NoDataFound title="No courses found" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalCourses}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold text-slate-900">Delete Course</h2>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{courseToDelete.title || "this course"}</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCourse}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? <Loader variant="button" label="Deleting..." /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
