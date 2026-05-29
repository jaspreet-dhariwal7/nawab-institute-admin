import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Pagination from "./common/Pagination.jsx";
import { callApi } from "../services/ApiService.js";

const getEnquiryList = (data) => {
  const list = Array.isArray(data) ? data : data?.results || [];
  return list.map((item) => ({
    id: item.id ?? item.pk ?? `${item.email || item.phone}-${item.date || item.created_at}`,
    name: item.name || item.full_name || item.first_name || "Unknown",
    phone: item.phone || item.mobile || item.contact_number || "",
    email: item.email || item.contact_email || "",
    course: item.course || item.interested_course || item.subject || "",
    message: item.message || item.enquiry || item.comments || "",
    date: item.date || item.created_at || item.enquiry_date || "",
    status: item.status || "",
    ...item,
  }));
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function Enquiries() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [enquiries, setEnquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchEnquiries = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          url: "/contact/list/",
          method: "get",
          params: {
            page,
            page_size: pageSize,
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        });

        if (!isActive) return;

        const list = getEnquiryList(response);
        setEnquiries(list);
        setTotalEnquiries(response?.count ?? list.length);
      } catch {
        if (isActive) {
          setEnquiries([]);
          setTotalEnquiries(0);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchEnquiries();

    return () => {
      isActive = false;
    };
  }, [page, pageSize, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[24px] font-extrabold text-primary">Enquiry Management</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            {loading ? "Loading enquiries..." : `${totalEnquiries} total enquiries`}
          </p>
        </div>
        <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-white p-3 shadow-sm sm:w-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              placeholder="Search enquiries..."
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-outline-variant bg-white py-2 pl-9 pr-3 text-[13px] font-semibold outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container-low">
              <tr className="border-b border-outline-variant">
                {["Name", "Phone / Email", "Date", "Message"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="hover:bg-surface-container/40">
                  <td className="px-4 py-3 font-bold text-primary">{enquiry.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-on-surface-variant">{enquiry.phone}</div>
                    <div className="text-[12px] text-slate-400">{enquiry.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant">{formatDateTime(enquiry.date)}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[360px] text-[13px] text-on-surface-variant">
                      {enquiry.message.length > 25 ? (
                        <>
                          {`${enquiry.message.slice(0, 25)}...`}
                          <button
                            type="button"
                            onClick={() => setSelected(enquiry)}
                            className="ml-2 text-[12px] font-semibold text-primary underline"
                          >
                            See more
                          </button>
                        </>
                      ) : (
                        enquiry.message
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[14px] text-slate-400">
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
          totalItems={totalEnquiries}
          onPageChange={setPage}
        />
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => setSelected(null)}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-extrabold text-slate-900">Full Enquiry Message</h3>
                <p className="mt-1 text-[13px] text-slate-500">{formatDateTime(selected.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                aria-label="Close enquiry modal"
              >
                ×
              </button>
            </div>
            <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-[14px] leading-relaxed text-slate-800">
              {selected.message}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Name</div>
                <div className="mt-2 text-[14px] font-semibold text-slate-900">{selected.name}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Contact</div>
                <div className="mt-2 text-[14px] text-slate-900">{selected.phone || selected.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
