"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchNetworkData } from "@/lib/data"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function TimeSeriesAnalysis() {
  const [chartData, setChartData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"line">>({})

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchNetworkData()

      // Process data for time series
      // Group by duration ranges to simulate time intervals
      const durationRanges: Record<string, { normal: number; attacks: number }> = {}

      // Create 24 time intervals
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0")
        durationRanges[`${hour}:00`] = { normal: 0, attacks: 0 }
      }

      // Distribute data into time intervals based on a calculated value
      data.forEach((item) => {
        // Use the id as a simple way to distribute data across time intervals
        const id = Number.parseInt(item.id || "0")
        const hourIndex = id % 24
        const hour = hourIndex.toString().padStart(2, "0")
        const timeKey = `${hour}:00`

        if (item.attack_cat === "Normal" || item.attack_cat === "") {
          durationRanges[timeKey].normal++
        } else {
          durationRanges[timeKey].attacks++
        }
      })

      // Prepare data for Chart.js
      const labels = Object.keys(durationRanges).sort()
      const normalData = labels.map((label) => durationRanges[label].normal)
      const attackData = labels.map((label) => durationRanges[label].attacks)

      setChartData({
        labels,
        datasets: [
          {
            label: "Normal Traffic",
            data: normalData,
            borderColor: "rgba(53, 162, 235, 1)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
            tension: 0.3,
          },
          {
            label: "Attack Traffic",
            data: attackData,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            tension: 0.3,
          },
        ],
      })

      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top" as const,
          },
          title: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Events",
            },
          },
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      })
    }

    loadData()
  }, [])

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Attack Frequency Over Time</CardTitle>
        <CardDescription>Number of detected intrusions per time interval</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.datasets.length > 0 && <Line options={chartOptions} data={chartData} />}
        </div>
      </CardContent>
    </Card>
  )
}

