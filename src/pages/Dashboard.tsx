import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'

interface DashboardStats {
  totalVisits: number
  thisWeek: number
  demosScheduled: number
  followUps: number
  topCity: string
  conversionRate: number
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    thisWeek: 0,
    demosScheduled: 0,
    followUps: 0,
    topCity: '-',
    conversionRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)

      try {
        // Fetch all homes
        const { data: homes, error } = await supabase
          .from('homes')
          .select(`
            *,
            cities (name)
          `)

        if (error) throw error

        const now = new Date()
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }) // Sunday
        const weekEnd = endOfWeek(now, { weekStartsOn: 0 }) // Saturday
        const weekStartStr = format(weekStart, 'yyyy-MM-dd')
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

        // Calculate stats
        const totalVisits = homes?.length || 0
        const thisWeek = homes?.filter(h => h.date_visited >= weekStartStr && h.date_visited <= weekEndStr).length || 0
        const demosScheduled = homes?.filter(h => h.result === 'Scheduled Demo').length || 0
        const followUps = homes?.filter(h => h.follow_up_date && h.follow_up_date >= format(now, 'yyyy-MM-dd')).length || 0

        // Calculate conversion rate (demos / total visits)
        const conversionRate = totalVisits > 0 ? ((demosScheduled / totalVisits) * 100) : 0

        // Find top city
        const cityCount: Record<string, number> = {}
        homes?.forEach(h => {
          const cityName = (h.cities as any)?.name || 'Unknown'
          cityCount[cityName] = (cityCount[cityName] || 0) + 1
        })
        const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

        setStats({
          totalVisits,
          thisWeek,
          demosScheduled,
          followUps,
          topCity,
          conversionRate,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">
            Continental Home Solutions
          </h1>
          <p className="text-white/90 mt-1">Field Canvassing App</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-chs-deep-navy mb-2">
              Welcome to CHS App
            </h2>
            <p className="text-gray-600">
              Track your home visits, manage leads, and optimize your canvassing routes.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Log Visit Card */}
            <Link to="/log-visit">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-chs-teal-green">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-chs-teal-green rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-chs-deep-navy">
                    Log Visit
                  </h3>
                </div>
                <p className="text-gray-600">
                  Record a new home visit with results and contact information.
                </p>
              </div>
            </Link>

            {/* View Homes Card */}
            <Link to="/view-homes">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-chs-water-blue">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-chs-water-blue rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-chs-deep-navy">
                    View Homes
                  </h3>
                </div>
                <p className="text-gray-600">
                  Browse and filter all logged home visits.
                </p>
              </div>
            </Link>

            {/* Manage Locations Card */}
            <Link to="/manage-locations">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-chs-bright-green">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-chs-bright-green rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-chs-deep-navy">
                    Manage Locations
                  </h3>
                </div>
                <p className="text-gray-600">
                  Add and organize cities and subdivisions.
                </p>
              </div>
            </Link>

            {/* Map View Card */}
            <Link to="/map-view">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-chs-deep-navy">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-chs-deep-navy rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-chs-deep-navy">
                    Map View
                  </h3>
                </div>
                <p className="text-gray-600">
                  View all logged homes on an interactive map.
                </p>
              </div>
            </Link>
          </div>

          {/* Stats Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-4">
              Quick Stats
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chs-teal-green"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-chs-teal-green/10 to-chs-teal-green/5 rounded-lg">
                    <p className="text-3xl font-bold text-chs-teal-green">{stats.totalVisits}</p>
                    <p className="text-sm text-gray-600 mt-1">Total Visits</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-chs-water-blue/10 to-chs-water-blue/5 rounded-lg">
                    <p className="text-3xl font-bold text-chs-water-blue">{stats.thisWeek}</p>
                    <p className="text-sm text-gray-600 mt-1">This Week</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-chs-bright-green/10 to-chs-bright-green/5 rounded-lg">
                    <p className="text-3xl font-bold text-chs-bright-green">{stats.demosScheduled}</p>
                    <p className="text-sm text-gray-600 mt-1">Demos Scheduled</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center border-t pt-6">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.followUps}</p>
                    <p className="text-sm text-gray-600 mt-1">Pending Follow-ups</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.conversionRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{stats.topCity}</p>
                    <p className="text-sm text-gray-600 mt-1">Top City</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
