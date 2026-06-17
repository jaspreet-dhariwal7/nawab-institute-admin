import { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertTriangle, Building2, Download, Edit, Eye, IdCard, Mail, Phone, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../../lib/utlis.js";
import { callApi } from "../../services/ApiService.js";
import Pagination from "../common/Pagination.jsx";
import idCardLogo from "../../assets/id-card-logo.png";
import employeeStampedSign from "../../assets/employee-stamped-sign.png";
import Loader from "../common/Loader.jsx";
import NoDataFound from "../common/NoDataFound.jsx";

const ROLE_OPTIONS = [
  { label: "Teacher", value: "teacher" },
  { label: "Faculty", value: "faculty" },
  { label: "Lab Instructor", value: "lab_instructor" },
  { label: "Admin Staff", value: "admin_staff" },
  { label: "Accountant", value: "accountant" },
];

const STATUS_OPTIONS = [
  { label: "Working", value: "working" },
  { label: "Resigned", value: "resigned" },
  { label: "Terminated", value: "terminated" },
];

const EMPTY_FORM = {
  id: "",
  employeeId: "",
  name: "",
  email: "",
  phone: "",
  role: "teacher",
  department: "",
  joiningDate: "",
  exitDate: "",
  status: "working",
  profilePhoto: null,
  profilePhotoUrl: "",
};

const fieldMap = {
  photo: "profilePhoto",
  employee_id: "employeeId",
  joining_date: "joiningDate",
  exit_date: "exitDate",
};

const useObjectUrl = (file) => {
  const url = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
};

const getApiErrors = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  return Object.entries(data).reduce((nextErrors, [key, value]) => {
    const field = fieldMap[key] || key;
    nextErrors[field] = Array.isArray(value) ? value.join(" ") : String(value);
    return nextErrors;
  }, {});
};

const getOptionLabel = (options, value) => {
  const matchedOption = options.find((option) => option.value === value);
  return matchedOption?.label || value || "";
};

const getDateValue = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const generateEmployeeId = (sequence) => {
  const year = new Date().getFullYear();
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const sequencePart = String(sequence).padStart(3, "0");

  return `EMP-${year}-${randomPart}-${sequencePart}`;
};

const getEmployeeCount = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];
  return data?.count ?? list.length;
};

const getNextEmployeeId = async () => {
  const response = await callApi({
    url: "/employees/",
    method: "get",
    params: {
      page_size: 1,
    },
  });

  return generateEmployeeId(getEmployeeCount(response) + 1);
};

const getDepartmentValue = (department) => {
  if (department && typeof department === "object") {
    return department.id ?? department.name ?? "";
  }

  return department ?? "";
};

const getDepartmentLabel = (employee) => {
  const department = employee.department;

  if (department && typeof department === "object") {
    return department.name || department.title || department.id || "";
  }

  return employee.department_name || employee.departmentName || department || "";
};

const normalizeEmployee = (employee) => ({
  ...employee,
  name: employee.name || "",
  email: employee.email || "",
  phone: employee.phone || "",
  employeeId: employee.employee_id || employee.employeeId || employee.staff_id || employee.staffId || employee.code || employee.id || "",
  role: employee.role || "",
  roleLabel: employee.designation || employee.designation_name || employee.designationName || getOptionLabel(ROLE_OPTIONS, employee.role),
  department: getDepartmentValue(employee.department),
  departmentLabel: getDepartmentLabel(employee),
  joiningDate: getDateValue(employee.joining_date || employee.joiningDate),
  exitDate: getDateValue(employee.exit_date || employee.exitDate),
  status: employee.status || "",
  statusLabel: getOptionLabel(STATUS_OPTIONS, employee.status),
  address: employee.address || employee.current_address || employee.currentAddress || employee.permanent_address || employee.permanentAddress || "",
  profilePhotoUrl: employee.photo || employee.profile_photo || employee.profilePhoto || employee.avatar || "",
});

const getEmployeeList = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];

  return list.map((employee) => normalizeEmployee(employee));
};

