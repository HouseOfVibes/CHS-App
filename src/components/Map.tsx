import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { useState, useCallback } from 'react'
import type { Home, City, Subdivision } from '../types'

interface HomeWithRelations extends Home {
  cities?: City
  subdivisions?: Subdivision
}

interface MapProps {
  homes: HomeWithRelations[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

// Default center: Houston, TX
const defaultCenter = {
  lat: 29.7604,
  lng: -95.3698,
}

function Map({ homes, center = defaultCenter, zoom = 11, height = '600px' }: MapProps) {
  const [selectedHome, setSelectedHome] = useState<HomeWithRelations | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  const onLoad = useCallback((_map: google.maps.Map) => {
    // Map instance loaded - can be used for future map operations
  }, [])

  const onUnmount = useCallback(() => {
    // Map instance unmounted
  }, [])

  // Filter homes that have coordinates
  const homesWithLocation = homes.filter((home) => home.latitude && home.longitude)

  // Get marker color based on visit result
  const getMarkerColor = (result: string | null) => {
    switch (result) {
      case 'Scheduled Demo':
        return 'green'
      case 'Interested - Call Back':
        return 'blue'
      case 'Not Home':
        return 'yellow'
      case 'DND (Do Not Disturb)':
        return 'red'
      case 'Not Interested':
        return 'gray'
      case 'Already Has System':
        return 'purple'
      case 'Sold/Closed':
        return 'orange'
      default:
        return 'red'
    }
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-red-600">Error loading Google Maps</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chs-teal-green"></div>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Render markers for homes with locations */}
        {homesWithLocation.map((home) => (
          <Marker
            key={home.id}
            position={{ lat: home.latitude!, lng: home.longitude! }}
            onClick={() => setSelectedHome(home)}
            icon={{
              url: `http://maps.google.com/mapfiles/ms/icons/${getMarkerColor(home.result)}-dot.png`,
            }}
          />
        ))}

        {/* Info window for selected home */}
        {selectedHome && selectedHome.latitude && selectedHome.longitude && (
          <InfoWindow
            position={{ lat: selectedHome.latitude, lng: selectedHome.longitude }}
            onCloseClick={() => setSelectedHome(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-chs-deep-navy mb-1">{selectedHome.address}</h3>
              <p className="text-sm text-gray-600 mb-1">{selectedHome.street_name}</p>
              <p className="text-sm text-gray-600 mb-2">
                {selectedHome.cities?.name}
                {selectedHome.subdivisions && ` • ${selectedHome.subdivisions.name}`}
              </p>
              {selectedHome.result && (
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                  {selectedHome.result}
                </span>
              )}
              {selectedHome.contact_name && (
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Contact:</strong> {selectedHome.contact_name}
                </p>
              )}
              {selectedHome.phone_number && (
                <p className="text-sm text-gray-700">
                  <strong>Phone:</strong> {selectedHome.phone_number}
                </p>
              )}
              {selectedHome.notes && (
                <p className="text-sm text-gray-600 mt-1 italic">{selectedHome.notes}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default Map
