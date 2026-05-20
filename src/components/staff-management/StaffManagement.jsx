import { useMemo, useState } from "react";
import { Edit, Eye, Plus, Search } from "lucide-react";
import { cn } from "../../lib/utlis.js";
import Pagination from "../common/Pagination.jsx";

const INITIAL_STAFF = [
  { id: 1, name: "Dr. Nawab Khan", role: "Director", dept: "Management", phone: "98765-43210", email: "nawab@nawabinstitute.com", joining: "2005-01-01", status: "Active" },
  { id: 2, name: "Prof. Sunil Sharma", role: "HOD - Computer Science", dept: "Computer Science", phone: "87654-32109", email: "sunil@nawabinstitute.com", joining: "2008-06-15", status: "Active" },
  { id: 3, name: "Ms. Priya Verma", role: "Faculty", dept: "Computer Science", phone: "76543-21098", email: "priya@nawabinstitute.com", joining: "2015-07-01", status: "Active" },
  { id: 4, name: "Mr. Rajesh Gupta", role: "Faculty", dept: "Business Studies", phone: "65432-10987", email: "rajesh@nawabinstitute.com", joining: "2017-08-01", status: "Active" },
  { id: 5, name: "Ms. Anjali Singh", role: "Lab Instructor", dept: "Computer Science", phone: "54321-09876", email: "anjali@nawabinstitute.com", joining: "2020-01-15", status: "Active" },
  { id: 6, name: "Mr. Vikram Mehta", role: "Faculty", dept: "Hardware & Networking", phone: "43210-98765", email: "vikram@nawabinstitute.com", joining: "2019-03-01", status: "Active" },
  { id: 7, name: "Ms. Sunita Kaur", role: "Admin Staff", dept: "Administration", phone: "32109-87654", email: "sunita@nawabinstitute.com", joining: "2018-11-01", status: "Inactive" },
];

const DEPTS = ["All", "Computer Science", "Business Studies", "Hardware & Networking", "Administration", "Management"];
const ROLES = ["Director", "HOD - Computer Science", "Faculty", "Lab Instructor", "Admin Staff", "Accountant"];
const EMPTY = { name: "", role: ROLES[2], dept: DEPTS[1], phone: "", email: "", joining: "", status: "Active" };

export default function StaffManagement() {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [successModal, setSuccessModal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter((member) => {
      return (
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.dept.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q)
      );
    });
  }, [staff, search]);

  const pageStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setForm(EMPTY);
    setModal("add");
  };

  const openEdit = (member) => {
    setForm({ ...member });
    setModal("edit");
    setErrors({});
  };

  const validateStaff = () => {
    const nextErrors = {};
    const phonePattern = /^\+?\d[\d\s-]{7,}\d$/;

    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Valid email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.phone) nextErrors.phone = "Phone number is required.";
    else if (!phonePattern.test(form.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (!form.joining) nextErrors.joining = "Joining date is required.";

    return nextErrors;
  };

  const save = () => {
    const nextErrors = validateStaff();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (modal === "add") {
      setStaff([...staff, { ...form, id: Date.now() }]);
      setSuccessModal("Staff member added successfully.");
    } else {
      setStaff(staff.map((member) => (member.id === form.id ? form : member)));
      setSuccessModal("Staff details updated successfully.");
    }

    setModal(null);
    setErrors({});
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Staff Management</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">{filteredStaff.length} staff members found</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-[#c98a00]"
        >
          <Plus className="h-4 w-4" />
          Add Staff
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
            placeholder="Search staff..."
            className="w-full rounded-lg border border-outline-variant bg-white py-2 pl-9 pr-3 text-[13px] font-semibold outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Name", "Role", "Department", "Phone", "Email", "Joining", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {pageStaff.map((member) => (
                <tr key={member.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3 font-bold text-primary">{member.name}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{member.role}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{member.dept}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{member.phone}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{member.email}</td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{member.joining}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                      member.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setSelectedStaff(member)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="View staff"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(member)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                        aria-label="Edit staff"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredStaff.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40" onClick={() => setSelectedStaff(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-primary">Staff Detail</h3>
              <button onClick={() => setSelectedStaff(null)} className="text-xl text-slate-400 hover:text-gray-600">x</button>
            </div>
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <div className="text-[16px] font-extrabold text-primary">{selectedStaff.name}</div>
              <div className="mt-1 text-[13px] text-slate-500">{selectedStaff.role}</div>
              <div className="text-[13px] text-slate-500">{selectedStaff.email}</div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Department", value: selectedStaff.dept },
                { label: "Phone", value: selectedStaff.phone },
                { label: "Joining Date", value: selectedStaff.joining },
                { label: "Status", value: selectedStaff.status },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-3.5">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
                  <div className="text-[14px] font-semibold text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-[17px] font-extrabold text-primary">{modal === "add" ? "Add Staff Member" : "Edit Staff"}</h3>
              <button onClick={() => setModal(null)} className="text-xl text-slate-400 hover:text-gray-600">x</button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Full Name</label>
                <input
                  value={form.name}
                  onChange={(event) =>{ setForm({ ...form, name: event.target.value })
                setErrors({ ...errors, name: "" })
                }}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.name ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Phone</label>
                <input
                type="number"
                  value={form.phone}
                  onChange={(event) => {setForm({ ...form, phone: event.target.value })
                setErrors({ ...errors, phone: "" })
                
                }}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.phone ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Joining Date</label>
                <input
                  type="date"
                  value={form.joining}
                  onChange={(event) => {setForm({ ...form, joining: event.target.value })
                setErrors({ ...errors, joining: "" })
                }}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.joining ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.joining && <p className="mt-1 text-[11px] text-red-600">{errors.joining}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Email</label>
                <input
                  value={form.email}
                  onChange={(event) => {setForm({ ...form, email: event.target.value })
                setErrors({ ...errors, email: "" })
                }}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.email ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Role</label>
                <select
                  value={form.role}
                  onChange={(event) => {setForm({ ...form, role: event.target.value })
                setErrors({ ...errors, role: "" })
                }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary"
                >
                  {ROLES.map((role) => <option key={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Department</label>
                <select
                  value={form.dept}
                  onChange={(event) => {setForm({ ...form, dept: event.target.value })
                setErrors({ ...errors, dept: "" })
                }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary"
                >
                  {DEPTS.filter((dept) => dept !== "All").map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => {setForm({ ...form, status: event.target.value })
                setErrors({ ...errors, status: "" })
                }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-primary"
                >
                  {["Active", "Inactive"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setModal(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="flex-1 rounded-lg bg-secondary py-2.5 text-[13px] font-extrabold text-primary hover:bg-[#c98a00]">
                {modal === "add" ? "Add Staff" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-[20px] font-extrabold text-primary">{successModal}</h3>
              <p className="mt-2 text-[13px] text-on-surface-variant">The staff record has been saved successfully.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSuccessModal("")}
                className="rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-surface-container"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
