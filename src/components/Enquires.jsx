import { useState } from "react";
import { Eye } from "lucide-react";
import Pagination from "./common/Pagination.jsx";

const INITIAL = [
  { id: 1, name: "Ravi Kumar", phone: "98765-43210", email: "ravi@gmail.com", course: "BCA", message: "I want to know about admission process and fees.", date: "2025-05-04", status: "New" },
  { id: 2, name: "Sunita Devi", phone: "87654-32109", email: "sunita@gmail.com", course: "DCA", message: "Please share the course syllabus.", date: "2025-05-04", status: "New" },
  { id: 3, name: "Manish Rao", phone: "76543-21098", email: "manish@gmail.com", course: "ADCA", message: "What are the job prospects after this course?", date: "2025-05-03", status: "Contacted" },
  { id: 4, name: "Pooja Mehta", phone: "65432-10987", email: "pooja@gmail.com", course: "DBA", message: "Is there any scholarship available?", date: "2025-05-03", status: "New" },
  { id: 5, name: "Arvind Sharma", phone: "54321-09876", email: "arvind@gmail.com", course: "DBM", message: "Can I get the prospectus?", date: "2025-05-02", status: "Converted" },
  { id: 6, name: "Meena Gupta", phone: "43210-98765", email: "meena@gmail.com", course: "DHN", message: "What is the duration and fee for Hardware course?", date: "2025-05-02", status: "Contacted" },
  { id: 7, name: "Deepak Singh", phone: "32109-87654", email: "deepak@gmail.com", course: "GD", message: "Interested in graphic designing short course.", date: "2025-05-01", status: "Closed" },
];

export default function Enquiries() {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageEnquiries = INITIAL.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-extrabold text-primary">Enquiry Management</h1>
        <p className="mt-1 text-[13px] text-on-surface-variant">{INITIAL.length} total enquiries</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Name", "Phone / Email", "Date", "Message", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pageEnquiries.map((enquiry) => (
                <tr key={enquiry.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3 font-bold text-primary">{enquiry.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-on-surface-variant">{enquiry.phone}</div>
                    <div className="text-[12px] text-slate-400">{enquiry.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{enquiry.date}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[360px] truncate text-[13px] text-on-surface-variant">{enquiry.message}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelected(enquiry)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="View enquiry"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageEnquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[14px] text-slate-400">
                    No enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={INITIAL.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-primary">Enquiry Detail</h3>
              <button onClick={() => setSelected(null)} className="text-xl text-slate-400 hover:text-gray-600">x</button>
            </div>
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <div className="text-[16px] font-extrabold text-primary">{selected.name}</div>
              <div className="mt-1 text-[13px] text-slate-500">{selected.email}</div>
              <div className="text-[13px] text-slate-500">{selected.phone}</div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Interested Course", value: selected.course },
                { label: "Enquiry Date", value: selected.date },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-3.5">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
                  <div className="text-[14px] font-semibold text-gray-800">{item.value}</div>
                </div>
              ))}
              <div className="rounded-xl bg-slate-50 p-3.5">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Message</div>
                <div className="text-[13px] leading-relaxed text-gray-700">{selected.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
