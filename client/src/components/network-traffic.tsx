"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchNetworkData } from "@/lib/data"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Title, Tooltip, Legend)

export function NetworkTraffic() {
  const [chartData, setChartData] = useState<ChartData<"bar">>({
    labels: [],
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"bar">>({})
  const [isLogScale, setIsLogScale] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchNetworkData()

      // Group by protocol
      const protocolData: Record<string, { sent: number; received: number }> = {}

      data.forEach((item) => {
        const protocol = item.proto || "unknown"

        if (!protocolData[protocol]) {
          protocolData[protocol] = { sent: 0, received: 0 }
        }

        protocolData[protocol].sent += Number.parseInt(item.sbytes) || 0
        protocolData[protocol].received += Number.parseInt(item.dbytes) || 0
      })

      // Sort by total bytes (sent + received)
      const sortedProtocols = Object.entries(protocolData).sort((a, b) => {
        const totalA = a[1].sent + a[1].received
        const totalB = b[1].sent + b[1].received
        return totalB - totalA
      })

      // Limit to top 8 protocols for better visibility
      const topProtocols = sortedProtocols.slice(0, 8)
      
      const labels = topProtocols.map(([protocol]) => protocol)
      const sentData = topProtocols.map(([, data]) => data.sent)
      const receivedData = topProtocols.map(([, data]) => data.received)

      setChartData({
        labels,
        datasets: [
          {
            label: "Bytes Sent",
            data: sentData,
            backgroundColor: "rgba(75, 192, 192, 0.8)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          },
          {
            label: "Bytes Received",
            data: receivedData,
            backgroundColor: "rgba(153, 102, 255, 0.8)",
            borderColor: "rgba(153, 102, 255, 1)",
            borderWidth: 1,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          },
        ],
      })

      updateChartOptions(isLogScale)
    }

    const updateChartOptions = (useLogScale: boolean) => {
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
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${context.dataset.label}: ${value.toLocaleString()} bytes`;
              }
            }
          }
        },
        scales: {
          y: {
            type: useLogScale ? 'logarithmic' : 'linear',
            title: {
              display: true,
              text: "Bytes",
            },
            ticks: {
              callback: (value) => {
                const numericValue = Number(value)
                if (numericValue >= 1000000000) return (numericValue / 1000000000).toFixed(1) + "B"
                if (numericValue >= 1000000) return (numericValue / 1000000).toFixed(1) + "M"
                if (numericValue >= 1000) return (numericValue / 1000).toFixed(1) + "K"
                return numericValue
              },
            },
          },
          x: {
            title: {
              display: true,
              text: "Protocol",
            },
          },
        },
      })
    }

    loadData()
  }, [isLogScale])

  const toggleScale = () => {
    setIsLogScale(!isLogScale)
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Protocol Traffic Analysis</CardTitle>
          <CardDescription>Traffic volume by protocol (bytes sent/received)</CardDescription>
        </div>
        <button 
          onClick={toggleScale} 
          className="px-3 py-1 text-xs font-medium rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {isLogScale ? "Linear Scale" : "Log Scale"}
        </button>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.datasets.length > 0 && <Bar options={chartOptions} data={chartData} />}
        </div>
      </CardContent>
    </Card>
  )
}