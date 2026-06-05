export default function NoDataFound({
  title = "No data found",
  message = "Try changing your search or filters.",
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-10 text-center ${className}`}>
      <img
        src="/no-data-found.svg"
        alt="No data found"
        className="mb-3 h-32 w-auto"
        loading="lazy"
      />
      <p className="text-[14px] font-extrabold text-primary">{title}</p>
      {/* <p className="mt-1 text-[12px] font-semibold text-on-surface-variant">{message}</p> */}
    </div>
  );
}
