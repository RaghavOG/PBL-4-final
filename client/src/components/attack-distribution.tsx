"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchNetworkData, generateColors, groupDataBy } from "@/lib/data"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData, type ChartOptions } from "chart.js"

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

export function AttackDistribution() {
  const [chartData, setChartData] = useState<ChartData<"pie">>({
    labels: [],
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"pie">>({})

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchNetworkData()

      // Group by attack category
      const attackCounts = groupDataBy(data, "attack_cat")

      // Sort by count (descending)
      const sortedAttacks = Object.entries(attackCounts)
        .sort((a, b) => b[1] - a[1])
        .filter(([category]) => category !== "" && category !== "undefined")

      const labels = sortedAttacks.map(([category]) => category)
      const counts = sortedAttacks.map(([, count]) => count)
      const colors = generateColors(labels.length)

      setChartData({
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: colors,
            borderColor: colors.map((color) => color.replace("0.5", "1")),
            borderWidth: 1,
          },
        ],
      })

      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right" as const,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw as number
                const total = counts.reduce((a, b) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      })
    }

    loadData()
  }, [])

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Attack Type Distribution</CardTitle>
        <CardDescription>Percentage breakdown of attack categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.datasets.length > 0 && <Pie options={chartOptions} data={chartData} />}
        </div>
      </CardContent>
    </Card>
  )
}

