import { cn } from "../../lib/utlis.js";

const sizeClasses = {
  xs: "h-3.5 w-3.5 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-9 w-9 border-4",
};

export default function Loader({
  label = "Loading...",
  size = "sm",
  variant = "inline",
  className = "",
  labelClassName = "",
}) {
  const spinner = (
    <span
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent",
        sizeClasses[size] || sizeClasses.sm
      )}
      aria-hidden="true"
    />
  );

  if (variant === "button") {
    return (
      <span className={cn("inline-flex items-center justify-center gap-2", className)} role="status">
        {spinner}
        <span className={labelClassName}>{label}</span>
      </span>
    );
  }

  if (variant === "block") {
    return (
      <div className={cn("flex min-h-32 flex-col items-center justify-center gap-3 text-primary", className)} role="status">
        {spinner}
        <span className={cn("text-[13px] font-semibold text-on-surface-variant", labelClassName)}>{label}</span>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2 text-on-surface-variant", className)} role="status">
      {spinner}
      <span className={cn("text-[13px] font-semibold", labelClassName)}>{label}</span>
    </span>
  );
}
