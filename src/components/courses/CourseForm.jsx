import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { callApi, getAuthHeaders } from "../../services/ApiService.js";
import toast from "react-hot-toast";
import Loader from "../common/Loader.jsx";

const initialForm = {
  title: "",
  type: "",
  status: "upcoming",
  duration: "",

  subjects: [""],
  description: "",
};

const types = [
  { label: "Diploma", value: "diploma" },
  { label: "Short-Term", value: "short_term" },
];

const statuses = [
  { label: "Active", value: "active" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Archived", value: "archived" },
];

const getOptionValue = (options, value) => {
  if (!value) return "";
  const matchedOption = options.find((option) => (
    option.value === value || option.label.toLowerCase() === String(value).toLowerCase()
  ));
  return matchedOption ? matchedOption.value : value;
};

const buildCoursePayload = (form) => ({
  title: form.title.trim(),
  type: form.type,
  status: form.status,
  duration: form.duration.trim(),
  subjects: form.subjects.map((subject) => subject.trim()).filter(Boolean),
  description: form.description.trim(),
});

const getApiErrors = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  return Object.entries(data).reduce((nextErrors, [key, value]) => {
    nextErrors[key] = Array.isArray(value) ? value.join(" ") : String(value);
    return nextErrors;
  }, {});
};

const getSubjects = (subjects) => {
  if (Array.isArray(subjects)) {
    return subjects.length > 0 ? subjects : [""];
  }

  if (typeof subjects === "string" && subjects.trim()) {
    return subjects.split(",").map((subject) => subject.trim()).filter(Boolean);
  }

  return [""];
};

const getCourseForm = (course) => ({
  ...initialForm,
  title: course.title || "",
  type: getOptionValue(types, course.type),
  status: getOptionValue(statuses, course.status),
  duration: course.duration || "",
  subjects: getSubjects(course.subjects),
  description: course.description || "",
});

export default function CourseForm({ mode = "add" }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

  const title = isView ? "View Course" : isEdit ? "Edit Course" : "Add Course";
  const subtitle = isView
    ? "Review course details and enrollment information."
    : isEdit
      ? "Update course details and curriculum information."
      : "Create a new course program.";

  useEffect(() => {
    if (!courseId || (!isEdit && !isView)) return undefined;

    let isActive = true;

    const fetchCourse = async () => {
      try {
        setCourseLoading(true);
        const response = await callApi({
          url: `/courses/${courseId}/`,
          method: "get",
        });

        if (isActive) {
          setForm(getCourseForm(response));
        }
      } catch {
        if (isActive) {
          setForm(initialForm);
        }
      } finally {
        if (isActive) {
          setCourseLoading(false);
        }
      }
    };

    fetchCourse();

    return () => {
      isActive = false;
    };
  }, [courseId, isEdit, isView]);

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
        url: isEdit ? `/courses/${courseId}/` : "/courses/",
        method: isEdit ? "put" : "post",
        data: buildCoursePayload(form),
        headers: getAuthHeaders(),
      });
      toast.success(isEdit ? "Course updated successfully!" : "Course created successfully!");
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

  const fieldClassName = "w-full rounded-lg border border-outline-variant bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">{title}</h1>
          <div className="mt-1 text-[13px] text-on-surface-variant">
            {courseLoading ? <Loader label="Loading course details..." /> : subtitle}
          </div>
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
                <option key={item.value} value={item.value}>{item.label}</option>
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
                <option key={item.value} value={item.value}>{item.label}</option>
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
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {loading ? <Loader variant="button" label="Saving..." /> : isEdit ? "Save Changes" : "Save Course"}
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
