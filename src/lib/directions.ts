/**
 * Opens Google Maps with directions to an address
 */
export function openDirections(address: string, city?: string) {
  const destination = city ? `${address}, ${city}, TX` : address
  const encodedDestination = encodeURIComponent(destination)

  // Google Maps directions URL
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`

  // Open in new tab
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens Google Maps with directions to coordinates
 */
export function openDirectionsToCoords(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
