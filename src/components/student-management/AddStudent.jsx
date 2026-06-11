import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../services/ApiService.js";
import toast from "react-hot-toast";
import Loader from "../common/Loader.jsx";

const initialForm = {
  name: "",
  rollNumber: "",
  email: "",
  phone: "",
  course: "",
  admissionDate: "",
  session: "",
  guardianName: "",
  guardianPhone: "",
  highestQualification: null,
  idProof: null,
  profilePhoto: null,
  profilePhotoUrl: "",
  idProofUrl: "",
  highestQualificationUrl: "",
  address: "",
};

const courses = [
  { id: 3, name: "Diploma in Computer Application" },
  { id: 4, name: "Advance Diploma in Computer Application" },
  { id: 5, name: "Diploma in Business Management" },
  { id: 6, name: "Diploma in Business Administration" },
  { id: 7, name: "Diploma in Hardware & Networking" },
  { id: 8, name: "Diploma in Digital Marketing" },
  { id: 9, name: "Basic Computers" },
  { id: 10, name: "Advance Basic Computers" },
  { id: 11, name: "Tally ERP" },
  { id: 12, name: "CorelDraw" },
  { id: 13, name: "Adobe Photoshop" },
  { id: 14, name: "HTML & Web Designing" },
  { id: 15, name: "Visual Basic" },
  { id: 16, name: "Computer Typing" },
  { id: 17, name: "Internet & Email" },
];

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

const getCourseValue = (course) => {
  if (!course) return "";
  if (typeof course === "object") return course.id ? String(course.id) : "";
  const matchedCourse = courses.find((item) => item.name === course || String(item.id) === String(course));
  return matchedCourse ? String(matchedCourse.id) : String(course);
};

const generateRollNumber = (sequence) => {
  const year = new Date().getFullYear();
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const sequencePart = String(sequence).padStart(3, "0");

  return `${year}-${randomPart}-${sequencePart}`;
};

const getStudentCount = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];
  return data?.count ?? list.length;
};

const getNextRollNumber = async () => {
  const response = await callApi({
    url: "/students/",
    method: "get",
    params: {
      page_size: 1,
    },
  });

  return generateRollNumber(getStudentCount(response) + 1);
};

const appendPayloadField = (payload, key, value, { skipEmptyFile = false } = {}) => {
  if (skipEmptyFile && !value) return;

  if (value instanceof File) {
    payload.append(key, value);
    return;
  }

  payload.append(key, value ?? "");
};

const buildStudentPayload = (form, isEdit) => {
  const payload = new FormData();
  const skipEmptyFile = Boolean(isEdit);

  appendPayloadField(payload, "photo", form.profilePhoto, { skipEmptyFile });
  appendPayloadField(payload, "name", form.name.trim());
  appendPayloadField(payload, "roll_number", form.rollNumber.trim());
  appendPayloadField(payload, "email", form.email.trim());
  appendPayloadField(payload, "phone", form.phone.trim());
  appendPayloadField(payload, "course", Number(form.course));
  appendPayloadField(payload, "admission_date", form.admissionDate);
  appendPayloadField(payload, "date_of_birth", form.session);
  appendPayloadField(payload, "guardian_name", form.guardianName.trim());
  appendPayloadField(payload, "guardian_phone", form.guardianPhone.trim());
  appendPayloadField(payload, "id_proof", form.idProof, { skipEmptyFile });
  appendPayloadField(payload, "highest_qualification", form.highestQualification, { skipEmptyFile });
  appendPayloadField(payload, "address", form.address.trim());

  return payload;
};

const fieldMap = {
  photo: "profilePhoto",
  roll_number: "rollNumber",
  admission_date: "admissionDate",
  session: "session",
  guardian_name: "guardianName",
  guardian_phone: "guardianPhone",
  id_proof: "idProof",
  highest_qualification: "highestQualification",
};

const getApiErrors = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  return Object.entries(data).reduce((nextErrors, [key, value]) => {
    const field = fieldMap[key] || key;
    nextErrors[field] = Array.isArray(value) ? value.join(" ") : String(value);
    return nextErrors;
  }, {});
};

