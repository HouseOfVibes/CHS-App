import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'
import type { AdminNote } from '../types'

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

            {/* Import Homes Card */}
            <Link to="/import-homes">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-600">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-chs-deep-navy">
                    Import Homes
                  </h3>
                </div>
                <p className="text-gray-600">
                  Bulk import prospective homes from CSV files.
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

          {/* Daily Notes Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-chs-teal-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Daily Notes & Journal
            </h3>

            {/* Add Note Form */}
            <div className="mb-6">
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddNote()
                    }
                  }}
                  placeholder="Add a daily note, reminder, or observation... (Ctrl+Enter to save)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNote.trim()}
                  className="px-6 py-3 bg-chs-teal-green text-white rounded-lg hover:bg-chs-water-blue transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                >
                  {isAddingNote ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Add Note'
                  )}
                </button>
              </div>
            </div>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No notes yet. Start by adding your first daily note above!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(showAllNotes ? notes : notes.slice(0, 5)).map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-chs-teal-green transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 whitespace-pre-wrap">{note.note}</p>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {format(new Date(note.created_at), 'MMM dd, yyyy • h:mm a')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
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
                    className="mt-4 text-chs-water-blue hover:text-chs-teal-green font-medium text-sm flex items-center gap-1 mx-auto"
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
    </div>
  )
}

export default Dashboard
