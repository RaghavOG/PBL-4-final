"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchNetworkData } from "@/lib/data"

export function GeospatialAnalysis() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await fetchNetworkData()
      setLoading(false)
    }

    loadData()
  }, [])

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Geographic Attack Origins</CardTitle>
        <CardDescription>Global distribution of attack sources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] w-full overflow-hidden rounded-md border">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Loading map data...</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <img
                src="/placeholder.svg?height=400&width=800"
                alt="World map with attack hotspots"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white text-center px-4">
                  Geographic visualization requires additional mapping libraries.
                  <br />
                  In a production environment, this would display a world map with attack hotspots.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

