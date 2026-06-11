import { useEffect, useState } from "react";
import { Download, Edit, Eye, Plus, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import Pagination from "../common/Pagination.jsx";
import { callApi } from "../../services/ApiService.js";
import instituteLogo from "../../assets/nite-logo.jpg";
import Loader from "../common/Loader.jsx";
import NoDataFound from "../common/NoDataFound.jsx";

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
    session: student.session || student.dob || student.date_of_birth || student.dateOfBirth || "",
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

const STUDENT_ID_CARD_EXPORT_WIDTH = 540;
const STUDENT_ID_CARD_EXPORT_HEIGHT = 860;
const STUDENT_ID_CARD_PREVIEW_WIDTH = 420;
const STUDENT_ID_CARD_PREVIEW_HEIGHT =
  (STUDENT_ID_CARD_PREVIEW_WIDTH * STUDENT_ID_CARD_EXPORT_HEIGHT) / STUDENT_ID_CARD_EXPORT_WIDTH;

const StudentIdCardPreview = ({ student }) => {
  const topDetails = [
    ["Student Name", student.name],
    ["Course", student.courseName],
    // ["Session", "2026"],
    ["Roll Number", student.rollNumber],
  ];

  const infoRows = [
    // ["Father Name", student.fatherName],
    ["DOB", formatDate(student.session)],
    // ["Gender", "Male"],
    // ["Blood Group", "B+"],
    ["Phone", student.phone],
    ["Email", student.email],
    ["Address", student.address],
  ];

  return (
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

      <div
        className="mx-auto flex w-full flex-col overflow-hidden rounded-[26px] border border-[#d59a21]/40 bg-white shadow-xl"
        style={{
          maxWidth: `${STUDENT_ID_CARD_PREVIEW_WIDTH}px`,
          minHeight: `${STUDENT_ID_CARD_PREVIEW_HEIGHT}px`,
          aspectRatio: `${STUDENT_ID_CARD_EXPORT_WIDTH} / ${STUDENT_ID_CARD_EXPORT_HEIGHT}`,
        }}
      >
        <div className="relative shrink-0 bg-[#082d61] px-6 pb-7 pt-5 text-white">
          <div className="absolute inset-x-0 bottom-0 h-2 bg-[#d59a21]" />
          <div className="relative flex items-center gap-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-[#d59a21] bg-white p-2 shadow-md">
              <img src={instituteLogo} alt="Institute logo" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[38px] font-black leading-none tracking-[0.2em]">NITE</h2>
              <p className="mt-2 text-[11px] font-bold uppercase leading-tight tracking-wide text-[#f4d28b]">
                Nawab Institute Of Technical Education
              </p>
            </div>
          </div>
        </div>
          <div className="relative mt-5 flex shrink-0 items-center gap-3">
            <span className="h-px flex-1 bg-[#d59a21]" />
            <span className="rounded-lg bg-primary px-5 py-2 text-[16px] font-black uppercase tracking-wide text-white shadow-sm">
              Student ID Card
            </span>
            <span className="h-px flex-1 bg-[#d59a21]" />
          </div>

        <div className="relative flex flex-1 flex-col px-5 py-5">
          <img
            src={instituteLogo}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-12 right-2 h-44 w-44 object-contain opacity-[0.05]"
          />

          <div className="relative grid grid-cols-[132px_1fr] gap-4">
            <div>
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="h-[172px] w-[132px] rounded-xl border-2 border-[#d59a21] object-cover shadow-sm"
                />
              ) : (
                <div className="grid h-[172px] w-[132px] place-items-center rounded-xl border-2 border-[#d59a21] bg-[#f5f8fc] text-[34px] font-black text-[#082d61] shadow-sm">
                  {getStudentInitials(student.name)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {topDetails.map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#082d61]">{label}</p>
                  <p className="mt-0.5 break-words text-[13px] font-extrabold leading-snug text-slate-900">{value || "-"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#d59a21]" />
            <span className="h-3 w-3 rotate-45 bg-[#d59a21]" />
            <span className="h-px flex-1 bg-[#d59a21]" />
          </div>

          <div className="relative space-y-0">
            {infoRows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[96px_10px_1fr] items-start rounded-lg px-3 py-1 text-[12px] leading-tight"
              >
                <span className="font-black uppercase text-[#082d61]">{label}</span>
                <span className="font-black text-[#082d61]">:</span>
                <span className="break-words font-semibold text-slate-900">{value || "-"}</span>
              </div>
            ))}
          </div>

          <div className="relative mt-auto flex justify-end pt-8">
            <div className="w-44 text-center">
              <div className="border-t border-slate-800" />
              <p className="mt-2 text-[12px] font-bold text-slate-900">Authorized Signature</p>
              <p className="text-[10px] font-semibold text-slate-500">(Director / Principal)</p>
            </div>
          </div>
        </div>

        <div className="h-8 shrink-0 bg-[#082d61]">
          <div className="h-2 bg-[#d59a21]" />
        </div>
      </div>
    </div>
  );
};

const downloadStudentIdCard = async (student) => {
  const width = 420;
  const outputWidth = STUDENT_ID_CARD_EXPORT_WIDTH;
  const outputHeight = STUDENT_ID_CARD_EXPORT_HEIGHT;
  const scale = outputWidth / width;
  const height = outputHeight / scale;
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const navy = "#082d61";
  const gold = "#d59a21";
  const cardBg = "#ffffff";
  const white = "#ffffff";
  const slate900 = "#0f172a";
  const slate500 = "#64748b";

  // ── helpers ──────────────────────────────────────────
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const loadImg = (src) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

  const drawCircleClippedImage = (img, cx, cy, r, padding = 0) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - r + padding, cy - r + padding, (r - padding) * 2, (r - padding) * 2);
    ctx.restore();
  };

  const drawRoundedImage = (img, x, y, w, h, r) => {
    ctx.save();
    roundRect(x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  };

  const wrapText = (text, x, y, maxWidth, lineHeight, maxLines = 99) => {
    const words = String(text || "-").split(" ");
    let line = "";
    let lineCount = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        if (lineCount >= maxLines - 1) {
          ctx.fillText(line.trimEnd() + "…", x, y);
          return;
        }
        ctx.fillText(line.trimEnd(), x, y);
        line = words[i] + " ";
        y += lineHeight;
        lineCount++;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trimEnd(), x, y);
  };

  const logo = await loadImg(instituteLogo).catch(() => null);

  // ── card background ───────────────────────────────────
  ctx.fillStyle = cardBg;
  roundRect(0, 0, width, height, 26);
  ctx.fill();

  // ── navy header ───────────────────────────────────────
  const headerH = 140;
  ctx.save();
  roundRect(0, 0, width, height, 26);
  ctx.clip();
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, width, headerH);
  ctx.fillStyle = gold;
  ctx.fillRect(0, headerH - 8, width, 8);
  ctx.restore();

  // ── logo circle ───────────────────────────────────────
  const logoCX = 72, logoCY = 68, logoR = 48;
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR - 4, 0, Math.PI * 2);
  ctx.fillStyle = white;
  ctx.fill();
  if (logo) {
    drawCircleClippedImage(logo, logoCX, logoCY, logoR - 8, 8);
  } else {
    ctx.fillStyle = navy;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("NITE", logoCX, logoCY + 5);
  }

  // ── institute name ────────────────────────────────────
  ctx.textAlign = "left";
  ctx.fillStyle = white;
  ctx.font = "900 38px Arial";
  ctx.fillText("NITE", 134, 68);
  ctx.fillStyle = "#f4d28b";
  ctx.font = "700 11px Arial";
  wrapText("NAWAB INSTITUTE OF TECHNICAL EDUCATION", 134, 92, 230, 13, 2);

  // ── Student ID Card badge ─────────────────────────────
  const badgeY = 166;
  // left line
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, badgeY + 10);
  ctx.lineTo(125, badgeY + 10);
  ctx.stroke();
  // badge rect
  ctx.fillStyle = navy;
  roundRect(125, badgeY - 2, 170, 28, 8);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.font = "900 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText("STUDENT ID CARD", 210, badgeY + 17);
  // right line
  ctx.strokeStyle = gold;
  ctx.beginPath();
  ctx.moveTo(295, badgeY + 10);
  ctx.lineTo(396, badgeY + 10);
  ctx.stroke();

  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.drawImage(logo, 252, 368, 176, 176);
    ctx.restore();
  }

  // ── photo ─────────────────────────────────────────────
  const photoX = 20, photoY = 215, photoW = 132, photoH = 172;
  ctx.fillStyle = gold;
  roundRect(photoX - 2, photoY - 2, photoW + 4, photoH + 4, 12);
  ctx.fill();
  if (student.avatarUrl) {
    try {
      const photo = await loadImg(student.avatarUrl);
      drawRoundedImage(photo, photoX, photoY, photoW, photoH, 10);
    } catch {
      ctx.fillStyle = "#f5f8fc";
      roundRect(photoX, photoY, photoW, photoH, 10);
      ctx.fill();
      ctx.fillStyle = navy;
      ctx.font = "900 34px Arial";
      ctx.textAlign = "center";
      ctx.fillText(getStudentInitials(student.name), photoX + photoW / 2, photoY + photoH / 2 + 12);
    }
  } else {
    ctx.fillStyle = "#f5f8fc";
    roundRect(photoX, photoY, photoW, photoH, 10);
    ctx.fill();
    ctx.fillStyle = navy;
    ctx.font = "900 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText(getStudentInitials(student.name), photoX + photoW / 2, photoY + photoH / 2 + 12);
  }

  // ── top detail fields ─────────────────────────────────
  const topDetails = [
    ["Student Name", student.name],
    ["Course", student.courseName],
    ["Roll Number", student.rollNumber],
  ];
  const detailX = 168;
  let detailY = 224;
  topDetails.forEach(([label, value]) => {
    ctx.fillStyle = navy;
    ctx.font = "900 10px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), detailX, detailY);
    ctx.fillStyle = slate900;
    ctx.font = "800 13px Arial";
    wrapText(value || "-", detailX, detailY + 16, 220, 15, label === "Course" ? 2 : 1);
    detailY += label === "Course" ? 48 : 42;
  });

  // ── divider ───────────────────────────────────────────
  const divY = 410;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, divY);
  ctx.lineTo(190, divY);
  ctx.stroke();
  // diamond
  ctx.save();
  ctx.translate(210, divY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(230, divY);
  ctx.lineTo(400, divY);
  ctx.stroke();

  // ── info rows ─────────────────────────────────────────
  const infoRows = [
    ["DOB", formatDate(student.session)],
    ["Phone", student.phone],
    ["Email", student.email],
    ["Address", student.address],
  ];
  let infoY = divY + 24;
  infoRows.forEach(([label, value]) => {

    ctx.fillStyle = navy;
    ctx.font = "900 10px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), 32, infoY);

    ctx.fillStyle = navy;
    ctx.font = "900 10px Arial";
    ctx.fillText(":", 132, infoY);

    ctx.fillStyle = slate900;
    ctx.font = "700 12px Arial";
    wrapText(value || "-", 148, infoY, 240, 14, label === "Address" ? 2 : 1);

    infoY += label === "Address" ? 27 : 19;
  });

  // ── signature ─────────────────────────────────────────
  const sigY = 548;
  ctx.strokeStyle = slate900;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(244, sigY);
  ctx.lineTo(396, sigY);
  ctx.stroke();
  ctx.fillStyle = slate900;
  ctx.font = "700 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Authorized Signature", 320, sigY + 18);
  ctx.fillStyle = slate500;
  ctx.font = "600 10px Arial";
  ctx.fillText("(Director / Principal)", 320, sigY + 32);

  // ── footer ────────────────────────────────────────────
  ctx.save();
  roundRect(0, 0, width, height, 26);
  ctx.clip();
  ctx.fillStyle = navy;
  ctx.fillRect(0, height - 32, width, 32);
  ctx.fillStyle = gold;
  ctx.fillRect(0, height - 32, width, 8);
  ctx.restore();

  // ── card border ───────────────────────────────────────
  ctx.strokeStyle = gold + "66";
  ctx.lineWidth = 1.5;
  roundRect(0, 0, width, height, 26);
  ctx.stroke();

  // ── download ─────────────────────────────────────────
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
             
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <Loader variant="block" label="Loading students..." />
                  </td>
                </tr>
              ) : (
                  students.map((student) => renderStudentRow(student, setSelectedStudent))
              )}
              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <NoDataFound title="No students found" />
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
              <DetailField label="DOB" value={formatDate(selectedStudent.session)} />
              <DetailField label="Guardian Name" value={selectedStudent.guardianName} />
              <DetailField label="Guardian Phone" value={selectedStudent.guardianPhone} />
              <DetailField label="Address" value={selectedStudent.address} />

              <DocumentPreview label="ID Proof" url={selectedStudent.idProofUrl} />
              <DocumentPreview label="Highest Qualification" url={selectedStudent.highestQualificationUrl} />

              <StudentIdCardPreview student={selectedStudent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
