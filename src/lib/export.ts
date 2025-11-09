import type { Home, City, Subdivision } from '../types'

interface HomeWithRelations extends Home {
  cities?: City
  subdivisions?: Subdivision
}

/**
 * Export homes data to CSV format
 */
export function exportToCSV(homes: HomeWithRelations[], filename: string = 'chs-homes-export.csv') {
  if (homes.length === 0) {
    alert('No data to export')
    return
  }

  // Define CSV headers
  const headers = [
    'Date Visited',
    'Address',
    'Street',
    'City',
    'Subdivision',
    'Result',
    'Contact Name',
    'Phone Number',
    'Follow Up Date',
    'Notes',
    'Latitude',
    'Longitude',
    'Created At',
  ]

  // Convert homes to CSV rows
  const rows = homes.map((home) => [
    home.date_visited,
    home.address,
    home.street_name,
    home.cities?.name || '',
    home.subdivisions?.name || '',
    home.result || '',
    home.contact_name || '',
    home.phone_number || '',
    home.follow_up_date || '',
    home.notes || '',
    home.latitude?.toString() || '',
    home.longitude?.toString() || '',
    new Date(home.created_at).toLocaleString(),
  ])

  // Escape CSV fields (handle commas, quotes, newlines)
  const escapeCSVField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map((row) => row.map(escapeCSVField).join(',')),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export homes data to JSON format (for Excel/other tools)
 */
export function exportToJSON(homes: HomeWithRelations[], filename: string = 'chs-homes-export.json') {
  if (homes.length === 0) {
    alert('No data to export')
    return
  }

  // Format data for export
  const exportData = homes.map((home) => ({
    date_visited: home.date_visited,
    address: home.address,
    street_name: home.street_name,
    city: home.cities?.name || '',
    subdivision: home.subdivisions?.name || '',
    result: home.result || '',
    contact_name: home.contact_name || '',
    phone_number: home.phone_number || '',
    follow_up_date: home.follow_up_date || '',
    notes: home.notes || '',
    latitude: home.latitude,
    longitude: home.longitude,
    created_at: home.created_at,
  }))

  // Create blob and download
  const jsonContent = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
