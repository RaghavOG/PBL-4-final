"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, ShieldCheck, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchNetworkData } from "@/lib/data"

export function KpiCards() {
  const [stats, setStats] = useState({
    totalAttacks: 0,
    activeAttacks: 0,
    blockedAttacks: 0,
    threatLevel: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchNetworkData()

      // Calculate stats from data
      const attacks = data.filter((item) => item.attack_cat !== "Normal" && item.attack_cat !== "").length
      const active = Math.floor(attacks * 0.15) // Simulating active attacks
      const blocked = Math.floor(attacks * 0.85) // Simulating blocked attacks
      const threatLevel = Math.min(Math.floor((active / data.length) * 100), 100)

      setStats({
        totalAttacks: attacks,
        activeAttacks: active,
        blockedAttacks: blocked,
        threatLevel: threatLevel,
      })
    }

    loadData()
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Attacks</CardTitle>
          <Shield className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAttacks}</div>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Attacks</CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAttacks}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blocked Attacks</CardTitle>
          <ShieldCheck className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.blockedAttacks}</div>
          <p className="text-xs text-muted-foreground">Successfully mitigated</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.threatLevel}%</div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full ${
                stats.threatLevel < 30 ? "bg-success" : stats.threatLevel < 70 ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${stats.threatLevel}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

