import { useEffect, useState } from "react";
import { Download, Edit, Eye, Plus, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import Pagination from "../common/Pagination.jsx";
import { callApi } from "../../services/ApiService.js";
import instituteLogo from "../../assets/nite_logo.png";
import Loader from "../common/Loader.jsx";

const getCourseName = (course) => {
  if (!course) return "";
  if (typeof course === "object") return course.title || course.name || "";
  return String(course);
};

const normalizeStudent = (student) => ({
    ...student,
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    rollNumber: student.roll_number || student.rollNumber || "",
    courseName: student.course_title || student.course_name || getCourseName(student.course),
    admissionDate: student.admission_date || student.admissionDate || "",
    guardianName: student.guardian_name || student.guardianName || student.father_name || student.fatherName || "",
    guardianPhone: student.guardian_phone || student.guardianPhone || "",
    fatherName: student.father_name || student.fatherName || student.guardian_name || student.guardianName || "",
    address: student.address || "",
    status: student.status || "",
    feesStatus: student.fees_status || student.feesStatus || "",
    avatarUrl: student.photo || student.profile_photo || student.profilePhoto || student.avatar || "",
    idProofUrl: student.id_proof || student.idProof || "",
    highestQualificationUrl: student.highest_qualification || student.highestQualification || "",
});

const getStudentList = (data) => {
  const list = data?.results || [];

  return list.map((student) => normalizeStudent(student));
};

const getStudentTotal = (data) => {
  const total = Number(data?.count);
  return Number.isFinite(total) ? total : 0;
};

const getStudentInitials = (name) => {
  const initials = String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "S";
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isImageUrl = (url) => /\.(apng|avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(String(url || ""));

const getFileNameFromUrl = (url) => {
  if (!url) return "";

  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    return String(url).split(/[/?#]/).filter(Boolean).pop() || "";
  }
};

const DetailField = ({ label, value, className = "" }) => (
  <div className={className}>
    <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">{label}</label>
    <div className="min-h-[40px] rounded-lg border border-outline-variant bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold text-slate-700">
      {value || "-"}
    </div>
  </div>
);

const DocumentPreview = ({ label, url }) => (
  <div>
    <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">{label}</label>
    <div className="mb-2 grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-outline-variant bg-slate-50">
      {url ? (
        isImageUrl(url) ? (
          <img src={url} alt={`${label} preview`} className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">{getFileNameFromUrl(url) || "Document"}</span>
        )
      ) : (
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">No file</span>
      )}
    </div>
    {url && (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex text-[12px] font-bold text-primary hover:underline"
      >
        View file
      </a>
    )}
  </div>
);

const StudentIdCardPreview = ({ student }) => (
  <div className="sm:col-span-2">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h4 className="text-[14px] font-extrabold text-primary">ID Card</h4>
      <button
        onClick={() => downloadStudentIdCard(student)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
      >
        <Download className="h-4 w-4" />
        Download
      </button>
    </div>
    <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
      <div className="bg-primary px-4 py-4 text-on-primary">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
            <img src={instituteLogo} alt="Institute logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <div className="text-[17px] font-extrabold leading-tight">NITE</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">Student ID Card</div>
          </div>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="mb-5 flex justify-center">
          <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-slate-100 text-[26px] font-extrabold text-primary">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              getStudentInitials(student.name)
            )}
          </div>
        </div>
        <div className="mb-5 text-center">
          <div className="text-[18px] font-extrabold text-slate-900">{student.name || "-"}</div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Father Name", value: student.fatherName },
            { label: "Phone Number", value: student.phone },
            { label: "Roll No.", value: student.rollNumber },
            { label: "Address", value: student.address },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
              <div className="break-words text-[13px] font-semibold text-slate-800">{item.value || "-"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const loadCardImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Missing image source"));
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const drawWrappedText = (context, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  const words = String(text || "").split(" ").filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);

  lines.slice(0, maxLines).forEach((line, index) => {
    const visibleLine = index === maxLines - 1 && lines.length > maxLines ? `${line.replace(/\.+$/, "")}...` : line;
    context.fillText(visibleLine, x, y + index * lineHeight);
  });
};

const drawRoundImage = (context, image, x, y, size) => {
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, x, y, size, size);
  context.restore();
};

const downloadStudentIdCard = async (student) => {
  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 360;
  const height = 560;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#dbe3ee";
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(18, 18, 324, 524, 18);
  context.fill();
  context.stroke();

  context.fillStyle = "#0f3b66";
  context.beginPath();
  context.roundRect(18, 18, 324, 96, 18);
  context.fill();
  context.fillRect(18, 82, 324, 32);

  try {
    const logo = await loadCardImage(instituteLogo);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(62, 66, 28, 0, Math.PI * 2);
    context.fill();
    drawRoundImage(context, logo, 38, 42, 48);
  } catch {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(62, 66, 28, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#0f3b66";
    context.font = "700 15px Arial";
    context.textAlign = "center";
    context.fillText("NITE", 62, 71);
  }

  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = "800 20px Arial";
  context.fillText("NITE", 102, 58);
  context.font = "700 11px Arial";
  context.fillText("STUDENT ID CARD", 102, 79);

  context.fillStyle = "#eef6ff";
  context.beginPath();
  context.roundRect(120, 138, 120, 120, 60);
  context.fill();

  try {
    const photo = await loadCardImage(student.avatarUrl);
    drawRoundImage(context, photo, 120, 138, 120);
  } catch {
    context.fillStyle = "#0f3b66";
    context.font = "800 34px Arial";
    context.textAlign = "center";
    context.fillText(getStudentInitials(student.name), 180, 209);
  }

  context.textAlign = "center";
  context.fillStyle = "#0f172a";
  context.font = "800 21px Arial";
  drawWrappedText(context, student.name || "Student", 180, 296, 250, 24, 2);

  const fields = [
    ["Father Name", student.fatherName],
    ["Phone Number", student.phone],
    ["Roll No.", student.rollNumber],
    ["Address", student.address],
  ];

  context.textAlign = "left";
  let y = 350;
  fields.forEach(([label, value]) => {
    context.fillStyle = "#64748b";
    context.font = "700 10px Arial";
    context.fillText(label.toUpperCase(), 44, y);
    context.fillStyle = "#111827";
    context.font = "700 14px Arial";
    drawWrappedText(context, value || "-", 44, y + 20, 272, 18, label === "Address" ? 3 : 1);
    y += label === "Address" ? 74 : 54;
  });

  const fileName = `id-card-${String(student.rollNumber || student.name || "student")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}.png`;
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

const renderStudentRow = (student, setSelectedStudent) => {
  const initials = getStudentInitials(student.name);

  return (
    <tr key={student.id} className="hover:bg-surface-container/40 text-start">
      <td className="px-4 py-3">
        <div className="flex max-w-[220px] items-start justify-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[12px] font-bold uppercase text-slate-700">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="text-left">
            <div className="font-bold text-primary">{student.name}</div>
            <div className="text-[12px] text-on-surface-variant">{student.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] font-semibold text-primary">{student.rollNumber}</td>
      <td className="px-4 py-3 text-[13px] text-on-surface-variant">{student.courseName}</td>
      <td className="px-4 py-3 text-[13px] text-on-surface-variant">{student.phone}</td>
      <td className="px-4 py-3">
        <div className="flex justify-start gap-1">
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
        </div>
      </td>
    </tr>
  );
};

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
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

  useEffect(() => {
    if (!selectedStudent?.id) return undefined;

    let isActive = true;

    const fetchStudentDetail = async () => {
      try {
        setStudentDetailLoading(true);
        const response = await callApi({
          url: `/students/${selectedStudent.id}/`,
          method: "get",
        });

        if (isActive) {
          setSelectedStudent((current) => (current?.id === selectedStudent.id ? normalizeStudent({ ...current, ...response }) : current));
        }
      } catch {
        if (isActive) {
          setSelectedStudent((current) => (current ? normalizeStudent(current) : current));
        }
      } finally {
        if (isActive) {
          setStudentDetailLoading(false);
        }
      }
    };

    fetchStudentDetail();

    return () => {
      isActive = false;
    };
  }, [selectedStudent?.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Student Management</h1>
          <div className="mt-1 text-[13px] text-on-surface-variant">
            {loading ? <Loader label="Loading students..." /> : `${totalStudents} students found`}
          </div>
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
          <table className="w-full min-w-[760px]">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Student", "Roll Number", "Course", "Phone", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase text-left tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {students.map((student) => renderStudentRow(student, setSelectedStudent))}
              {loading && (
                <tr>
                  <td colSpan={5}>
                    <Loader variant="block" label="Loading students..." />
                  </td>
                </tr>
              )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedStudent(null)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <h3 className="text-[20px] font-extrabold text-primary">Student Detail</h3>
                <div className="mt-1 text-[13px] text-on-surface-variant">
                  {studentDetailLoading ? <Loader label="Loading complete details..." /> : "View student profile and enrollment details."}
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="Close student detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div className="flex flex-col items-center text-center sm:col-span-2">
                <label className="mb-3 block text-[12px] font-bold text-on-surface-variant">Profile Photo</label>
                <div className="mb-3 grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-outline-variant bg-slate-50 text-[26px] font-extrabold text-primary">
                  {selectedStudent.avatarUrl ? (
                    <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="h-full w-full object-cover" />
                  ) : (
                    getStudentInitials(selectedStudent.name)
                  )}
                </div>
              </div>

              <DetailField label="Full Name" value={selectedStudent.name} />
              <DetailField label="Roll Number" value={selectedStudent.rollNumber} />
              <DetailField label="Email" value={selectedStudent.email} />
              <DetailField label="Phone" value={selectedStudent.phone} />
              <DetailField label="Course" value={selectedStudent.courseName} />
              <DetailField label="Admission Date" value={formatDate(selectedStudent.admissionDate)} />
              <DetailField label="Guardian Name" value={selectedStudent.guardianName} />
              <DetailField label="Guardian Phone" value={selectedStudent.guardianPhone} />

              <DocumentPreview label="ID Proof" url={selectedStudent.idProofUrl} />
              <DocumentPreview label="Highest Qualification" url={selectedStudent.highestQualificationUrl} />

              <DetailField label="Address" value={selectedStudent.address} className="sm:col-span-2" />
              <StudentIdCardPreview student={selectedStudent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