const getDateValue = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const isImageSource = (source) => {
  if (!source) return false;
  if (source instanceof File) return source.type.startsWith("image/");

  try {
    const pathname = new URL(source, window.location.origin).pathname;
    return /\.(apng|avif|gif|jpe?g|png|webp)$/i.test(pathname);
  } catch {
    return /\.(apng|avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(String(source));
  }
};

const getFileNameFromUrl = (url) => {
  if (!url) return "";

  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    return String(url).split(/[/?#]/).filter(Boolean).pop() || "";
  }
};

const getStudentForm = (student) => ({
  ...initialForm,
  name: student.name || "",
  rollNumber: student.roll_number || student.rollNumber || "",
  email: student.email || "",
  phone: student.phone || "",
  course: getCourseValue(student.course),
  admissionDate: getDateValue(student.admission_date || student.admissionDate),
  session: getDateValue(student.session || student.dob || student.date_of_birth || student.dateOfBirth),
  guardianName: student.guardian_name || student.guardianName || "",
  guardianPhone: student.guardian_phone || student.guardianPhone || "",
  profilePhotoUrl: student.photo || student.profile_photo || student.profilePhoto || "",
  idProofUrl: student.id_proof || student.idProof || "",
  highestQualificationUrl: student.highest_qualification || student.highestQualification || "",
  address: student.address || "",
});

export default function AddStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(studentId);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [rollNumberLoading, setRollNumberLoading] = useState(false);
  const profilePreview = useObjectUrl(form.profilePhoto) || form.profilePhotoUrl;
  const idProofPreview = useObjectUrl(form.idProof) || form.idProofUrl;
  const qualificationPreview = useObjectUrl(form.highestQualification) || form.highestQualificationUrl;

  useEffect(() => {
    if (!isEdit) {
      let isActive = true;

      const fetchRollNumber = async () => {
        try {
          setRollNumberLoading(true);
          const rollNumber = await getNextRollNumber();

          if (isActive) {
            setForm((current) => ({ ...current, rollNumber }));
          }
        } catch {
          if (isActive) {
            toast.error("Unable to generate roll number.");
          }
        } finally {
          if (isActive) {
            setRollNumberLoading(false);
          }
        }
      };

      fetchRollNumber();

      return () => {
        isActive = false;
      };
    }

    let isActive = true;

    const fetchStudent = async () => {
      try {
        setStudentLoading(true);
        const response = await callApi({
          url: `/students/${studentId}/`,
          method: "get",
        });

        if (isActive) {
          setForm(getStudentForm(response));
        }
      } catch {
        if (isActive) {
          toast.error("Unable to load student details.");
        }
      } finally {
        if (isActive) {
          setStudentLoading(false);
        }
      }
    };

    fetchStudent();

    return () => {
      isActive = false;
    };
  }, [isEdit, studentId]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((prev)=>({...prev, [field]: ""}))

  };

  const validateForm = () => {
    const nextErrors = {};
    const phonePattern = /^\+?\d[\d\s-]{7,}\d$/;

    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!form.rollNumber.trim()) nextErrors.rollNumber = "Roll number is required.";
    if (!form.email.trim()) nextErrors.email = "Valid email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (!phonePattern.test(form.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (!form.course) nextErrors.course = "Please select a course.";
    if (!form.admissionDate) nextErrors.admissionDate = "Admission date is required.";
    if (!form.session) nextErrors.session = "DOB is required.";
    if (!form.highestQualification && !form.highestQualificationUrl) nextErrors.highestQualification = "Upload highest qualification.";
    if (!form.idProof && !form.idProofUrl) nextErrors.idProof = "Upload a valid ID proof.";
    if (!form.address.trim()) nextErrors.address = "Address is required.";
    if (form.guardianPhone && !phonePattern.test(form.guardianPhone)) nextErrors.guardianPhone = "Enter a valid guardian phone number.";

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      await callApi({
        url: isEdit ? `/students/${studentId}/` : "/students/",
        method: isEdit ? "put" : "post",
        data: buildStudentPayload(form, isEdit),
      });
      toast.success(isEdit ? "Student updated successfully!" : "Student added successfully!");
      setShowSuccess(true);
    } catch (error) {
      const apiErrors = getApiErrors(error.response?.data);
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (!isEdit) {
      setForm(initialForm);
      setErrors({});

      const refreshRollNumber = async () => {
        try {
          setRollNumberLoading(true);
          const rollNumber = await getNextRollNumber();
          setForm((current) => ({ ...current, rollNumber }));
        } catch {
          toast.error("Unable to generate roll number.");
        } finally {
          setRollNumberLoading(false);
        }
      };

      refreshRollNumber();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">{isEdit ? "Edit Student" : "Add Student"}</h1>
          <div className="mt-1 text-[13px] text-on-surface-variant">
            {studentLoading ? <Loader label="Loading student details..." /> : isEdit ? "Update student profile and enrollment details." : "Create a new student profile and enrollment record."}
          </div>
        </div>
        <Link
          to="/students"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
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

        

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Student full name"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.name ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
          </div>
          
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Roll Number</label>
            <input
              required
              value={form.rollNumber}
              readOnly
              placeholder={rollNumberLoading ? "Generating roll number..." : "2026-4821-001"}
              className={`w-full rounded-lg border bg-slate-50 px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 outline-none ${errors.rollNumber ? "border-red-500" : "border-outline-variant"}`}
            />
            {errors.rollNumber && <p className="mt-1 text-[11px] text-red-600">{errors.rollNumber}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="student@nite.edu"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.email ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Phone</label>
            <input
            // type="number"
              required
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.phone ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Course</label>
            <select
              required
              value={form.course}
              onChange={(event) => updateField("course", event.target.value)}
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.course ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {errors.course && <p className="mt-1 text-[11px] text-red-600">{errors.course}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Admission Date</label>
            <input
              required
              type="date"
              value={form.admissionDate}
              onChange={(event) => updateField("admissionDate", event.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.admissionDate ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.admissionDate && <p className="mt-1 text-[11px] text-red-600">{errors.admissionDate}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">DOB</label>
            <input
              required
              type="date"
              value={form.session}
              onChange={(event) => updateField("session", event.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.session ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.session && <p className="mt-1 text-[11px] text-red-600">{errors.session}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Guardian Name</label>
            <input
              value={form.guardianName}
              onChange={(event) => updateField("guardianName", event.target.value)}
              placeholder="Parent or guardian name"
              className="w-full rounded-lg border border-outline-variant px-3.5 py-2.5 text-[13px] outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Guardian Phone</label>
            <input
              value={form.guardianPhone}
              onChange={(event) => updateField("guardianPhone", event.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.guardianPhone ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.guardianPhone && <p className="mt-1 text-[11px] text-red-600">{errors.guardianPhone}</p>}
          </div>

           <div >
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Address</label>
            <input
              // rows={4}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Student address"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.address ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.address && <p className="mt-1 text-[11px] text-red-600">{errors.address}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">ID Proof</label>
            <div className="mb-3 grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-outline-variant bg-slate-50 ">
              {idProofPreview ? (
                isImageSource(form.idProof || form.idProofUrl) ? (
                  <img src={idProofPreview} alt="ID preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">{form.idProof?.name || getFileNameFromUrl(form.idProofUrl) || "Document"}</span>
                )
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Upload file</span>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => updateField("idProof", event.target.files?.[0] || null)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white focus:border-primary ${errors.idProof ? "border-red-500" : "border-outline-variant"}`}
            />
            {form.idProof && <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">{form.idProof.name}</p>}
            {errors.idProof && <p className="mt-1 text-[11px] text-red-600">{errors.idProof}</p>}
          </div>


            <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Highest Qualification</label>
            <div className="mb-3 grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-outline-variant bg-slate-50 ">
              {qualificationPreview ? (
                isImageSource(form.highestQualification || form.highestQualificationUrl) ? (
                  <img src={qualificationPreview} alt="Qualification preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">{form.highestQualification?.name || getFileNameFromUrl(form.highestQualificationUrl) || "Document"}</span>
                )
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Upload file</span>
              )}
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => updateField("highestQualification", event.target.files?.[0] || null)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white focus:border-primary ${errors.highestQualification ? "border-red-500" : "border-outline-variant"}`}
            />
            {form.highestQualification && <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">{form.highestQualification.name}</p>}
            {errors.highestQualification && <p className="mt-1 text-[11px] text-red-600">{errors.highestQualification}</p>}
          </div>

         
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:justify-end">
          <Link
            to="/students"
            className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-surface-container"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || studentLoading || rollNumberLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {loading ? <Loader variant="button" label="Saving..." /> : studentLoading || rollNumberLoading ? <Loader variant="button" label="Loading..." /> : isEdit ? "Save Changes" : "Save Student"}
          </button>
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md h-50 rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-[20px] font-extrabold text-primary">{isEdit ? "Student updated successfully" : "Student registered successfully"}</h3>
              <p className="mt-2 text-[13px] text-on-surface-variant">{isEdit ? "The student profile was updated successfully." : "A new student profile has been added to the student list."}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {!isEdit && (
                <button
                  onClick={handleSuccessClose}
                  className="rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-surface-container"
                >
                  Add another student
                </button>
              )}
              <button
                onClick={() => navigate("/students")}
                className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
              >
                View students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
