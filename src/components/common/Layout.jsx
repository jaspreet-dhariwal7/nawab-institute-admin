  import Sidebar from './Sidebar.jsx';
  import TopNav from './TopNav.jsx';
  import { Outlet } from 'react-router-dom';

  export default function Layout({ children }) {
    return (
      <div className="min-h-screen bg-[#f6f7f9]">
        <Sidebar />
        <main className="min-h-screen md:ml-[240px]">
          <TopNav />
          <div className="pt-[54px]">
            <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-5 lg:px-6">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    );
  }
