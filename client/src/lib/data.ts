// Function to fetch and parse CSV data from the public folder
export async function fetchNetworkData() {
  try {
    const response = await fetch("/UNSW_NB15_training-set.csv")
    const csvText = await response.text()

    // Parse CSV
    const rows = csvText.split("\n")
    const headers = rows[0].split(",")

    const data = rows
      .slice(10000, 60001)
      .map((row) => {
        if (!row.trim()) return null 

        const values = row.split(",")
        const rowData: Record<string, string> = {}

        headers.forEach((header, index) => {
          rowData[header.trim()] = values[index]?.trim() || ""
        })

        return rowData
      })
      .filter(Boolean) // Remove null entries

    return data as Record<string, string>[]
  } catch (error) {
    console.error("Error loading CSV data:", error)
    return []
  }
}

// Helper function to group data by a specific field
export function groupDataBy(data: Record<string, string>[], field: string) {
  const grouped: Record<string, number> = {}

  data.forEach((item) => {
    const value = item[field] || "Unknown"
    grouped[value] = (grouped[value] || 0) + 1
  })

  return grouped
}

// Helper function to generate random colors
export function generateColors(count: number) {
  const colors = []
  for (let i = 0; i < count; i++) {
    const hue = (i * 137) % 360 // Use golden angle approximation for better distribution
    colors.push(`hsl(${hue}, 70%, 60%)`)
  }
  return colors
}
