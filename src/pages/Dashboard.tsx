import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import type { AdminNote } from '../types'
import Footer from '../components/Footer'

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

  // Daily Notes state
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [showAllNotes, setShowAllNotes] = useState(false)

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

  // Fetch admin notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_notes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setNotes(data || [])
      } catch (err) {
        console.error('Error fetching notes:', err)
      }
    }

    fetchNotes()
  }, [])

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsAddingNote(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('admin_notes')
        .insert([
          {
            note: newNote.trim(),
            user_id: user?.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Add to beginning of notes array
      setNotes([data, ...notes])
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Failed to add note. Please try again.')
    } finally {
      setIsAddingNote(false)
    }
  }

  // Delete a note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setNotes(notes.filter((n) => n.id !== noteId))
    } catch (err) {
      console.error('Error deleting note:', err)
      alert('Failed to delete note. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold text-white">
            Continental Home Solutions
          </h1>
          <p className="text-white/90 mt-1">Field Canvassing App</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        {/* Environment Configuration Warning */}
        {!isSupabaseConfigured && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-lg max-w-7xl mx-auto">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Required</h3>
                <p className="text-red-700 mb-3">
                  The app is missing required environment variables. Please configure the following in your Vercel project settings:
                </p>
                <ul className="list-disc list-inside text-red-700 space-y-1 text-sm font-mono">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                  <li>VITE_GOOGLE_MAPS_API_KEY</li>
                </ul>
                <p className="text-red-600 text-sm mt-3">
                  After adding environment variables, redeploy the application without using build cache.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section - Brand Enhanced */}
        <div className="max-w-7xl mx-auto mb-10">
          <div className="bg-gradient-to-r from-chs-deep-navy via-chs-water-blue to-chs-teal-green rounded-2xl shadow-2xl p-8 md:p-10 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Welcome to CHS Field App
                </h2>
                <p className="text-white/90 text-lg">
                  Track visits, manage leads, and optimize your canvassing routes with ease.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-8 text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 min-w-[120px]">
                  <p className="text-4xl font-bold">{stats.totalVisits}</p>
                  <p className="text-sm text-white/80 mt-1">Total Visits</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 min-w-[120px]">
                  <p className="text-4xl font-bold">{stats.demosScheduled}</p>
                  <p className="text-sm text-white/80 mt-1">Demos Set</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Full Width Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Log Visit Card */}
            <Link to="/log-visit" className="group">
              <div className="bg-gradient-to-br from-white to-chs-teal-green/5 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-chs-teal-green hover:scale-[1.02] min-h-[220px]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-chs-teal-green to-chs-bright-green rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-chs-deep-navy mb-2">
                      Log Visit
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Record a new home visit with results and contact information.
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* View Homes Card */}
            <Link to="/view-homes" className="group">
              <div className="bg-gradient-to-br from-white to-chs-water-blue/5 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-chs-water-blue hover:scale-[1.02] min-h-[220px]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-chs-water-blue to-chs-deep-navy rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-chs-deep-navy mb-2">
                      View Homes
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Browse and filter all logged home visits.
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Map View Card */}
            <Link to="/map-view" className="group">
              <div className="bg-gradient-to-br from-white to-chs-deep-navy/5 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-chs-deep-navy hover:scale-[1.02] min-h-[220px]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-chs-deep-navy to-chs-water-blue rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-chs-deep-navy mb-2">
                      Map View
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      View all logged homes on an interactive map.
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Manage Locations Card */}
            <Link to="/manage-locations" className="group">
              <div className="bg-gradient-to-br from-white to-chs-bright-green/5 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-chs-bright-green hover:scale-[1.02] min-h-[220px]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-chs-bright-green to-chs-teal-green rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-chs-deep-navy mb-2">
                      Manage Locations
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Add and organize cities and subdivisions.
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Import Homes Card */}
            <Link to="/import-homes" className="group">
              <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-500 hover:scale-[1.02] min-h-[220px]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-chs-deep-navy mb-2">
                      Import Homes
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Bulk import prospective homes from CSV files.
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Section - Brand Enhanced */}
        <div className="max-w-7xl mx-auto mt-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-chs-teal-green to-chs-bright-green rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-chs-deep-navy">
                Performance Stats
              </h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chs-teal-green"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-6 bg-gradient-to-br from-chs-teal-green/10 to-chs-teal-green/5 rounded-xl border-2 border-chs-teal-green/20 hover:border-chs-teal-green/40 transition-colors">
                  <p className="text-4xl font-bold text-chs-teal-green mb-2">{stats.totalVisits}</p>
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-chs-water-blue/10 to-chs-water-blue/5 rounded-xl border-2 border-chs-water-blue/20 hover:border-chs-water-blue/40 transition-colors">
                  <p className="text-4xl font-bold text-chs-water-blue mb-2">{stats.thisWeek}</p>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-chs-bright-green/10 to-chs-bright-green/5 rounded-xl border-2 border-chs-bright-green/20 hover:border-chs-bright-green/40 transition-colors">
                  <p className="text-4xl font-bold text-chs-bright-green mb-2">{stats.demosScheduled}</p>
                  <p className="text-sm font-medium text-gray-600">Demos Set</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                  <p className="text-4xl font-bold text-purple-600 mb-2">{stats.followUps}</p>
                  <p className="text-sm font-medium text-gray-600">Follow-ups</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-colors">
                  <p className="text-4xl font-bold text-orange-600 mb-2">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm font-medium text-gray-600">Convert Rate</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl border-2 border-indigo-200 hover:border-indigo-300 transition-colors">
                  <p className="text-2xl font-bold text-indigo-600 mb-2 truncate" title={stats.topCity}>{stats.topCity}</p>
                  <p className="text-sm font-medium text-gray-600">Top City</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Notes Section - Brand Enhanced */}
        <div className="max-w-7xl mx-auto mt-8 mb-10">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-chs-water-blue to-chs-deep-navy rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-chs-deep-navy">
                Daily Notes & Journal
              </h3>
            </div>

            {/* Add Note Form */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddNote()
                    }
                  }}
                  placeholder="Add a daily note, reminder, or observation... (Ctrl+Enter to save)"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-chs-teal-green focus:border-chs-teal-green transition-all resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNote.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-chs-teal-green to-chs-bright-green text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                >
                  {isAddingNote ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Add Note'
                  )}
                </button>
              </div>
            </div>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-lg">No notes yet. Start by adding your first daily note above!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(showAllNotes ? notes : notes.slice(0, 5)).map((note) => (
                    <div key={note.id} className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-chs-teal-green hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                          <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {format(new Date(note.created_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-all p-2 rounded-lg"
                          title="Delete note"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {notes.length > 5 && (
                  <button
                    onClick={() => setShowAllNotes(!showAllNotes)}
                    className="mt-6 px-6 py-3 text-chs-water-blue hover:text-white hover:bg-chs-water-blue border-2 border-chs-water-blue rounded-xl font-semibold text-sm flex items-center gap-2 mx-auto transition-all"
                  >
                    {showAllNotes ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show All ({notes.length} notes)
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Dashboard
