import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Edit,
  Eye,
  GraduationCap,
  House,
  IdCard,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../common/Pagination.jsx";
import { callApi } from "../../services/ApiService.js";
import idCardLogo from "../../assets/id-card-logo.png";
import employeeStampedSign from "../../assets/employee-stamped-sign.png";
import Loader from "../common/Loader.jsx";
import NoDataFound from "../common/NoDataFound.jsx";
import StudentResultModal from "./StudentResultModal.jsx";

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
    gender: student.gender || "",
    bloodGroup: student.blood_group || student.bloodGroup || "",
    academicSession: student.academic_session || student.academicSession || student.session_year || "",
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

const getResultErrorMessage = (data) => {
  if (!data) return "Unable to load result. Please try again.";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map((item) => getResultErrorMessage(item)).join(" ");
  if (typeof data !== "object") return String(data);

  if (data.detail || data.message || data.error) {
    return String(data.detail || data.message || data.error);
  }

  return Object.entries(data)
    .map(([key, value]) => {
      const message = Array.isArray(value)
        ? value.map((item) => getResultErrorMessage(item)).join(" ")
        : typeof value === "object"
          ? getResultErrorMessage(value)
          : String(value);

      return `${key}: ${message}`;
    })
    .join(" ");
};

const normalizeResultMarks = (data) => {
  const list = Array.isArray(data) ? data : data?.subjects_marks || data?.marks || data?.results || [];

  return list
    .map((mark) => ({
      subject: mark?.subject || mark?.subject_name || mark?.name || "",
      obtainedMarks: mark?.obtained_marks ?? mark?.obtainedMarks ?? mark?.marks ?? mark?.score ?? 0,
      totalMarks: mark?.total_marks ?? mark?.totalMarks ?? 100,
    }))
    .filter((mark) => mark.subject);
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
const STUDENT_ID_CARD_EXPORT_HEIGHT = 760;
const STUDENT_ID_CARD_PREVIEW_WIDTH = 420;
const STUDENT_ID_CARD_PREVIEW_HEIGHT =
  (STUDENT_ID_CARD_PREVIEW_WIDTH * STUDENT_ID_CARD_EXPORT_HEIGHT) / STUDENT_ID_CARD_EXPORT_WIDTH;

const getAcademicSession = (student) => {
  if (student.academicSession) return student.academicSession;
  const admission = new Date(student.admissionDate);
  if (Number.isNaN(admission.getTime())) return "";
  const year = admission.getFullYear();
  return `${year}-${year + 1}`;
};

const getStudentIdCardDetails = (student) => {
  const topDetails = [
    ["Student Name", student.name, User],
    ["Course", student.courseName, GraduationCap],
    ["Session", getAcademicSession(student), CalendarDays],
    ["Roll Number", student.rollNumber, IdCard],
  ].filter(([label, value]) => value || label !== "Session");

  const infoRows = [
    ["Date of Birth", formatDate(student.session), CalendarDays],
    ["Address", student.address, House],
    ["Phone Number", student.phone, Phone],
    ["Email ID", student.email, Mail],
  ];

  return { topDetails, infoRows };
};

// TODO: remove temporary export once visual verification is done
export const StudentIdCardPreview = ({ student }) => {
  const { topDetails, infoRows } = getStudentIdCardDetails(student);

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
        className="relative mx-auto flex w-full flex-col overflow-hidden rounded-[26px] border border-[#d59a21]/40 bg-white shadow-xl"
        style={{
          maxWidth: `${STUDENT_ID_CARD_PREVIEW_WIDTH}px`,
          minHeight: `${STUDENT_ID_CARD_PREVIEW_HEIGHT}px`,
          aspectRatio: `${STUDENT_ID_CARD_EXPORT_WIDTH} / ${STUDENT_ID_CARD_EXPORT_HEIGHT}`,
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden">
          <div className="absolute inset-0 bg-[#082d61]" />
          <div className="absolute left-1/2 top-[30px] h-[200px] w-[181%] -translate-x-1/2 -rotate-2 rounded-[100%] bg-[#d59a21]" />
          <div className="absolute left-1/2 top-[34px] h-[300px] w-[181%] -translate-x-1/2 -rotate-2 rounded-[100%] bg-white" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden">
          <div className="absolute inset-0 bg-[#082d61]" />
          <div className="absolute bottom-[18px] left-1/2 h-[300px] w-[181%] -translate-x-1/2 rotate-2 rounded-[100%] bg-[#d59a21]" />
          <div className="absolute bottom-[28px] left-1/2 h-[300px] w-[181%] -translate-x-1/2 rotate-2 rounded-[100%] bg-white" />
        </div>

        <img
          src={idCardLogo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-20 right-2 h-44 w-44 object-contain opacity-[0.06]"
        />

        <div className="relative flex flex-1 flex-col px-5 pb-10 pt-13">
          <div className="flex items-center justify-center gap-3">
            <img src={idCardLogo} alt="Institute logo" className="h-20 w-20 shrink-0 object-contain" />
            <div className="min-w-0">
              <h2 className="font-serif text-[34px] font-black leading-none tracking-[0.14em] text-[#082d61]">NITE</h2>
              <p className="mt-1 max-w-[200px] font-serif text-[12px] font-bold uppercase leading-snug text-[#082d61]">
                Nawab Institute Of Technical Education
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="h-px flex-1 bg-[#d59a21]" />
                <span className="h-1.5 w-1.5 rotate-45 bg-[#d59a21]" />
                <span className="h-px flex-1 bg-[#d59a21]" />
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#d59a21]" />
            <span className="rounded-lg bg-[#082d61] px-7 py-1.5 text-[15px] font-black uppercase tracking-wide text-white shadow-sm">
              Student ID Card
            </span>
            <span className="h-px w-8 bg-[#d59a21]" />
          </div>

          <div className="mt-5 grid grid-cols-[126px_1fr] gap-4">
            <div>
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="h-[164px] w-[126px] rounded-xl border-2 border-[#d59a21] object-cover shadow-sm"
                />
              ) : (
                <div className="grid h-[160px] w-[120px] place-items-center rounded-md bg-[#f5f8fc] text-[34px] font-black text-[#082d61]">
                  {getStudentInitials(student.name)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {topDetails.map(([label, value, Icon]) => (
                <div key={label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#082d61] text-white">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#082d61]">{label}</p>
                    <p className="break-words text-[13px] font-bold leading-tight text-slate-900">{value || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#d59a21]" />
            <span className="h-2 w-2 rotate-45 bg-[#d59a21]" />
            <span className="h-px flex-1 bg-[#d59a21]" />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              {infoRows.map(([label, value, Icon]) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#082d61] text-white">
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-[#082d61]">{label}</p>
                    <p className="break-words text-[11px] font-bold leading-tight text-slate-900">{value || "-"}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-36 shrink-0 pt-8 text-center">
              <img src={employeeStampedSign} alt="Stamped signature" className="mx-auto -mb-1 h-23 w-23 object-contain" />
              <div className="mx-auto w-28 border-t border-slate-800" />
              <p className="mt-1 text-[10px] font-bold text-slate-900">Authorized Signature</p>
              <p className="text-[9px] font-semibold text-slate-600">(Director / Principal)</p>
            </div>
          </div>
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

  const logo = await loadImg(idCardLogo).catch(() => null);
  const stampedSign = await loadImg(employeeStampedSign).catch(() => null);

  const { topDetails, infoRows } = getStudentIdCardDetails(student);
  const loadIcon = (Icon) =>
    loadImg(
      `data:image/svg+xml;utf8,${encodeURIComponent(
        renderToStaticMarkup(<Icon color="#ffffff" size={24} strokeWidth={2.5} />)
      )}`
    ).catch(() => null);
  const iconList = [...new Set([...topDetails, ...infoRows].map(([, , icon]) => icon))];
  const iconImages = new Map(await Promise.all(iconList.map(async (icon) => [icon, await loadIcon(icon)])));

  const drawIconBadge = (icon, cx, cy, r, iconSize) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = navy;
    ctx.fill();
    const img = iconImages.get(icon);
    if (img) ctx.drawImage(img, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
  };

  // ── card background ───────────────────────────────────
  ctx.fillStyle = cardBg;
  roundRect(0, 0, width, height, 26);
  ctx.fill();

  // ── top & bottom arches ───────────────────────────────
  const archTilt = (-2 * Math.PI) / 180;
  ctx.save();
  roundRect(0, 0, width, height, 26);
  ctx.clip();

  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, width, 120);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(width / 2, 24 + 150, 380, 150, archTilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.ellipse(width / 2, 34 + 150, 380, 150, archTilt, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = navy;
  ctx.fillRect(0, height - 120, width, 120);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(width / 2, height - 18 - 150, 380, 150, -archTilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.ellipse(width / 2, height - 28 - 150, 380, 150, -archTilt, 0, Math.PI * 2);
  ctx.fill();

  if (logo) {
    ctx.globalAlpha = 0.06;
    ctx.drawImage(logo, 236, height - 256, 176, 176);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // ── institute branding ────────────────────────────────
  if (logo) {
    ctx.drawImage(logo, 58, 50, 88, 88);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = navy;
  ctx.letterSpacing = "5px";
  ctx.font = "900 40px Georgia, 'Times New Roman', serif";
  ctx.fillText("NITE", 162, 88);
  ctx.letterSpacing = "0px";
  ctx.font = "700 13px Georgia, 'Times New Roman', serif";
  wrapText("NAWAB INSTITUTE OF TECHNICAL EDUCATION", 162, 108, 200, 15, 2);

  // ── gold ornament ─────────────────────────────────────
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(162, 136);
  ctx.lineTo(248, 136);
  ctx.moveTo(268, 136);
  ctx.lineTo(354, 136);
  ctx.stroke();
  ctx.save();
  ctx.translate(258, 136);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.fillRect(-3.5, -3.5, 7, 7);
  ctx.restore();

  // ── Student ID Card badge ─────────────────────────────
  ctx.strokeStyle = gold;
  ctx.beginPath();
  ctx.moveTo(68, 176);
  ctx.lineTo(100, 176);
  ctx.moveTo(320, 176);
  ctx.lineTo(352, 176);
  ctx.stroke();
  ctx.fillStyle = navy;
  roundRect(108, 158, 204, 36, 12);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.font = "900 17px Arial";
  ctx.textAlign = "center";
  ctx.fillText("STUDENT ID CARD", 210, 182);

  // ── photo ─────────────────────────────────────────────
  // Preview uses px-5 (20px) padding and grid-cols-[126px_1fr] gap-4
  const photoX = 20, photoY = 210;
  if (student.avatarUrl) {
    // Matches preview: h-[164px] w-[126px] rounded-xl border-2 border-[#d59a21]
    const photoW = 126, photoH = 164;
    try {
      const photo = await loadImg(student.avatarUrl);
      drawRoundedImage(photo, photoX, photoY, photoW, photoH, 12);
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      roundRect(photoX, photoY, photoW, photoH, 12);
      ctx.stroke();
    } catch {
      ctx.fillStyle = "#f5f8fc";
      roundRect(photoX, photoY, photoW, photoH, 12);
      ctx.fill();
      ctx.fillStyle = navy;
      ctx.font = "900 34px Arial";
      ctx.textAlign = "center";
      ctx.fillText(getStudentInitials(student.name), photoX + photoW / 2, photoY + photoH / 2 + 12);
    }
  } else {
    // Matches preview: h-[160px] w-[120px] — centered in the 126px column (3px each side)
    const photoW = 120, photoH = 160;
    ctx.fillStyle = "#f5f8fc";
    roundRect(photoX + 3, photoY, photoW, photoH, 8);
    ctx.fill();
    ctx.fillStyle = navy;
    ctx.font = "900 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText(getStudentInitials(student.name), photoX + 63, photoY + photoH / 2 + 12);
  }

  // ── top detail fields ─────────────────────────────────
  // Preview: px-5(20) + photo-col(126) + gap-4(16) + icon-w-7(28) + gap-2.5(10) = text at 200
  // Icon center: 20 + 126 + 16 + 14 = 176
  const detailX = 200;
  let detailY = 216;
  topDetails.forEach(([label, value, icon]) => {
    drawIconBadge(icon, 176, detailY + 7, 12, 14);
    ctx.fillStyle = navy;
    ctx.font = "800 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), detailX, detailY + 5);
    ctx.fillStyle = slate900;
    ctx.font = "700 14px Arial";
    wrapText(value || "-", detailX, detailY + 22, 195, 16, label === "Course" ? 2 : 1);
    detailY += label === "Course" ? 56 : 42;
  });

  // ── divider ───────────────────────────────────────────
  const divY = 392;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, divY);
  ctx.lineTo(194, divY);
  ctx.stroke();
  // diamond
  ctx.save();
  ctx.translate(210, divY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.fillRect(-4.5, -4.5, 9, 9);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(226, divY);
  ctx.lineTo(390, divY);
  ctx.stroke();

  // ── info rows ─────────────────────────────────────────
  let infoY = 410;
  infoRows.forEach(([label, value, icon]) => {
    drawIconBadge(icon, 44, infoY + 11, 12, 12);

    ctx.fillStyle = navy;
    ctx.font = "800 8.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), 64, infoY + 7);

    ctx.fillStyle = slate900;
    ctx.font = "700 11px Arial";
    wrapText(value || "-", 64, infoY + 21, 176, 13, label === "Address" ? 2 : 1);

    infoY += label === "Address" ? 42 : 33;
  });

  // ── signature ─────────────────────────────────────────
  const sigY = 508;
  if (stampedSign) {
    ctx.drawImage(stampedSign, 285, sigY - 75, 75, 75);
  }
  ctx.strokeStyle = slate900;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(264, sigY);
  ctx.lineTo(376, sigY);
  ctx.stroke();
  ctx.fillStyle = slate900;
  ctx.font = "700 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Authorized Signature", 320, sigY + 15);
  ctx.fillStyle = slate500;
  ctx.font = "600 8px Arial";
  ctx.fillText("(Director / Principal)", 320, sigY + 26);

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

const renderStudentRow = (student, setSelectedStudent, setStudentToDelete) => {
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
          <button
            type="button"
            onClick={() => setStudentToDelete(student)}
            className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
            aria-label="Delete student"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSubjects, setResultSubjects] = useState([]);
  const [resultMarks, setResultMarks] = useState([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const resultStudent = selectedStudent
    ? {
        name: selectedStudent.name,
        rollNumber: selectedStudent.rollNumber,
        dob: selectedStudent.session,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        courseName: selectedStudent.courseName,
        admissionDate: selectedStudent.admissionDate,
        address: selectedStudent.address,
        photoUrl: selectedStudent.avatarUrl,
        initials: getStudentInitials(selectedStudent.name),
    }
    : null;

  const closeDeleteModal = () => {
    if (!deleting) {
      setStudentToDelete(null);
    }
  };

  const openResultModal = async () => {
    if (!selectedStudent?.id) return;

    setShowResultModal(true);
    setResultError("");
    setResultSubjects([]);
    setResultMarks([]);

    try {
      setResultLoading(true);
      const response = await callApi({
        url: `/students/${selectedStudent.id}/result/`,
        method: "get",
      });
      const marks = normalizeResultMarks(response);

      if (marks.length === 0) {
        setResultError("No result found for this student.");
        return;
      }

      setResultSubjects(marks.map((mark) => mark.subject));
      setResultMarks(marks.map((mark) => String(mark.obtainedMarks ?? 0)));
    } catch (error) {
      setResultError(getResultErrorMessage(error.response?.data));
    } finally {
      setResultLoading(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await callApi({
        url: `/students/${studentToDelete.id}/`,
        method: "delete",
      });

      setStudents((currentStudents) => currentStudents.filter((student) => student.id !== studentToDelete.id));
      setTotalStudents((currentTotal) => Math.max(currentTotal - 1, 0));
      setSelectedStudent((current) => (current?.id === studentToDelete.id ? null : current));
      toast.success("Student deleted successfully.");
      setStudentToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

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
                  students.map((student) => renderStudentRow(student, setSelectedStudent, setStudentToDelete))
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
              <div className="relative flex flex-col items-center text-center sm:col-span-2">
                <div className="mb-3 flex w-full flex-col items-center gap-3 sm:min-h-[36px] sm:flex-row sm:items-start sm:justify-center">
                  <label className="block text-[12px] font-bold text-on-surface-variant sm:pt-2">Profile Photo</label>
                  <button
                    type="button"
                    onClick={openResultModal}
                    disabled={resultLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:absolute sm:right-0 sm:top-0"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {resultLoading ? "Loading Result..." : "View Result"}
                  </button>
                </div>
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

      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold text-slate-900">Delete Student</h2>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{studentToDelete.name || "this student"}</span>? This action cannot be undone.
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
                onClick={confirmDeleteStudent}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? <Loader variant="button" label="Deleting..." /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && resultStudent && (
        <StudentResultModal
          mode="view"
          student={resultStudent}
          subjects={resultSubjects}
          marks={resultMarks}
          onClose={() => setShowResultModal(false)}
          loading={resultLoading}
          error={resultError}
        />
      )}
    </div>
  );
}