const getEmployeeTotal = (data) => {
  const total = Number(data?.count);
  if (Number.isFinite(total)) return total;

  const list = Array.isArray(data) ? data : data?.results || [];
  return list.length;
};

const getDepartmentOptions = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];

  return list
    .map((department) => {
      const id = department.id ?? department.value ?? department.pk;
      const name = department.name || department.department_name || department.title || department.department || "";

      return {
        value: id === undefined || id === null ? "" : String(id),
        label: name ? String(name) : id === undefined || id === null ? "" : String(id),
      };
    })
    .filter((department) => department.value && department.label);
};

const getEmployeeForm = (employee) => ({
  ...EMPTY_FORM,
  id: employee.id || "",
  employeeId: employee.employee_id || employee.employeeId || employee.staff_id || employee.staffId || employee.code || employee.id || "",
  name: employee.name || "",
  email: employee.email || "",
  phone: employee.phone || "",
  role: employee.role || "teacher",
  department: String(getDepartmentValue(employee.department)),
  joiningDate: getDateValue(employee.joining_date || employee.joiningDate),
  exitDate: getDateValue(employee.exit_date || employee.exitDate),
  status: employee.status || "working",
  profilePhoto: null,
  profilePhotoUrl: employee.photo || employee.profile_photo || employee.profilePhoto || "",
});

const getEmployeeInitials = (name) => {
  const initials = String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "E";
};

