import { BookOpen, BriefcaseBusiness, CircleHelp, GraduationCap } from 'lucide-react';
import { callApi } from '../services/ApiService';
import { useEffect, useState } from 'react';



export default function Dashboard() {
  const [dashStatus, setDashStatus] = useState({
    totalStudents: 0,
    activeEmployees: 0,
    coursesOffered: 0,
    totalEnquiries: 0,
  });
  const overviewCards = [
    {
      label: 'Total Enrolled Students',
      value: dashStatus.totalStudents,
      icon: GraduationCap,
      accent: '#ffb21d',
      stripe: 'bg-[#ffb21d]',
      iconWrap: 'bg-[#fff6e4]',
    },
    {
      label: 'Total Active Employees',
      value: dashStatus.activeEmployees,
      icon: BriefcaseBusiness,
      accent: '#071f4d',
      stripe: 'bg-[#071f4d]',
      iconWrap: 'bg-[#e8eaf2]',
    },
    {
      label: 'Academic Courses',
      value: dashStatus.coursesOffered,
      icon: BookOpen,
      accent: '#ffb21d',
      stripe: 'bg-[#ffb21d]',
      iconWrap: 'bg-[#fff6e4]',
    },
    {
      label: 'Enquiries',
      value: dashStatus.totalEnquiries,
      icon: CircleHelp,
      accent: '#071f4d',
      stripe: 'bg-[#071f4d]',
      iconWrap: 'bg-[#e8eaf2]',
    },
  ];

  useEffect(()=>{
    fetchDashboardStatus();
  },[])
  const fetchDashboardStatus = async () => {
    try {
      const response = await callApi({
        url: "/dashboard/stats/",
        method: "get",
      });

      setDashStatus({
        totalStudents: response?.students?.total ?? 0,
        activeEmployees: response?.employees?.total ?? 0,
        coursesOffered: response?.courses?.total ?? 0,
        totalEnquiries: response?.enquiries?.total ?? 0,
      });
    } catch {
      setDashStatus({
        totalStudents: 0,
        activeEmployees: 0,
        coursesOffered: 0,
        totalEnquiries: 0,
      });
    }
  }
  return (
    <section>
      <div className="mb-7">
        <h1 className="text-[28px] font-black leading-tight text-[#07112f]">
          Institutional Overview
        </h1>
        <p className="mt-1 text-[14px] text-[#71717b]">
          Real-time statistics and management summary for Nawab Institute of Technical Education.
        </p>
      </div>

      <div className="grid max-w-[760px] grid-cols-1 gap-4 lg:grid-cols-2">
        {overviewCards.map((card) => (
          <article
            key={card.label}
            className="relative flex min-h-[132px] items-center justify-between overflow-hidden rounded-[10px] bg-white px-5 py-5 shadow-[0_6px_16px_rgba(15,23,42,0.07)]"
          >
            <div className={`absolute left-0 top-0 h-full w-1.5 ${card.stripe}`} />

            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#a5a7af]">
                {card.label}
              </p>
              <p className="mt-2 text-[34px] font-normal leading-none text-[#020a22]">
                {card.value}
              </p>
            </div>

            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-[10px] ${card.iconWrap}`}>
              <card.icon
                className="h-7 w-7"
                strokeWidth={2.2}
                style={{ color: card.accent }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
