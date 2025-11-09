import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { City, Subdivision, Home } from '../types'

export default function ViewHomes() {
  const [cities, setCities] = useState<City[]>([])
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([])
  const [homes, setHomes] = useState<Home[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Fetch cities on mount
  useEffect(() => {
    fetchCities()
  }, [])

  // Fetch subdivisions when city changes
  useEffect(() => {
    if (selectedCity) {
      fetchSubdivisions(selectedCity)
    } else {
      setSubdivisions([])
      setSelectedSubdivision('')
    }
  }, [selectedCity])

  // Fetch homes when filters change
  useEffect(() => {
    fetchHomes()
  }, [selectedCity, selectedSubdivision])

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name')

      if (error) throw error
      setCities(data || [])
    } catch (err) {
      console.error('Error fetching cities:', err)
      setError('Failed to load cities')
    }
  }

  const fetchSubdivisions = async (cityId: string) => {
    try {
      const { data, error } = await supabase
        .from('subdivisions')
        .select('*')
        .eq('city_id', cityId)
        .order('name')

      if (error) throw error
      setSubdivisions(data || [])
    } catch (err) {
      console.error('Error fetching subdivisions:', err)
      setError('Failed to load subdivisions')
    }
  }

  const fetchHomes = async () => {
    setLoading(true)
    setError('')

    try {
      let query = supabase
        .from('homes')
        .select(`
          *,
          cities:city_id (name),
          subdivisions:subdivision_id (name)
        `)
        .order('date_visited', { ascending: false })

      if (selectedCity) {
        query = query.eq('city_id', selectedCity)
      }

      if (selectedSubdivision) {
        query = query.eq('subdivision_id', selectedSubdivision)
      }

      const { data, error } = await query

      if (error) throw error
      setHomes(data || [])
    } catch (err) {
      console.error('Error fetching homes:', err)
      setError('Failed to load homes')
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (result: string | null) => {
    switch (result) {
      case 'Scheduled Demo':
        return 'bg-green-100 text-green-800'
      case 'Interested - Call Back':
        return 'bg-blue-100 text-blue-800'
      case 'Not Home':
        return 'bg-yellow-100 text-yellow-800'
      case 'Not Interested':
      case 'DND (Do Not Disturb)':
        return 'bg-red-100 text-red-800'
      case 'Already Has System':
      case 'Sold/Closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">View Homes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse and filter visited homes by city and subdivision
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subdivision" className="block text-sm font-medium text-gray-700 mb-2">
                Subdivision
              </label>
              <select
                id="subdivision"
                value={selectedSubdivision}
                onChange={(e) => setSelectedSubdivision(e.target.value)}
                disabled={!selectedCity}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Subdivisions</option>
                {subdivisions.map((subdivision) => (
                  <option key={subdivision.id} value={subdivision.id}>
                    {subdivision.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Homes List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading homes...</div>
          </div>
        ) : homes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No homes found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subdivision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Visited
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {homes.map((home: any) => (
                    <tr key={home.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{home.address}</div>
                        {home.street_name && (
                          <div className="text-sm text-gray-500">{home.street_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {home.cities?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {home.subdivisions?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {home.result ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getResultColor(home.result)}`}>
                            {home.result}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {home.contact_name || home.phone_number ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{home.contact_name || '-'}</div>
                            <div className="text-gray-500">{home.phone_number || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(home.date_visited).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && homes.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {homes.length} {homes.length === 1 ? 'home' : 'homes'}
          </div>
        )}
      </div>
    </div>
  )
}
