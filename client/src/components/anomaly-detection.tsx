"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchNetworkData } from "@/lib/data"
import { Scatter } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"

// Register Chart.js components
ChartJS.register(LinearScale, LogarithmicScale, PointElement, LineElement, Tooltip, Legend)

export function AnomalyDetection() {
  const [chartData, setChartData] = useState({
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState({})

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchNetworkData()

      // Process data for anomaly detection
      const normalData = data
        .filter((item) => item.attack_cat === "Normal" || item.attack_cat === "")
        .map((item) => ({
          x: Number.parseFloat(item.dur) || 0,
          y: (Number.parseInt(item.sbytes) || 0) + (Number.parseInt(item.dbytes) || 0),
        }))
        .filter((item) => item.x > 0 && item.y > 0)
        .slice(0, 500) // Limit points for better performance

      const anomalyData = data
        .filter((item) => item.attack_cat !== "Normal" && item.attack_cat !== "")
        .map((item) => ({
          x: Number.parseFloat(item.dur) || 0,
          y: (Number.parseInt(item.sbytes) || 0) + (Number.parseInt(item.dbytes) || 0),
        }))
        .filter((item) => item.x > 0 && item.y > 0)
        .slice(0, 500) // Limit points for better performance

      setChartData({
        datasets: [
          {
            label: "Normal Traffic",
            data: normalData,
            backgroundColor: "rgba(53, 162, 235, 0.5)",
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: "Anomalous Traffic",
            data: anomalyData,
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            pointRadius: 3,
            pointHoverRadius: 6,
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
          tooltip: {
            callbacks: {
              label: (context) => [
                `Duration: ${context.parsed.x.toFixed(3)} s`, 
                `Bytes: ${context.parsed.y.toLocaleString()}`
              ],
            },
          },
        },
        scales: {
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: "Total Bytes (Sent + Received)",
            },
            ticks: {
              callback: (value) => {
                const numericValue = Number(value)
                if (numericValue >= 1000000) return (numericValue / 1000000).toFixed(1) + "M"
                if (numericValue >= 1000) return (numericValue / 1000).toFixed(1) + "K"
                return numericValue
              },
            },
          },
          x: {
            type: 'logarithmic',
            title: {
              display: true,
              text: "Duration (seconds)",
            },
            ticks: {
              callback: (value) => {
                if (value < 0.01) return value.toExponential(1)
                if (value < 1) return value.toFixed(2)
                return value.toFixed(1)
              }
            }
          },
        },
      })
    }

    loadData()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic Anomaly Detection</CardTitle>
        <CardDescription>Packet size vs. duration (outliers may indicate attacks)</CardDescription>
      </CardHeader>
      <CardContent className="h-96">
        {chartData.datasets.length > 0 && <Scatter options={chartOptions} data={chartData} />}
      </CardContent>
    </Card>
  )
}
