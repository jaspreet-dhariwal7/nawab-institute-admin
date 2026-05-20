import { useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { mockCourses } from "../../lib/data.js";

const initialForm = {
  title: "",
  type: "",
  status: "Active",
  duration: "",

  subjects: [""],
  description: "",
};

const types = ["Diploma", "Short-term"];
const statuses = ["Active", "Upcoming", "Archived"];

export default function CourseForm({ mode = "add" }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = mockCourses.find((item) => item.id === courseId);
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const [form, setForm] = useState(() => course ? {
    ...initialForm,
    title: course.title,
    type: course.type,
    status: course.status,
    duration: course.duration,
    subjects: Array.isArray(course.subjects) && course.subjects.length > 0 ? course.subjects : [""],
    description: course.description,
  } : initialForm);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const title = isView ? "View Course" : isEdit ? "Edit Course" : "Add Course";
  const subtitle = isView
    ? "Review course details and enrollment information."
    : isEdit
      ? "Update course details and curriculum information."
      : "Create a new course program.";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((prev)=>({...prev, [field]: ""}))
  };

  const updateSubject = (index, value) => {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.map((subject, subjectIndex) => (
        subjectIndex === index ? value : subject
      )),
    }));
  };

  const addSubject = () => {
    setForm((current) => {
      if (current.subjects.length >= 6) return current;
      return { ...current, subjects: [...current.subjects, ""] };
    });
  };

  const removeSubject = (index) => {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.filter((_, subjectIndex) => subjectIndex !== index),
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Course title is required.";
    if (!form.type) nextErrors.type = "Course type is required.";
    if (!form.status) nextErrors.status = "Course status is required.";
    if (!form.duration.trim()) nextErrors.duration = "Duration is required.";
    if (!form.subjects.some((subject) => subject.trim())) nextErrors.subjects = "At least one subject is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    else if (form.description.trim().length < 15) nextErrors.description = "Description must be at least 15 characters.";

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

  const fieldClassName = "w-full rounded-lg border border-outline-variant bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">{title}</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">{subtitle}</p>
        </div>
        <Link
          to="/courses"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Course Title</label>
            <input
              required
              disabled={isView}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Course title"
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.title ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.title && <p className="mt-1 text-[11px] text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Type</label>
            <select
              required
              disabled={isView}
              value={form.type}
              onChange={(event) => updateField("type", event.target.value)}
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.type ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            >
              <option value="">Select type</option>
              {types.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-[11px] text-red-600">{errors.type}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Status</label>
            <select
              required
              disabled={isView}
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.status ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            >
              <option value="">Select status</option>
              {statuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-[11px] text-red-600">{errors.status}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Duration</label>
            <input
              required
              disabled={isView}
              value={form.duration}
              onChange={(event) => updateField("duration", event.target.value)}
              placeholder="12 Months"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.duration ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.duration && <p className="mt-1 text-[11px] text-red-600">{errors.duration}</p>}
          </div>


          <div className="sm:col-span-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant">Subjects</label>
                {!isView && (
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                    Add up to 6 subjects for this course.
                  </p>
                )}
              </div>
              {!isView && (
                <button
                  type="button"
                  onClick={addSubject}
                  disabled={form.subjects.length >= 6}
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-[12px] font-bold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="h-4 w-4" />
                  Add Subject
                </button>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-outline-variant bg-slate-50 p-3">
              {form.subjects.map((subject, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Subject {index + 1}
                    </label>
                    <input
                      required={index === 0}
                      disabled={isView}
                      value={subject}
                      onChange={(event) => updateSubject(index, event.target.value)}
                      placeholder={`Subject ${index + 1}`}
                      className={fieldClassName}
                    />
                  </div>
                  {!isView && form.subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      className="mt-6 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
                      aria-label={`Remove subject ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.subjects && <p className="mt-2 text-[11px] text-red-600">{errors.subjects}</p>}
          </div>

         

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Description</label>
            <textarea
              required
              disabled={isView}
              rows={5}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Course description"
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.description ? "border-red-500 focus:border-red-500" : "border-outline-variant"}`}
            />
            {errors.description && <p className="mt-1 text-[11px] text-red-600">{errors.description}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:justify-end">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-surface-container"
          >
            {isView ? "Close" : "Cancel"}
          </Link>
          {!isView && (
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              {isEdit ? "Save Changes" : "Save Course"}
            </button>
          )}
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-[20px] font-extrabold text-primary">{isEdit ? "Course updated successfully" : "Course created successfully"}</h3>
              <p className="mt-2 text-[13px] text-on-surface-variant">{isEdit ? "The course details have been saved successfully." : "The course has been added to the catalog."}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {!isEdit && (
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setForm(initialForm);
                  }}
                  className="rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-surface-container"
                >
                  Add another course
                </button>
              )}
              <button
                onClick={() => navigate("/courses")}
                className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90"
              >
                View courses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
