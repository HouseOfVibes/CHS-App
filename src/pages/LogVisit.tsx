import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { City, Subdivision, VisitResult } from '../types'

const VISIT_RESULTS: VisitResult[] = [
  'Not Home',
  'Scheduled Demo',
  'DND (Do Not Disturb)',
  'Already Has System',
  'Not Interested',
  'Interested - Call Back',
  'Sold/Closed',
]

export default function LogVisit() {
  const [cities, setCities] = useState<City[]>([])
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>('')

  const [formData, setFormData] = useState({
    cityId: '',
    subdivisionId: '',
    streetName: '',
    address: '',
    result: '' as VisitResult | '',
    contactName: '',
    phoneNumber: '',
    followUpDate: '',
    notes: '',
    dateVisited: new Date().toISOString().split('T')[0], // Today's date
  })

  // Fetch cities on mount
  useEffect(() => {
    fetchCities()
  }, [])

  // Fetch subdivisions when city changes
  useEffect(() => {
    if (formData.cityId) {
      fetchSubdivisions(formData.cityId)
    } else {
      setSubdivisions([])
      setFormData((prev) => ({ ...prev, subdivisionId: '' }))
    }
  }, [formData.cityId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.cityId || !formData.address || !formData.dateVisited) {
        throw new Error('Please fill in all required fields')
      }

      // Prepare data for insertion
      const homeData = {
        city_id: formData.cityId || null,
        subdivision_id: formData.subdivisionId || null,
        street_name: formData.streetName,
        address: formData.address,
        result: formData.result || null,
        contact_name: formData.contactName || null,
        phone_number: formData.phoneNumber || null,
        follow_up_date: formData.followUpDate || null,
        notes: formData.notes || null,
        date_visited: formData.dateVisited,
        source: 'manual' as const,
      }

      const { error } = await supabase
        .from('homes')
        .insert([homeData])

      if (error) throw error

      setSuccess(true)
      // Reset form
      setFormData({
        cityId: formData.cityId, // Keep city selected
        subdivisionId: formData.subdivisionId, // Keep subdivision selected
        streetName: '',
        address: '',
        result: '',
        contactName: '',
        phoneNumber: '',
        followUpDate: '',
        notes: '',
        dateVisited: new Date().toISOString().split('T')[0],
      })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error logging visit:', err)
      setError(err.message || 'Failed to log visit')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Log Visit</h1>
          <p className="mt-2 text-sm text-gray-600">
            Record a new home visit and track follow-ups
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            Visit logged successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Location Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cityId" className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  id="cityId"
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subdivisionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Subdivision
                </label>
                <select
                  id="subdivisionId"
                  name="subdivisionId"
                  value={formData.subdivisionId}
                  onChange={handleChange}
                  disabled={!formData.cityId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a subdivision</option>
                  {subdivisions.map((subdivision) => (
                    <option key={subdivision.id} value={subdivision.id}>
                      {subdivision.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Name
                </label>
                <input
                  type="text"
                  id="streetName"
                  name="streetName"
                  value={formData.streetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Street"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 123 Main St"
                />
              </div>
            </div>
          </div>

          {/* Visit Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateVisited" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Visited <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="dateVisited"
                  name="dateVisited"
                  value={formData.dateVisited}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-2">
                  Result
                </label>
                <select
                  id="result"
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a result</option>
                  {VISIT_RESULTS.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  id="followUpDate"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes about the visit..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging Visit...' : 'Log Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
