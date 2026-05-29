import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../../lib/utlis.js";
import { callApi } from "../../services/ApiService.js";
import Pagination from "../common/Pagination.jsx";

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
  name: "",
  email: "",
  phone: "",
  role: "teacher",
  department: "",
  joiningDate: "",
  status: "working",
  profilePhoto: null,
  profilePhotoUrl: "",
};

const fieldMap = {
  joining_date: "joiningDate",
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

const getEmployeeList = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];

  return list.map((employee) => ({
    ...employee,
    name: employee.name || "",
    email: employee.email || "",
    phone: employee.phone || "",
    role: employee.role || "",
    roleLabel: getOptionLabel(ROLE_OPTIONS, employee.role),
    department: getDepartmentValue(employee.department),
    departmentLabel: getDepartmentLabel(employee),
    joiningDate: getDateValue(employee.joining_date || employee.joiningDate),
    status: employee.status || "",
    statusLabel: getOptionLabel(STATUS_OPTIONS, employee.status),
    profilePhotoUrl: employee.photo || employee.profile_photo || employee.profilePhoto || "",
  }));
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
  name: employee.name || "",
  email: employee.email || "",
  phone: employee.phone || "",
  role: employee.role || "teacher",
  department: String(getDepartmentValue(employee.department)),
  joiningDate: getDateValue(employee.joining_date || employee.joiningDate),
  status: employee.status || "working",
  profilePhoto: null,
  profilePhotoUrl: employee.photo || employee.profile_photo || employee.profilePhoto || "",
});

const buildEmployeePayload = (form) => ({
  name: form.name.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  role: form.role,
  department: Number(form.department),
  joining_date: form.joiningDate,
  status: form.status,
});

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

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal("add");
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
        data: buildEmployeePayload(form),
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
          <p className="mt-1 text-[13px] text-on-surface-variant">{loading ? "Loading employees..." : `${totalEmployees} employees found`}</p>
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
                {["Name", "Role", "Department", "Phone", "Email", "Joining", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3 font-bold text-primary">{employee.name}</td>
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
              {!loading && employees.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-[13px] font-semibold text-on-surface-variant" colSpan={8}>
                    No employees found.
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
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40" onClick={() => setSelectedEmployee(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-primary">Employee Detail</h3>
              <button type="button" onClick={() => setSelectedEmployee(null)} className="text-xl text-slate-400 hover:text-gray-600">x</button>
            </div>
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <div className="text-[16px] font-extrabold text-primary">{selectedEmployee.name}</div>
              <div className="mt-1 text-[13px] text-slate-500">{selectedEmployee.roleLabel}</div>
              <div className="text-[13px] text-slate-500">{selectedEmployee.email}</div>
              {detailLoading && <div className="mt-2 text-[12px] font-semibold text-slate-400">Loading latest details...</div>}
            </div>
            <div className="space-y-3">
              {[
                { label: "Department", value: selectedEmployee.departmentLabel },
                { label: "Phone", value: selectedEmployee.phone },
                { label: "Joining Date", value: selectedEmployee.joiningDate },
                { label: "Status", value: selectedEmployee.statusLabel },
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
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-bold text-gray-600">Email</label>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-primary ${errors.email ? "border-red-500 focus:border-red-500" : "border-gray-300"}`}
                />
                {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
              </div>
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
              <button type="button" disabled={saving} onClick={() => setModal(null)} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
              <button type="button" disabled={saving} onClick={save} className="flex-1 rounded-lg bg-secondary py-2.5 text-[13px] font-extrabold text-primary hover:bg-[#c98a00] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : modal === "add" ? "Add Employee" : "Save Changes"}
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
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
