"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, AlertTriangle, CheckCircle, Shield, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Enhanced network log data with attack categories matching your model training data
const sampleLogs = [
  {
    id: 1,
    timestamp: "2025-03-16T20:15:45",
    source: "192.168.1.105",
    destination: "172.217.167.78",
    protocol: "tcp",
    state: "CON",
    rate: "57.32156",
    packets: "12",
    bytes: "1842",
    attackCat: "Normal",
    label: "0",
    details: "Established connection",
  },
  {
    id: 2,
    timestamp: "2025-03-16T20:15:48",
    source: "192.168.1.105",
    destination: "104.244.42.193",
    protocol: "tcp",
    state: "CON",
    rate: "42.18753",
    packets: "8",
    bytes: "1254",
    attackCat: "Normal",
    label: "0",
    details: "Encrypted data transfer",
  },
  {
    id: 3,
    timestamp: "2025-03-16T20:15:52",
    source: "45.86.201.12",
    destination: "192.168.1.105",
    protocol: "tcp",
    state: "INT",
    rate: "98.75326",
    packets: "26",
    bytes: "3450",
    attackCat: "DoS",
    label: "1",
    details: "High packet rate detected",
  },
  {
    id: 4,
    timestamp: "2025-03-16T20:16:01",
    source: "192.168.1.105",
    destination: "93.184.216.34",
    protocol: "tcp",
    state: "FIN",
    rate: "12.38764",
    packets: "3",
    bytes: "742",
    attackCat: "Normal",
    label: "0",
    details: "Connection terminated",
  },
  {
    id: 5,
    timestamp: "2025-03-16T20:16:05",
    source: "185.142.236.43",
    destination: "192.168.1.105",
    protocol: "udp",
    state: "INT",
    rate: "87.42196",
    packets: "18",
    bytes: "2415",
    attackCat: "Reconnaissance",
    label: "1",
    details: "Port scanning detected",
  },
]

export default function NetworkLogsPanel() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [logs, setLogs] = useState([])

  // Simulate receiving network logs
  useEffect(() => {
    if (isMonitoring) {
      setLogs(sampleLogs)

      // Simulate new logs coming in
      const interval = setInterval(() => {
        // Generate random network traffic with occasional attack patterns
        const isAttack = Math.random() > 0.7
        const attackTypes = ["DoS", "Exploits", "Reconnaissance", "Shellcode", "Backdoor"]
        const protocols = ["tcp", "udp", "icmp"]
        const states = ["FIN", "CON", "RST", "INT"]
        
        const newLog = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          source: isAttack ? 
            `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` :
            "192.168.1.105",
          destination: isAttack ? 
            "192.168.1.105" :
            `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          protocol: protocols[Math.floor(Math.random() * protocols.length)],
          state: states[Math.floor(Math.random() * states.length)],
          rate: (Math.random() * 100).toFixed(5),
          packets: (Math.floor(Math.random() * 30) + 1).toString(),
          bytes: (Math.floor(Math.random() * 4000) + 200).toString(),
          attackCat: isAttack ? attackTypes[Math.floor(Math.random() * attackTypes.length)] : "Normal",
          label: isAttack ? "1" : "0",
          details: isAttack ? 
            ["Unusual traffic pattern", "Multiple connection attempts", "Port scan detected", "Payload signature matched", "Brute force attempt"][Math.floor(Math.random() * 5)] : 
            ["Standard web traffic", "Routine data transfer", "Application update", "DNS lookup", "Media streaming"][Math.floor(Math.random() * 5)],
        }

        setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 9)])
      }, 3000)

      return () => clearInterval(interval)
    } else {
      setLogs([])
    }
  }, [isMonitoring])

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-blue-500/30 shadow-lg shadow-blue-500/20 overflow-hidden w-full">
      <div className="p-4 border-b border-blue-500/30 flex justify-between items-center">
        <h3 className="font-semibold text-blue-300 text-xl">Live Network Traffic</h3>
        <Button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={isMonitoring 
            ? "bg-red-500 hover:bg-red-600 text-white border border-red-300 shadow-md shadow-red-500/30" 
            : "bg-blue-500 hover:bg-blue-600 text-white border border-blue-300 shadow-md shadow-blue-500/30"}
        >
          {isMonitoring ? (
            <>
              <Pause className="mr-2 h-4 w-4" /> Stop Monitoring
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Start Monitoring
            </>
          )}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b border-blue-500/30">
              <th className="px-4 py-2 text-left text-blue-300">Time</th>
              <th className="px-4 py-2 text-left text-blue-300">Source IP</th>
              <th className="px-4 py-2 text-left text-blue-300">Destination IP</th>
              <th className="px-4 py-2 text-left text-blue-300">Protocol</th>
              <th className="px-4 py-2 text-left text-blue-300">State</th>
              <th className="px-4 py-2 text-left text-blue-300">Rate</th>
              <th className="px-4 py-2 text-left text-blue-300">Attack Category</th>
              <th className="px-4 py-2 text-left text-blue-300">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr 
                  key={log.id} 
                  className={`border-t border-blue-500/10 hover:bg-blue-500/10 transition-colors duration-200 ${
                    log.label === "1" ? "bg-red-900/20" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-blue-100">{formatTimestamp(log.timestamp)}</td>
                  <td className="px-4 py-2 text-blue-100">{log.source}</td>
                  <td className="px-4 py-2 text-blue-100">{log.destination}</td>
                  <td className="px-4 py-2 text-purple-300">{log.protocol}</td>
                  <td className="px-4 py-2 text-blue-100">{log.state}</td>
                  <td className="px-4 py-2 text-blue-100">{log.rate}</td>
                  <td className="px-4 py-2">
                    <Badge 
                      variant={log.attackCat === "Normal" ? "outline" : "destructive"}
                      className={log.attackCat === "Normal" 
                        ? "border-blue-400 text-blue-400" 
                        : "bg-red-500 hover:bg-red-600 text-white"}
                    >
                      {log.attackCat}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-blue-100">{log.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {isMonitoring ? "Loading network logs..." : "Click 'Start Monitoring' to view network logs"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}