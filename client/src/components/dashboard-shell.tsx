import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-4", className)} {...props}>
      {children}
    </div>
  );
}
