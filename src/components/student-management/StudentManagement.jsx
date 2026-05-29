import { useEffect, useState } from "react";
import { Edit, Eye, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Pagination from "../common/Pagination.jsx";
import { callApi } from "../../services/ApiService.js";

const getCourseName = (course) => {
  if (!course) return "";
  if (typeof course === "object") return course.title || course.name || "";
  return String(course);
};

const getStudentList = (data) => {
  const list = data?.results || [];

  return list.map((student) => ({
    ...student,
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    rollNumber: student.roll_number || student.rollNumber || "",
    courseName: student.course_title || student.course_name || getCourseName(student.course),
    status: student.status || "",
    feesStatus: student.fees_status || student.feesStatus || "",
  }));
};

const getStudentTotal = (data) => {
  const total = Number(data?.count);
  return Number.isFinite(total) ? total : 0;
};

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          url: "/students/",
          method: "get",
          params: {
            page,
            page_size: pageSize,
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });

        if (isActive) {
          setStudents(getStudentList(response));
          setTotalStudents(getStudentTotal(response));
        }
      } catch {
        if (isActive) {
          setStudents([]);
          setTotalStudents(0);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isActive = false;
    };
  }, [page, pageSize, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Student Management</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">{loading ? "Loading students..." : `${totalStudents} students found`}</p>
        </div>
        <Link
          to="/students/add"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </Link>
      </div>

      <div className="rounded-xl border border-outline-variant bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            placeholder="Search students..."
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
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Student", "Roll Number", "Course", "Phone", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase text-center tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-surface-container/40 text-center">
                  <td className="px-4 py-3">
                    <div className="font-bold text-primary">{student.name}</div>
                    <div className="text-[12px] text-on-surface-variant">{student.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-primary">{student.rollNumber}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{student.courseName}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{student.phone}</td>
                  <td className="px-4 py-3 ">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="View student"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/students/edit/${student.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="Edit student"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {/* <button className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Delete student">
                        <Trash2 className="h-4 w-4" />
                      </button> */}
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
          totalItems={totalStudents}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40" onClick={() => setSelectedStudent(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-primary">Student Detail</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-xl text-slate-400 hover:text-gray-600">x</button>
            </div>
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <div className="text-[16px] font-extrabold text-primary">{selectedStudent.name}</div>
              <div className="mt-1 text-[13px] text-slate-500">{selectedStudent.email}</div>
              <div className="text-[13px] text-slate-500">{selectedStudent.phone}</div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Roll Number", value: selectedStudent.rollNumber },
                { label: "Course", value: selectedStudent.courseName },
                { label: "Status", value: selectedStudent.status },
                { label: "Fees Status", value: selectedStudent.feesStatus },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-3.5">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
                  <div className="text-[14px] font-semibold text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
