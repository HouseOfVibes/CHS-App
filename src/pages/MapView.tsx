import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Map from '../components/Map'
import type { Home, City, Subdivision, VisitResult } from '../types'
import Footer from '../components/Footer'

interface HomeWithRelations extends Home {
  cities?: City
  subdivisions?: Subdivision
}

function MapView() {
  const [homes, setHomes] = useState<HomeWithRelations[]>([])
  const [filteredHomes, setFilteredHomes] = useState<HomeWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [resultFilter, setResultFilter] = useState<string>('')

  // Fetch homes
  useEffect(() => {
    const fetchHomes = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from('homes')
          .select(`
            *,
            cities (id, name),
            subdivisions (id, name)
          `)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('date_visited', { ascending: false })

        if (error) {
          throw error
        }

        setHomes(data || [])
        setFilteredHomes(data || [])
      } catch (err: any) {
        console.error('Error fetching homes:', err)
        setError(err.message || 'Failed to load homes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHomes()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...homes]

    // Result filter
    if (resultFilter) {
      filtered = filtered.filter((home) => home.result === resultFilter)
    }

    setFilteredHomes(filtered)
  }, [resultFilter, homes])

  const visitResults: VisitResult[] = [
    'Not Home',
    'Scheduled Demo',
    'DND (Do Not Disturb)',
    'Already Has System',
    'Not Interested',
    'Interested - Call Back',
    'Sold/Closed',
  ]

  // Calculate center point of all homes
  const getMapCenter = () => {
    if (filteredHomes.length === 0) {
      return { lat: 29.7604, lng: -95.3698 } // Default: Houston, TX
    }

    const sum = filteredHomes.reduce(
      (acc, home) => ({
        lat: acc.lat + (home.latitude || 0),
        lng: acc.lng + (home.longitude || 0),
      }),
      { lat: 0, lng: 0 }
    )

    return {
      lat: sum.lat / filteredHomes.length,
      lng: sum.lng / filteredHomes.length,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-white">Map View</h1>
            <p className="text-white/90 mt-1">View home visits on map</p>
          </div>
          <Link
            to="/"
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by Result:</label>
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                >
                  <option value="">All Results</option>
                  {visitResults.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-chs-deep-navy">{filteredHomes.length}</span> of{' '}
                <span className="font-semibold text-chs-deep-navy">{homes.length}</span> homes with locations
              </p>
            </div>
          </div>

          {/* Map */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chs-teal-green mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          ) : filteredHomes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No locations found</h3>
              <p className="text-gray-600 mb-6">
                {homes.length === 0
                  ? "You haven't logged any visits yet. Get started by logging your first visit!"
                  : 'No homes have location data. Try logging a visit with location pinned.'}
              </p>
              {homes.length === 0 && (
                <Link
                  to="/log-visit"
                  className="inline-block bg-chs-gradient text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  Log Your First Visit
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <Map homes={filteredHomes} center={getMapCenter()} zoom={12} height="700px" />
            </div>
          )}

          {/* Legend */}
          {filteredHomes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <h3 className="text-sm font-semibold text-chs-deep-navy mb-3">Map Legend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Scheduled Demo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Interested - Call Back</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700">Not Home</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">DND</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-700">Not Interested</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-700">Already Has System</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-700">Sold/Closed</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default MapView
