import Link from "next/link";
import { Shield } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Security Monitor</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="#" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline">
            Alerts
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline">
            Reports
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
