import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mockStudents } from "../../lib/data.js";

const initialForm = {
  name: "",
  rollNumber: "",
  email: "",
  phone: "",
  course: "",
  admissionDate: "",
  guardianName: "",
  guardianPhone: "",
  highestQualification: null,
  idProof: null,
  profilePhoto: null,
  address: "",
};

const courses = [
  "Computer Science",
  "Electrical Eng.",
  "Civil Eng.",
  "Business Studies",
  "Hardware & Networking",
];

export default function AddStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = mockStudents.find((item) => item.id === studentId);
  const isEdit = Boolean(studentId);
  const [form, setForm] = useState(() => student ? {
    ...initialForm,
    name: student.name,
    rollNumber: student.rollNumber,
    email: student.email,
    phone: student.phone,
    course: student.course,
  } : initialForm);
  const [profilePreview, setProfilePreview] = useState(student?.image || "");
  const [idProofPreview, setIdProofPreview] = useState("");
  const [qualificationPreview, setQualificationPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

useEffect(() => {
  let profileUrl;
  let idUrl;
  let qualificationUrl;

  // Profile photo preview
  if (form.profilePhoto) {
    profileUrl = URL.createObjectURL(form.profilePhoto);
    setProfilePreview(profileUrl);
  } else {
    setProfilePreview(student?.image || "");
  }

  // Highest qualification preview
  if (form.highestQualification) {
    qualificationUrl = URL.createObjectURL(form.highestQualification);
    setQualificationPreview(qualificationUrl);
  } else {
    setQualificationPreview("");
  }

  // ID proof preview
  if (form.idProof) {
    idUrl = URL.createObjectURL(form.idProof);
    setIdProofPreview(idUrl);
  } else {
    setIdProofPreview("");
  }

  return () => {
    if (profileUrl) URL.revokeObjectURL(profileUrl);
    if (qualificationUrl) URL.revokeObjectURL(qualificationUrl);
    if (idUrl) URL.revokeObjectURL(idUrl);
  };
}, [form.profilePhoto, form.highestQualification, form.idProof, student]);

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
    if (!form.highestQualification) nextErrors.highestQualification = "Upload highest qualification.";
    if (!form.idProof) nextErrors.idProof = "Upload a valid ID proof.";
    if (!form.address.trim()) nextErrors.address = "Address is required.";
    if (form.guardianPhone && !phonePattern.test(form.guardianPhone)) nextErrors.guardianPhone = "Enter a valid guardian phone number.";

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (!isEdit) {
      setForm(initialForm);
      setProfilePreview("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">{isEdit ? "Edit Student" : "Add Student"}</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            {isEdit ? "Update student profile and enrollment details." : "Create a new student profile and enrollment record."}
          </p>
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
              onChange={(event) => updateField("rollNumber", event.target.value)}
              placeholder="#NITE-2026-001"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.rollNumber ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
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
                <option key={course} value={course}>
                  {course}
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

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">ID Proof</label>
            <div className="mb-3 grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-outline-variant bg-slate-50 px-3">
              {idProofPreview ? (
                form.idProof?.type?.startsWith("image/") ? (
                  <img src={idProofPreview} alt="ID preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 text-center">{form.idProof?.name || "Document"}</span>
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
            <div className="mb-3 grid h-28 w-28 place-items-center overflow-hidden rounded-xl border border-outline-variant bg-slate-50 px-3">
              {qualificationPreview ? (
                form.highestQualification?.type?.startsWith("image/") ? (
                  <img src={qualificationPreview} alt="Qualification preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 text-center">{form.highestQualification?.name || "Document"}</span>
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

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Address</label>
            <textarea
              rows={4}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Student address"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.address ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.address && <p className="mt-1 text-[11px] text-red-600">{errors.address}</p>}
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            {isEdit ? "Save Changes" : "Save Student"}
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
