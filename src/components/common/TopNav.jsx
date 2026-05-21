import { Menu } from 'lucide-react';

export default function TopNav({ onToggleSidebar }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[54px] items-center justify-between border-b border-[#e5e7eb] bg-white shadow-[0_1px_7px_rgba(0,0,0,0.12)] md:left-[240px]">
      <div className="flex items-center gap-3 px-5 md:hidden">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="brand-heading text-[#ffb21d]">NITE</p>
      </div>

      <div className="ml-auto flex items-center gap-3 px-5">
        <div className="text-right">
          <p className="text-[15px] font-black leading-4 text-[#07112f]">Admin User</p>
          <p className="text-[9px] font-black uppercase tracking-[0.05em] text-[#b2b5c0]">Super Admin</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#ffb21d] bg-[#d8e9ee] text-[13px] font-black text-[#0b3557] shadow-sm">
          AU
        </div>
      </div>
    </header>
  );
}
