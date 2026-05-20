import { BookOpen, BriefcaseBusiness, CircleHelp, GraduationCap } from 'lucide-react';

const overviewCards = [
  {
    label: 'Total Enrolled Students',
    value: '272',
    icon: GraduationCap,
    accent: '#ffb21d',
    stripe: 'bg-[#ffb21d]',
    iconWrap: 'bg-[#fff6e4]',
  },
  {
    label: 'Total Active Employees',
    value: '15',
    icon: BriefcaseBusiness,
    accent: '#071f4d',
    stripe: 'bg-[#071f4d]',
    iconWrap: 'bg-[#e8eaf2]',
  },
  {
    label: 'Academic Courses',
    value: '24',
    icon: BookOpen,
    accent: '#ffb21d',
    stripe: 'bg-[#ffb21d]',
    iconWrap: 'bg-[#fff6e4]',
  },
  {
    label: 'Enquiries',
    value: '128',
    icon: CircleHelp,
    accent: '#071f4d',
    stripe: 'bg-[#071f4d]',
    iconWrap: 'bg-[#e8eaf2]',
  },
];

export default function Dashboard() {
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
