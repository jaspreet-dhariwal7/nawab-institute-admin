import { useState } from 'react';
import { BookOpen, BriefcaseBusiness, CircleHelp, GraduationCap, LayoutDashboard, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utlis.js';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: GraduationCap, label: 'Students', path: '/students' },
  { icon: BriefcaseBusiness, label: 'Employees', path: '/staff' },
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: CircleHelp, label: 'Enquiries', path: '/enquiries' },
];

export default function Sidebar() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col bg-[#020a22] shadow-[8px_0_24px_rgba(0,0,0,0.08)] md:flex">
      <div className="px-6 py-5">
        <div className="mb-9">
          <h1 className="brand-heading text-[#ffb21d]">
            NITE
          </h1>
          <p className="mt-2 text-[13px] font-black uppercase tracking-[0.18em] text-[#6f7899]">
            Admin Portal
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex h-[43px] items-center gap-3 px-7 text-[15px] font-bold transition-colors",
                  isActive
                    ? "bg-[#ffb21d] text-[#71510a]"
                    : "text-[#b7bdd1] hover:bg-white/7 hover:text-white"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 px-7 py-7">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-3 text-[15px] font-bold text-[#b7bdd1] transition-colors hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-[18px] font-extrabold text-slate-900">Confirm Logout</h2>
            <p className="mt-2 text-[13px] text-slate-600">Are you sure you want to logout? You will be returned to the login screen.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-lg bg-[#ffb21d] px-4 py-2.5 text-[13px] font-bold text-slate-900 transition-opacity hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
