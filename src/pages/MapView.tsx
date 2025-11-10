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
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 px-6 py-4 rounded-xl mb-8 shadow-md">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-red-800 text-lg">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Filter by Result:</label>
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-chs-teal-green focus:border-chs-teal-green transition-all"
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
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-chs-teal-green mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg font-medium">Loading map...</p>
            </div>
          ) : filteredHomes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
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
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <Map homes={filteredHomes} center={getMapCenter()} zoom={12} height="700px" />
            </div>
          )}

          {/* Legend */}
          {filteredHomes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mt-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-chs-teal-green to-chs-bright-green rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-chs-deep-navy">Map Legend</h3>
              </div>
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
