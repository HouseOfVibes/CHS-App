import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Home, City, Subdivision, VisitResult } from '../types'
import { format } from 'date-fns'

interface HomeWithRelations extends Home {
  cities?: City
  subdivisions?: Subdivision
}

function ViewHomes() {
  const [homes, setHomes] = useState<HomeWithRelations[]>([])
  const [filteredHomes, setFilteredHomes] = useState<HomeWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [cityFilter, setCityFilter] = useState<string>('')
  const [resultFilter, setResultFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fetch homes on component mount
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
          .order('date_visited', { ascending: false })
          .order('created_at', { ascending: false })

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

    // City filter
    if (cityFilter) {
      filtered = filtered.filter((home) => home.cities?.name === cityFilter)
    }

    // Result filter
    if (resultFilter) {
      filtered = filtered.filter((home) => home.result === resultFilter)
    }

    // Search query (address or street name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (home) =>
          home.address.toLowerCase().includes(query) ||
          home.street_name.toLowerCase().includes(query) ||
          home.contact_name?.toLowerCase().includes(query)
      )
    }

    setFilteredHomes(filtered)
  }, [cityFilter, resultFilter, searchQuery, homes])

  // Get unique cities from homes
  const uniqueCities = Array.from(
    new Set(homes.map((home) => home.cities?.name).filter(Boolean))
  ).sort()

  const visitResults: VisitResult[] = [
    'Not Home',
    'Scheduled Demo',
    'DND (Do Not Disturb)',
    'Already Has System',
    'Not Interested',
    'Interested - Call Back',
    'Sold/Closed',
  ]

  const getResultBadgeColor = (result: VisitResult | null) => {
    switch (result) {
      case 'Scheduled Demo':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Interested - Call Back':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Not Home':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'DND (Do Not Disturb)':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Not Interested':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'Already Has System':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Sold/Closed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const clearFilters = () => {
    setCityFilter('')
    setResultFilter('')
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">View Homes</h1>
            <p className="text-white/90 mt-1">Browse and filter logged visits</p>
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
        <div className="max-w-6xl mx-auto">
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-chs-deep-navy">
                Filters
              </h2>
              <button
                onClick={clearFilters}
                className="text-sm text-chs-water-blue hover:text-chs-teal-green font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Address, street, or contact..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                />
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Result Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result
                </label>
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                >
                  <option value="">All Results</option>
                  {visitResults.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-chs-deep-navy">{filteredHomes.length}</span> of{' '}
              <span className="font-semibold text-chs-deep-navy">{homes.length}</span> total visits
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chs-teal-green mx-auto mb-4"></div>
              <p className="text-gray-600">Loading homes...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredHomes.length === 0 && (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No homes found
              </h3>
              <p className="text-gray-600 mb-6">
                {homes.length === 0
                  ? "You haven't logged any visits yet. Get started by logging your first visit!"
                  : 'Try adjusting your filters to see more results.'}
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
          )}

          {/* Homes List */}
          {!isLoading && !error && filteredHomes.length > 0 && (
            <div className="space-y-4">
              {filteredHomes.map((home) => (
                <div
                  key={home.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left Section - Address & Details */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-chs-teal-green rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-chs-deep-navy">
                            {home.address}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {home.street_name}
                            {home.subdivisions && ` • ${home.subdivisions.name}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {home.cities?.name || 'Unknown City'}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="ml-13 space-y-2">
                        {home.contact_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span>{home.contact_name}</span>
                          </div>
                        )}

                        {home.phone_number && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <span>{home.phone_number}</span>
                          </div>
                        )}

                        {home.follow_up_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>
                              Follow-up: {format(new Date(home.follow_up_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}

                        {home.notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{home.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Result & Date */}
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getResultBadgeColor(
                          home.result
                        )}`}
                      >
                        {home.result || 'Unknown'}
                      </span>
                      <p className="text-sm text-gray-500">
                        {format(new Date(home.date_visited), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(home.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ViewHomes
