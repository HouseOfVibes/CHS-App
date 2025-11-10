import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { City, Subdivision } from '../types'
import Footer from '../components/Footer'

interface SubdivisionWithCity extends Subdivision {
  cities?: City
}

function ManageLocations() {
  const [cities, setCities] = useState<City[]>([])
  const [subdivisions, setSubdivisions] = useState<SubdivisionWithCity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add new city
  const [newCityName, setNewCityName] = useState('')
  const [isAddingCity, setIsAddingCity] = useState(false)

  // Add new subdivision
  const [newSubdivisionName, setNewSubdivisionName] = useState('')
  const [selectedCityIdForSubdivision, setSelectedCityIdForSubdivision] = useState('')
  const [isAddingSubdivision, setIsAddingSubdivision] = useState(false)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'city' | 'subdivision', id: string, name: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .order('name')

      if (citiesError) throw citiesError

      // Fetch subdivisions with city info
      const { data: subdivisionsData, error: subdivisionsError } = await supabase
        .from('subdivisions')
        .select('*, cities(id, name)')
        .order('name')

      if (subdivisionsError) throw subdivisionsError

      setCities(citiesData || [])
      setSubdivisions(subdivisionsData || [])
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCity = async () => {
    if (!newCityName.trim()) return

    setIsAddingCity(true)
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert([{ name: newCityName.trim() }])
        .select()
        .single()

      if (error) throw error

      setCities([...cities, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCityName('')
    } catch (err: any) {
      console.error('Error adding city:', err)
      alert(err.message || 'Failed to add city')
    } finally {
      setIsAddingCity(false)
    }
  }

  const handleAddSubdivision = async () => {
    if (!newSubdivisionName.trim() || !selectedCityIdForSubdivision) return

    setIsAddingSubdivision(true)
    try {
      const { data, error } = await supabase
        .from('subdivisions')
        .insert([{ name: newSubdivisionName.trim(), city_id: selectedCityIdForSubdivision }])
        .select('*, cities(id, name)')
        .single()

      if (error) throw error

      setSubdivisions([...subdivisions, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewSubdivisionName('')
      setSelectedCityIdForSubdivision('')
    } catch (err: any) {
      console.error('Error adding subdivision:', err)
      alert(err.message || 'Failed to add subdivision')
    } finally {
      setIsAddingSubdivision(false)
    }
  }

  const handleDeleteCity = async (id: string) => {
    try {
      const { error } = await supabase.from('cities').delete().eq('id', id)

      if (error) throw error

      setCities(cities.filter((c) => c.id !== id))
      setSubdivisions(subdivisions.filter((s) => s.city_id !== id))
      setDeleteConfirm(null)
    } catch (err: any) {
      console.error('Error deleting city:', err)
      alert(err.message || 'Failed to delete city')
    }
  }

  const handleDeleteSubdivision = async (id: string) => {
    try {
      const { error } = await supabase.from('subdivisions').delete().eq('id', id)

      if (error) throw error

      setSubdivisions(subdivisions.filter((s) => s.id !== id))
      setDeleteConfirm(null)
    } catch (err: any) {
      console.error('Error deleting subdivision:', err)
      alert(err.message || 'Failed to delete subdivision')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-white">Manage Locations</h1>
            <p className="text-white/90 mt-1">Add, edit, and organize cities and subdivisions</p>
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

          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-chs-teal-green mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg font-medium">Loading locations...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Cities Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-chs-teal-green to-chs-bright-green rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-chs-deep-navy">Cities</h2>
                </div>

                {/* Add City Form */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New City</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
                      placeholder="City name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                    />
                    <button
                      onClick={handleAddCity}
                      disabled={!newCityName.trim() || isAddingCity}
                      className="bg-chs-teal-green text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingCity ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>

                {/* Cities List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cities.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No cities added yet</p>
                  ) : (
                    cities.map((city) => {
                      const subdivisionCount = subdivisions.filter((s) => s.city_id === city.id).length
                      return (
                        <div
                          key={city.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-semibold text-chs-deep-navy">{city.name}</p>
                            <p className="text-xs text-gray-500">
                              {subdivisionCount} subdivision{subdivisionCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'city', id: city.id, name: city.name })}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Subdivisions Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-chs-water-blue to-chs-deep-navy rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-chs-deep-navy">Subdivisions</h2>
                </div>

                {/* Add Subdivision Form */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Subdivision</h3>
                  <div className="space-y-2">
                    <select
                      value={selectedCityIdForSubdivision}
                      onChange={(e) => setSelectedCityIdForSubdivision(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubdivisionName}
                        onChange={(e) => setNewSubdivisionName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubdivision()}
                        placeholder="Subdivision name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                        disabled={!selectedCityIdForSubdivision}
                      />
                      <button
                        onClick={handleAddSubdivision}
                        disabled={!newSubdivisionName.trim() || !selectedCityIdForSubdivision || isAddingSubdivision}
                        className="bg-chs-water-blue text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingSubdivision ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subdivisions List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subdivisions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No subdivisions added yet</p>
                  ) : (
                    subdivisions.map((subdivision) => (
                      <div
                        key={subdivision.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold text-chs-deep-navy">{subdivision.name}</p>
                          <p className="text-xs text-gray-500">{subdivision.cities?.name}</p>
                        </div>
                        <button
                          onClick={() =>
                            setDeleteConfirm({ type: 'subdivision', id: subdivision.id, name: subdivision.name })
                          }
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-2">Confirm Delete</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
              {deleteConfirm.type === 'city' && (
                <span className="block text-sm text-red-600 mt-2">
                  Warning: This will also delete all subdivisions in this city.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  deleteConfirm.type === 'city'
                    ? handleDeleteCity(deleteConfirm.id)
                    : handleDeleteSubdivision(deleteConfirm.id)
                }
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ManageLocations