const renderEmployeeAvatar = (employee, sizeClass = "h-10 w-10", textClass = "text-[12px]") => (
  <div className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 font-extrabold uppercase text-primary ${sizeClass} ${textClass}`}>
    {employee.profilePhotoUrl ? (
      <img src={employee.profilePhotoUrl} alt={employee.name} className="h-full w-full object-cover" />
    ) : (
      getEmployeeInitials(employee.name)
    )}
  </div>
);

const EmployeeDetailField = ({ label, value, className = "" }) => (
  <div className={className}>
    <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">{label}</label>
    <div className="min-h-[40px] rounded-lg border border-outline-variant bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold text-slate-700">
      {value || "-"}
    </div>
  </div>
);

const EMPLOYEE_ID_CARD_EXPORT_WIDTH = 540;
const EMPLOYEE_ID_CARD_EXPORT_HEIGHT = 860;
const EMPLOYEE_ID_CARD_PREVIEW_WIDTH = 340;
const EMPLOYEE_ID_CARD_PREVIEW_HEIGHT =
  (EMPLOYEE_ID_CARD_PREVIEW_WIDTH * EMPLOYEE_ID_CARD_EXPORT_HEIGHT) / EMPLOYEE_ID_CARD_EXPORT_WIDTH;

const EmployeeIdCardPreview = ({ employee }) => {
  const infoRows = [
    ["Email", employee.email, Mail],
    ["Phone Number", employee.phone, Phone],
    ["Designation", employee.roleLabel, IdCard],
    ["Department", employee.departmentLabel, Building2],
  ];

  return (
    <div className="sm:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-[14px] font-extrabold text-primary">Employee ID Card</h4>
        <button
          type="button"
          onClick={() => downloadEmployeeIdCard(employee)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>

      <div
        className="relative mx-auto flex w-full flex-col overflow-hidden rounded-[26px] border border-[#d59a21]/40 bg-white shadow-xl"
        style={{
          maxWidth: `${EMPLOYEE_ID_CARD_PREVIEW_WIDTH}px`,
          minHeight: `${EMPLOYEE_ID_CARD_PREVIEW_HEIGHT}px`,
          aspectRatio: `${EMPLOYEE_ID_CARD_EXPORT_WIDTH} / ${EMPLOYEE_ID_CARD_EXPORT_HEIGHT}`,
        }}
      >
        {/* Top arch */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden">
          <div className="absolute inset-0 bg-[#082d61]" />
          <div className="absolute left-1/2 top-[30px] h-[200px] w-[181%] -translate-x-1/2 -rotate-2 rounded-[100%] bg-[#d59a21]" />
          <div className="absolute left-1/2 top-[34px] h-[300px] w-[181%] -translate-x-1/2 -rotate-2 rounded-[100%] bg-white" />
        </div>

        {/* Bottom arch */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden">
          <div className="absolute inset-0 bg-[#082d61]" />
          <div className="absolute bottom-[18px] left-1/2 h-[300px] w-[181%] -translate-x-1/2 rotate-2 rounded-[100%] bg-[#d59a21]" />
          <div className="absolute bottom-[28px] left-1/2 h-[300px] w-[181%] -translate-x-1/2 rotate-2 rounded-[100%] bg-white" />
        </div>

        {/* Watermark logo */}
        <img src={idCardLogo} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-24 left-1/2 h-36 w-36 -translate-x-1/2 object-contain opacity-[0.05]" />

        <div className="relative flex flex-1 flex-col items-center px-5 pb-10 pt-5">
          {/* Logo + Name */}
          <div className="mt-7 flex items-center justify-center gap-3">
            <img src={idCardLogo} alt="Institute logo" className="h-22 w-22 shrink-0 object-contain" />
            <div className="min-w-0">
              <h2 className="font-serif text-[24px] font-black leading-none tracking-[0.14em] text-[#082d61]">NITE</h2>
              <p className="mt-0.5 max-w-[155px] font-serif text-[9.5px] font-bold uppercase leading-snug text-[#082d61]">
                Nawab Institute Of Technical Education
              </p>
              <div className="mt-1 flex items-center gap-1">
                <span className="h-px flex-1 bg-[#d59a21]" />
                <span className="h-1.5 w-1.5 rotate-45 bg-[#d59a21]" />
                <span className="h-px flex-1 bg-[#d59a21]" />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="h-px w-5 bg-[#d59a21]" />
            <span className="rounded-lg bg-[#082d61] px-5 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
              Employee ID Card
            </span>
            <span className="h-px w-5 bg-[#d59a21]" />
          </div>

          {/* Photo - circular */}
          <div className="mt-4 grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#d59a21] bg-[#f5f8fc] text-[26px] font-black text-[#082d61]">
            {employee.profilePhotoUrl ? (
              <img src={employee.profilePhotoUrl} alt={employee.name} className="h-full w-full object-cover" />
            ) : (
              getEmployeeInitials(employee.name)
            )}
          </div>

          {/* Name */}
          <h3 className="mt-2.5 text-center text-[14px] font-black uppercase tracking-wide text-[#082d61]">
            {employee.name || "-"}
          </h3>
          <p className="mt-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-900">
            Employee ID: {employee.employeeId || "-"}
          </p>

          {/* Divider */}
          <div className="my-2 flex w-full items-center gap-2">
            <span className="h-px flex-1 bg-[#d59a21]" />
            <span className="h-2 w-2 rotate-45 bg-[#d59a21]" />
            <span className="h-px flex-1 bg-[#d59a21]" />
          </div>

          {/* Info rows */}
          <div className="w-full space-y-1.5">
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

          {/* Signature */}
          <div className="-mt-28 flex w-full justify-end">
            <div className="w-36 text-center">
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

const downloadEmployeeIdCard = async (employee) => {
  const width = EMPLOYEE_ID_CARD_PREVIEW_WIDTH;
  const height = EMPLOYEE_ID_CARD_PREVIEW_HEIGHT;
  const scale = 2;
  const outputWidth = Math.round(width * scale);
  const outputHeight = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const navy = "#082d61";
  const gold = "#d59a21";
  const white = "#ffffff";
  const slate900 = "#0f172a";
  const slate500 = "#64748b";

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

  const wrapText = (text, x, y, maxWidth, lineHeight, maxLines = 99) => {
    const words = String(text || "-").split(" ");
    let line = "";
    let lineCount = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " ";
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        if (lineCount >= maxLines - 1) { ctx.fillText(line.trimEnd() + "…", x, y); return; }
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

  const infoRows = [
    ["Email", employee.email, Mail],
    ["Phone Number", employee.phone, Phone],
    ["Designation", employee.roleLabel, IdCard],
    ["Department", employee.departmentLabel, Building2],
  ];

  const loadIcon = (Icon) =>
    loadImg(
      `data:image/svg+xml;utf8,${encodeURIComponent(
        renderToStaticMarkup(<Icon color="#ffffff" size={24} strokeWidth={2.5} />)
      )}`
    ).catch(() => null);

  const iconList = [...new Set(infoRows.map(([, , icon]) => icon))];
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
  ctx.fillStyle = white;
  roundRect(0, 0, width, height, 26);
  ctx.fill();

  // ── arches ────────────────────────────────────────────
  const archTilt = (-2 * Math.PI) / 180;
  ctx.save();
  roundRect(0, 0, width, height, 26);
  ctx.clip();

  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, width, 176);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(width / 2, 130, width * 0.905, 100, archTilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.ellipse(width / 2, 184, width * 0.905, 150, archTilt, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = navy;
  ctx.fillRect(0, height - 176, width, 176);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(width / 2, height - 168, width * 0.905, 150, -archTilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.ellipse(width / 2, height - 178, width * 0.905, 150, -archTilt, 0, Math.PI * 2);
  ctx.fill();

  if (logo) {
    ctx.globalAlpha = 0.05;
    ctx.drawImage(logo, 98, height - 240, 144, 144);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // ── logo + branding ───────────────────────────────────
  if (logo) {
    ctx.drawImage(logo, 85, 49, 62, 62);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = navy;
  ctx.letterSpacing = "3.4px";
  ctx.font = "900 24px Georgia, 'Times New Roman', serif";
  ctx.fillText("NITE", 163, 68);
  ctx.letterSpacing = "0px";
  ctx.font = "700 9.5px Georgia, 'Times New Roman', serif";
  wrapText("NAWAB INSTITUTE OF TECHNICAL EDUCATION", 163, 81, 150, 11, 2);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(163, 101);
  ctx.lineTo(230, 101);
  ctx.moveTo(248, 101);
  ctx.lineTo(309, 101);
  ctx.stroke();
  ctx.save();
  ctx.translate(239, 101);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();

  // ── Employee ID Card badge ────────────────────────────
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(92, 143);
  ctx.lineTo(112, 143);
  ctx.stroke();
  ctx.fillStyle = navy;
  roundRect(122, 129, 151, 28, 8);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.font = "900 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("EMPLOYEE ID CARD", 197.5, 147);
  ctx.strokeStyle = gold;
  ctx.beginPath();
  ctx.moveTo(283, 143);
  ctx.lineTo(303, 143);
  ctx.stroke();

  // ── circular photo ────────────────────────────────────
  const photoCX = width / 2;
  const photoCY = 226;
  const photoR = 56;

  ctx.beginPath();
  ctx.arc(photoCX, photoCY, 59, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill();

  if (employee.profilePhotoUrl) {
    try {
      const photo = await loadImg(employee.profilePhotoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(photo, photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2);
      ctx.restore();
    } catch {
      ctx.beginPath();
      ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f8fc";
      ctx.fill();
      ctx.fillStyle = navy;
      ctx.font = "900 26px Arial";
      ctx.textAlign = "center";
      ctx.fillText(getEmployeeInitials(employee.name), photoCX, photoCY + 9);
    }
  } else {
    ctx.beginPath();
    ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
    ctx.fillStyle = "#f5f8fc";
    ctx.fill();
    ctx.fillStyle = navy;
    ctx.font = "900 26px Arial";
    ctx.textAlign = "center";
    ctx.fillText(getEmployeeInitials(employee.name), photoCX, photoCY + 9);
  }

  // ── name ──────────────────────────────────────────────
  ctx.fillStyle = navy;
  ctx.font = "900 14px Arial";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";
  ctx.fillText(String(employee.name || "").toUpperCase(), width / 2, 305);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = slate900;
  ctx.font = "800 10px Arial";
  ctx.fillText(`Employee ID: ${employee.employeeId || "-"}`.toUpperCase(), width / 2, 322);

  // ── divider ───────────────────────────────────────────
  const divY = 337;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, divY);
  ctx.lineTo(157, divY);
  ctx.stroke();
  ctx.save();
  ctx.translate(170, divY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(183, divY);
  ctx.lineTo(320, divY);
  ctx.stroke();

  // ── info rows ─────────────────────────────────────────
  let infoY = 352;
  infoRows.forEach(([label, value, icon]) => {
    drawIconBadge(icon, 44, infoY + 11, 12, 12);

    ctx.fillStyle = navy;
    ctx.font = "800 8.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label.toUpperCase(), 64, infoY + 7);

    ctx.fillStyle = slate900;
    ctx.font = "700 11px Arial";
    wrapText(value || "-", 64, infoY + 21, 210, 13, 1);

    infoY += 29;
  });

  // ── signature ─────────────────────────────────────────
  const sigY = 480;
  if (stampedSign) {
    ctx.drawImage(stampedSign, 225, sigY - 68, 70, 68);
  }
  ctx.strokeStyle = slate900;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(214, sigY);
  ctx.lineTo(305, sigY);
  ctx.stroke();
  ctx.fillStyle = slate900;
  ctx.font = "700 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Authorized Signature", 260, sigY + 15);
  ctx.fillStyle = slate500;
  ctx.font = "600 8px Arial";
  ctx.fillText("(Director / Principal)", 260, sigY + 26);

  // ── card border ───────────────────────────────────────
  ctx.strokeStyle = gold + "66";
  ctx.lineWidth = 1.5;
  roundRect(0, 0, width, height, 26);
  ctx.stroke();

  // ── download ──────────────────────────────────────────
  const fileName = `employee-id-card-${String(employee.employeeId || employee.name || "employee")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}.png`;
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

const appendPayloadField = (payload, key, value, { skipEmptyFile = false } = {}) => {
  if (skipEmptyFile && !value) return;

  if (value instanceof File) {
    payload.append(key, value);
    return;
  }

  payload.append(key, value ?? "");
};

const buildEmployeePayload = (form, isEdit) => {
  const payload = new FormData();
  const skipEmptyFile = Boolean(isEdit);

  appendPayloadField(payload, "photo", form.profilePhoto, { skipEmptyFile });
  appendPayloadField(payload, "employee_id", form.employeeId);
  appendPayloadField(payload, "name", form.name.trim());
  appendPayloadField(payload, "email", form.email.trim());
  appendPayloadField(payload, "phone", form.phone.trim());
  appendPayloadField(payload, "role", form.role);
  appendPayloadField(payload, "department", Number(form.department));
  appendPayloadField(payload, "joining_date", form.joiningDate);
  appendPayloadField(payload, "status", form.status);

  if (isEdit) {
    appendPayloadField(payload, "exit_date", form.exitDate);
  }

  return payload;
};

export default function StaffManagement() {
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [employeeIdLoading, setEmployeeIdLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const profilePreview = useObjectUrl(form.profilePhoto) || form.profilePhotoUrl;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        url: "/employees/",
        method: "get",
        params: {
          page,
          page_size: pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });

      setEmployees(getEmployeeList(response));
      setTotalEmployees(getEmployeeTotal(response));
    } catch {
      setEmployees([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadEmployees = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          url: "/employees/",
          method: "get",
          params: {
            page,
            page_size: pageSize,
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });

        if (isActive) {
          setEmployees(getEmployeeList(response));
          setTotalEmployees(getEmployeeTotal(response));
        }
      } catch {
        if (isActive) {
          setEmployees([]);
          setTotalEmployees(0);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isActive = false;
    };
  }, [page, pageSize, search]);

  useEffect(() => {
    let isActive = true;

    const loadDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await callApi({
          url: "/departments/",
          method: "get",
        });

        if (isActive) {
          setDepartments(getDepartmentOptions(response));
        }
      } catch {
        if (isActive) {
          setDepartments([]);
        }
      } finally {
        if (isActive) {
          setDepartmentsLoading(false);
        }
      }
    };

    loadDepartments();

    return () => {
      isActive = false;
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const openAdd = async () => {
    setForm({ ...EMPTY_FORM, employeeId: generateEmployeeId(totalEmployees + 1) });
    setErrors({});
    setModal("add");

    try {
      setEmployeeIdLoading(true);
      const employeeId = await getNextEmployeeId();
      setForm((current) => ({ ...current, employeeId }));
    } catch {
      toast.error("Unable to generate employee ID.");
    } finally {
      setEmployeeIdLoading(false);
    }
  };

  const openEdit = (employee) => {
    setForm(getEmployeeForm(employee));
    setErrors({});
    setModal("edit");
  };

  const openEmployeeDetail = async (employee) => {
    setSelectedEmployee(employee);

    try {
      setDetailLoading(true);
      const response = await callApi({
        url: `/employees/${employee.id}/`,
        method: "get",
      });

      setSelectedEmployee(getEmployeeList([response])[0]);
    } catch {
      toast.error("Unable to load employee details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const validateEmployee = () => {
    const nextErrors = {};
    const phonePattern = /^\+?\d[\d\s-]{7,}\d$/;

    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    // if (!form.employeeId.trim()) nextErrors.employeeId = "Employee ID is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (!phonePattern.test(form.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (!form.role) nextErrors.role = "Role is required.";
    if (modal === "add" && form.department === "") nextErrors.department = "Department name is required.";
    if (!form.joiningDate) nextErrors.joiningDate = "Joining date is required.";
    if (!form.status) nextErrors.status = "Status is required.";

    return nextErrors;
  };

  const save = async () => {
    const nextErrors = validateEmployee();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    try {
      setSaving(true);
      await callApi({
        url: modal === "edit" ? `/employees/${form.id}/` : "/employees/",
        method: modal === "edit" ? "put" : "post",
        data: buildEmployeePayload(form, modal === "edit"),
      });

      toast.success(modal === "edit" ? "Employee updated successfully." : "Employee added successfully.");
      setModal(null);
      await fetchEmployees();
    } catch (error) {
      const apiErrors = getApiErrors(error.response?.data);
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setEmployeeToDelete(null);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setDeleting(true);
      await callApi({
        url: `/employees/${employeeToDelete.id}/`,
        method: "delete",
      });

      toast.success("Employee deleted successfully.");
      setEmployeeToDelete(null);
      await fetchEmployees();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Employee Management</h1>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-[#c98a00]"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant bg-white p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search employees..."
            className="w-full rounded-lg border border-outline-variant bg-white py-2 pl-9 pr-3 text-[13px] font-semibold outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Employee", "Role", "Department", "Phone", "Email", "Joining", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-center text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3">
                    <div className="flex max-w-[240px] items-center gap-3">
                      {renderEmployeeAvatar(employee)}
                      <div className="min-w-0">
                        <div className="truncate font-bold text-primary">{employee.name}</div>
                        {/* <div className="truncate text-[12px] text-on-surface-variant">{employee.employeeId ? `ID: ${employee.employeeId}` : employee.email}</div> */}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{employee.roleLabel}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{employee.departmentLabel}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{employee.phone}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{employee.email}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{employee.joiningDate}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                      employee.status === "working" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}>
                      {employee.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEmployeeDetail(employee)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="View employee"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(employee)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="Edit employee"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmployeeToDelete(employee)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                        aria-label="Delete employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={8}>
                    <Loader variant="block" label="Loading employees..." />
                  </td>
                </tr>
              )}
              {!loading && employees.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <NoDataFound title="No employees found" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalEmployees}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <h3 className="text-[20px] font-extrabold text-primary">Employee Detail</h3>
                <div className="mt-1 text-[13px] text-on-surface-variant">
                  {detailLoading ? <Loader label="Loading complete details..." /> : "View employee profile and employment details."}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="Close employee detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div className="flex flex-col items-center text-center sm:col-span-2">
                <label className="mb-3 block text-[12px] font-bold text-on-surface-variant">Profile Photo</label>
                {renderEmployeeAvatar(selectedEmployee, "h-28 w-28", "text-[26px]")}
              </div>

              <EmployeeDetailField label="Full Name" value={selectedEmployee.name} />
              <EmployeeDetailField label="Employee ID" value={selectedEmployee.employeeId} />
              <EmployeeDetailField label="Email" value={selectedEmployee.email} />
              <EmployeeDetailField label="Phone" value={selectedEmployee.phone} />
              <EmployeeDetailField label="Role" value={selectedEmployee.roleLabel} />
              <EmployeeDetailField label="Department" value={selectedEmployee.departmentLabel} />
              <EmployeeDetailField label="Joining Date" value={selectedEmployee.joiningDate} />
              <EmployeeDetailField label="Exit Date" value={selectedEmployee.exitDate} />
              <EmployeeDetailField label="Status" value={selectedEmployee.statusLabel} />
              <EmployeeDetailField label="Address" value={selectedEmployee.address} className="sm:col-span-2" />

              <EmployeeIdCardPreview employee={selectedEmployee} detailLoading={detailLoading} />
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-[17px] font-extrabold text-primary">{modal === "add" ? "Add Employee" : "Edit Employee"}</h3>
              <button type="button" onClick={() => setModal(null)} className="text-xl text-slate-400 hover:text-gray-600">x</button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div className="flex flex-col items-center text-center sm:col-span-2">
                <label className="mb-3 block text-[12px] font-bold text-on-surface-variant">Profile Photo</label>
                <div className="mb-3 grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-outline-variant bg-slate-50">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Photo</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateField("profilePhoto", event.target.files?.[0] || null)}
                  className="w-full max-w-sm rounded-lg border border-outline-variant px-3.5 py-2.5 text-[13px] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white focus:border-primary"
                />
                {form.profilePhoto && <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">{form.profilePhoto.name}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Employee ID</label>
                <input
                  value={form.employeeId}
                  readOnly
                  placeholder={employeeIdLoading ? "Generating employee ID..." : "EMP-2026-4821-001"}
                  className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 outline-none ${errors.employeeId ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.employeeId && <p className="mt-1 text-[11px] text-red-600">{errors.employeeId}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Full Name</label>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.name ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Phone</label>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.phone ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Joining Date</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(event) => updateField("joiningDate", event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.joiningDate ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.joiningDate && <p className="mt-1 text-[11px] text-red-600">{errors.joiningDate}</p>}
              </div>
              {modal === "edit" && (
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Exit Date</label>
                  <input
                    type="date"
                    value={form.exitDate}
                    onChange={(event) => updateField("exitDate", event.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.exitDate ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                  />
                  {errors.exitDate && <p className="mt-1 text-[11px] text-red-600">{errors.exitDate}</p>}
                </div>
              )}

               <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Role</label>
                <select
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.role ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                >
                  {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                {errors.role && <p className="mt-1 text-[11px] text-red-600">{errors.role}</p>}
              </div>
                {modal === "add" && (
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Department Name</label>
                  <select
                    value={form.department}
                    onChange={(event) => updateField("department", event.target.value)}
                    disabled={departmentsLoading || departments.length === 0}
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${errors.department ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">
                      {departmentsLoading ? "Loading departments..." : departments.length === 0 ? "No departments found" : "Select department"}
                    </option>
                    {departments.map((department) => (
                      <option key={department.value} value={department.value}>{department.label}</option>
                    ))}
                  </select>
                  {errors.department && <p className="mt-1 text-[11px] text-red-600">{errors.department}</p>}
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Email</label>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.email ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
              </div>
             
            
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.status ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                >
                  {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                {errors.status && <p className="mt-1 text-[11px] text-red-600">{errors.status}</p>}
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
              <button type="button" disabled={saving || employeeIdLoading} onClick={() => setModal(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
              <button type="button" disabled={saving || employeeIdLoading} onClick={save} className="flex-1 rounded-lg bg-secondary py-2.5 text-[13px] font-extrabold text-primary hover:bg-[#c98a00] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Loader variant="button" label="Saving..." /> : employeeIdLoading ? <Loader variant="button" label="Generating..." /> : modal === "add" ? "Add Employee" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold text-slate-900">Delete Employee</h2>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{employeeToDelete.name || "this employee"}</span>? This action cannot be undone.
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
                onClick={confirmDeleteEmployee}
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
