import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { AttackDistribution } from "@/components/attack-distribution"
import { TimeSeriesAnalysis } from "@/components/time-series-analysis"
import { NetworkTraffic } from "@/components/network-traffic"
import { GeospatialAnalysis } from "@/components/geospatial-analysis"
import { KpiCards } from "@/components/kpi-cards"
import { AnomalyDetection } from "@/components/anomaly-detection"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white" >
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Network Security Dashboard</h2>
        </div>
        <DashboardShell>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCards />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <TimeSeriesAnalysis />
            <AttackDistribution />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <NetworkTraffic />
            <AnomalyDetection />
          </div>
          {/* <div className="grid gap-4">
            <GeospatialAnalysis />
          </div> */}
        </DashboardShell>
      </div>
    </div>
  )
}

