import { ClipboardList, Download, FileText, PieChart, Save, ShieldCheck, X } from "lucide-react";
import { RESULT_SUBJECTS } from "./resultSubjects.js";

const VIEW_MARKS = [82, 91, 76, 88, 93];

const formatResultDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const ResultDetail = ({ label, value }) => (
  <div className="grid grid-cols-[100px_12px_1fr] items-start gap-2 text-[13px] leading-5 text-primary">
    <span className="font-extrabold">{label}</span>
    <span className="font-bold">:</span>
    <span className="font-semibold text-slate-900">{value || "-"}</span>
  </div>
);

const SummaryCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-5 rounded-lg border border-outline-variant bg-white px-5 py-4 shadow-sm">
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface-container-low text-primary">
      <Icon className="h-7 w-7" />
    </div>
    <div>
      <p className="text-[13px] font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[26px] font-extrabold leading-none text-primary">{value}</p>
    </div>
  </div>
);

export default function StudentResultModal({ mode = "generate", student, marks, subjects = RESULT_SUBJECTS, onMarksChange, onClose, onPublish, publishing = false, loading = false, error = "" }) {
  const isGenerate = mode === "generate";
  const visibleMarks = marks?.length ? marks : VIEW_MARKS;
  const totalMarks = subjects.length * 100;
  const obtainedMarks = subjects.reduce((sum, _subject, index) => sum + Number(visibleMarks[index] || 0), 0);
  const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-7 py-6">
          <h2 className="text-[24px] font-extrabold text-primary">{isGenerate ? "Generate Result" : "View Result"}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            className="grid h-9 w-9 place-items-center rounded-lg text-primary hover:bg-surface-container"
            aria-label="Close result modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b border-outline-variant px-7 py-7">
          <div className="grid gap-7 md:grid-cols-[140px_1fr_1fr]">
            <div className="flex justify-center md:justify-start">
              <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-slate-100 text-[34px] font-extrabold text-primary">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  student.initials || "S"
                )}
              </div>
            </div>

            <div className="space-y-4">
              <ResultDetail label="Full Name" value={student.name} />
              <ResultDetail label="Roll Number" value={student.rollNumber} />
              <ResultDetail label="Date of Birth" value={formatResultDate(student.dob)} />
              <ResultDetail label="Email" value={student.email} />
              <ResultDetail label="Phone" value={student.phone} />
            </div>

            <div className="space-y-4">
              <ResultDetail label="Course" value={student.courseName} />
              <ResultDetail label="Admission Date" value={formatResultDate(student.admissionDate)} />
              <ResultDetail label="Address" value={student.address} />
            </div>
          </div>
        </div>

        <div className="space-y-6 px-7 py-6">
          <h3 className="text-[18px] font-extrabold text-primary">Subject List & Marks</h3>

          {loading && (
            <div className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-[13px] font-semibold text-primary">
              Loading result...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-outline-variant">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-surface-container-low">
                <tr className="border-b border-outline-variant">
                  <th className="w-16 px-5 py-4 text-[13px] font-extrabold text-slate-600">#</th>
                  <th className="px-5 py-4 text-[13px] font-extrabold text-slate-600">Subject Name</th>
                  <th className="w-40 px-5 py-4 text-center text-[13px] font-extrabold text-slate-600">Total Marks</th>
                  <th className="w-72 px-5 py-4 text-center text-[13px] font-extrabold text-slate-600">Obtained Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {subjects.map((subject, index) => (
                  <tr key={subject}>
                    <td className="px-5 py-4 text-[14px] font-semibold text-primary">{index + 1}</td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-primary">{subject}</td>
                    <td className="px-5 py-4 text-center text-[14px] font-semibold text-primary">100</td>
                    <td className="px-5 py-3 text-center text-[14px] font-semibold text-primary">
                      {isGenerate ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={marks[index] ?? "0"}
                          disabled={publishing}
                          onChange={(event) => onMarksChange?.(index, event.target.value)}
                          className="w-full max-w-[210px] rounded-md border border-outline-variant px-3 py-2 text-[14px] font-semibold text-primary outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      ) : (
                        visibleMarks[index]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard icon={FileText} label="Total Marks" value={totalMarks} />
            <SummaryCard icon={ClipboardList} label="Obtained Marks" value={obtainedMarks} />
            <SummaryCard icon={PieChart} label="Percentage" value={`${percentage}%`} />
          </div>

          {!isGenerate && (
            <div className="rounded-lg border border-outline-variant bg-white p-5">
              <h3 className="mb-5 text-[16px] font-extrabold text-primary">Documents to Generate</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="text-[14px] font-semibold text-primary">Generate DMC (Detailed Marks Card)</span>
                  </div>
                  <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[13px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90">
                    <Download className="h-4 w-4" />
                    Download DMC
                  </button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-red-50 text-red-500">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="text-[14px] font-semibold text-primary">Generate Certificate</span>
                  </div>
                  <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[13px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isGenerate && (
          <div className="flex flex-col-reverse gap-3 border-t border-outline-variant px-7 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={publishing}
              className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-white px-6 py-3 text-[14px] font-bold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-primary px-6 py-3 text-[14px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {publishing ? "Publishing..." : "Publish Result"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
