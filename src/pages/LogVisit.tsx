import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { geocodeAddress, getCurrentLocation } from '../lib/geocoding'
import type { City, Subdivision, VisitResult } from '../types'

// Form validation schema
const logVisitSchema = z.object({
  city_id: z.string().min(1, 'City is required'),
  subdivision_id: z.string().optional(),
  street_name: z.string().min(1, 'Street name is required'),
  address: z.string().min(1, 'Address is required'),
  result: z.enum([
    'Not Home',
    'Scheduled Demo',
    'DND (Do Not Disturb)',
    'Already Has System',
    'Not Interested',
    'Interested - Call Back',
    'Sold/Closed',
  ]),
  contact_name: z.string().optional(),
  phone_number: z.string().optional(),
  follow_up_date: z.string().optional(),
  notes: z.string().optional(),
})

type LogVisitFormData = z.infer<typeof logVisitSchema>

function LogVisit() {
  const navigate = useNavigate()
  const [cities, setCities] = useState<City[]>([])
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([])
  const [filteredSubdivisions, setFilteredSubdivisions] = useState<Subdivision[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Quick add modals
  const [showCityModal, setShowCityModal] = useState(false)
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(false)
  const [newCityName, setNewCityName] = useState('')
  const [newSubdivisionName, setNewSubdivisionName] = useState('')
  const [isAddingCity, setIsAddingCity] = useState(false)
  const [isAddingSubdivision, setIsAddingSubdivision] = useState(false)

  // Location tracking
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isPinningLocation, setIsPinningLocation] = useState(false)

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LogVisitFormData>({
    resolver: zodResolver(logVisitSchema),
  })

  const selectedCityId = watch('city_id')
  const selectedResult = watch('result')
  const watchedAddress = watch('address')
  const watchedCity = watch('city_id')

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching cities:', error)
        setError('Failed to load cities')
      } else if (data) {
        setCities(data)
      }
    }

    const fetchSubdivisions = async () => {
      const { data, error } = await supabase
        .from('subdivisions')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching subdivisions:', error)
      } else if (data) {
        setSubdivisions(data)
      }
    }

    fetchCities()
    fetchSubdivisions()
  }, [])

  // Filter subdivisions based on selected city
  useEffect(() => {
    if (selectedCityId) {
      const filtered = subdivisions.filter(
        (sub) => sub.city_id === selectedCityId
      )
      setFilteredSubdivisions(filtered)
    } else {
      setFilteredSubdivisions([])
    }
  }, [selectedCityId, subdivisions])

  // Check for duplicate addresses
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!watchedAddress || !watchedCity) {
        setDuplicateWarning(null)
        return
      }

      try {
        const { data, error } = await supabase
          .from('homes')
          .select('id, address, date_visited, result')
          .eq('address', watchedAddress)
          .eq('city_id', watchedCity)
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          const existingHome = data[0]
          setDuplicateWarning(
            `This address was already logged on ${existingHome.date_visited}${
              existingHome.result ? ` (${existingHome.result})` : ''
            }`
          )
        } else {
          setDuplicateWarning(null)
        }
      } catch (err) {
        console.error('Error checking duplicate:', err)
      }
    }

    // Debounce the check
    const timeoutId = setTimeout(checkDuplicate, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedAddress, watchedCity])

  const onSubmit = async (data: LogVisitFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Try to geocode if no location pinned
      let coords = location
      if (!coords && data.address && data.street_name) {
        const fullAddress = `${data.address} ${data.street_name}, ${cities.find(c => c.id === data.city_id)?.name || ''}, TX`
        coords = await geocodeAddress(fullAddress)
      }

      const homeData = {
        city_id: data.city_id,
        subdivision_id: data.subdivision_id || null,
        street_name: data.street_name,
        address: data.address,
        result: data.result,
        contact_name: data.contact_name || null,
        phone_number: data.phone_number || null,
        follow_up_date: data.follow_up_date || null,
        notes: data.notes || null,
        canvasser_id: user?.id || null,
        source: 'manual',
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        location_pinned_at: coords ? new Date().toISOString() : null,
      }

      const { error: insertError } = await supabase
        .from('homes')
        .insert([homeData])

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      reset()
      setLocation(null)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: any) {
      console.error('Error logging visit:', err)
      setError(err.message || 'Failed to log visit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const visitResults: VisitResult[] = [
    'Not Home',
    'Scheduled Demo',
    'DND (Do Not Disturb)',
    'Already Has System',
    'Not Interested',
    'Interested - Call Back',
    'Sold/Closed',
  ]

  // Show contact fields for certain results
  const shouldShowContactFields =
    selectedResult === 'Scheduled Demo' ||
    selectedResult === 'Interested - Call Back'

  // Add new city
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

      // Update cities list and select new city
      setCities([...cities, data].sort((a, b) => a.name.localeCompare(b.name)))
      setValue('city_id', data.id)
      setNewCityName('')
      setShowCityModal(false)
    } catch (err: any) {
      console.error('Error adding city:', err)
      alert(err.message || 'Failed to add city')
    } finally {
      setIsAddingCity(false)
    }
  }

  // Add new subdivision
  const handleAddSubdivision = async () => {
    if (!newSubdivisionName.trim() || !selectedCityId) return

    setIsAddingSubdivision(true)
    try {
      const { data, error } = await supabase
        .from('subdivisions')
        .insert([{ name: newSubdivisionName.trim(), city_id: selectedCityId }])
        .select()
        .single()

      if (error) throw error

      // Update subdivisions list and select new subdivision
      setSubdivisions([...subdivisions, data].sort((a, b) => a.name.localeCompare(b.name)))
      setValue('subdivision_id', data.id)
      setNewSubdivisionName('')
      setShowSubdivisionModal(false)
    } catch (err: any) {
      console.error('Error adding subdivision:', err)
      alert(err.message || 'Failed to add subdivision')
    } finally {
      setIsAddingSubdivision(false)
    }
  }

  // Pin current location
  const handlePinLocation = async () => {
    setIsPinningLocation(true)
    try {
      const coords = await getCurrentLocation()
      if (coords) {
        setLocation(coords)
      } else {
        alert('Unable to get your current location. Please enable location services.')
      }
    } catch (err) {
      console.error('Error pinning location:', err)
      alert('Failed to get current location')
    } finally {
      setIsPinningLocation(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Log Visit</h1>
            <p className="text-white/90 mt-1">Record a new home visit</p>
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
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">Visit logged successfully!</p>
              <p className="text-sm">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
            {/* City Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="city_id" className="block text-sm font-semibold text-chs-deep-navy">
                  City <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCityModal(true)}
                  className="text-sm text-chs-water-blue hover:text-chs-teal-green font-medium flex items-center gap-1"
                >
                  <span>+</span> New City
                </button>
              </div>
              <select
                {...register('city_id')}
                id="city_id"
                autoComplete="address-level2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.city_id && (
                <p className="text-red-500 text-sm mt-1">{errors.city_id.message}</p>
              )}
            </div>

            {/* Subdivision Selection (Optional) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="subdivision_id" className="block text-sm font-semibold text-chs-deep-navy">
                  Subdivision (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowSubdivisionModal(true)}
                  disabled={!selectedCityId}
                  className="text-sm text-chs-water-blue hover:text-chs-teal-green font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>+</span> New Subdivision
                </button>
              </div>
              <select
                {...register('subdivision_id')}
                id="subdivision_id"
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                disabled={!selectedCityId}
              >
                <option value="">No subdivision</option>
                {filteredSubdivisions.map((subdivision) => (
                  <option key={subdivision.id} value={subdivision.id}>
                    {subdivision.name}
                  </option>
                ))}
              </select>
              {!selectedCityId && (
                <p className="text-gray-500 text-sm mt-1">Select a city first</p>
              )}
            </div>

            {/* Street Name */}
            <div className="mb-6">
              <label htmlFor="street_name" className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Street Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('street_name')}
                id="street_name"
                autoComplete="address-line2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                placeholder="e.g., Main Street"
              />
              {errors.street_name && (
                <p className="text-red-500 text-sm mt-1">{errors.street_name.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="mb-6">
              <label htmlFor="address" className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('address')}
                id="address"
                autoComplete="street-address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                placeholder="e.g., 123 Main Street"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
              {duplicateWarning && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Possible Duplicate</p>
                    <p className="text-sm text-yellow-700">{duplicateWarning}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Visit Result */}
            <div className="mb-6">
              <label htmlFor="result" className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Visit Result <span className="text-red-500">*</span>
              </label>
              <select
                {...register('result')}
                id="result"
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
              >
                <option value="">Select result</option>
                {visitResults.map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
              {errors.result && (
                <p className="text-red-500 text-sm mt-1">{errors.result.message}</p>
              )}
            </div>

            {/* Contact Information (Conditional) */}
            {shouldShowContactFields && (
              <div className="mb-6 p-4 bg-chs-light-gray rounded-lg border-l-4 border-chs-bright-green">
                <h3 className="text-sm font-semibold text-chs-deep-navy mb-4">
                  Contact Information
                </h3>

                {/* Contact Name */}
                <div className="mb-4">
                  <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    {...register('contact_name')}
                    id="contact_name"
                    autoComplete="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Phone Number */}
                <div className="mb-4">
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('phone_number')}
                    id="phone_number"
                    autoComplete="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                    placeholder="e.g., (555) 123-4567"
                  />
                </div>

                {/* Follow-up Date */}
                <div>
                  <label htmlFor="follow_up_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    {...register('follow_up_date')}
                    id="follow_up_date"
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={4}
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent resize-none"
                placeholder="Additional notes or observations..."
              />
            </div>

            {/* Location Pin */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-chs-deep-navy">
                  Location (Optional)
                </label>
                {location && (
                  <span className="text-xs text-green-600 font-medium">✓ Location Pinned</span>
                )}
              </div>
              <button
                type="button"
                onClick={handlePinLocation}
                disabled={isPinningLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-chs-water-blue text-chs-water-blue rounded-lg font-semibold hover:bg-chs-water-blue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isPinningLocation ? 'Getting Location...' : location ? 'Update Location' : 'Pin Current Location'}
              </button>
              {location && (
                <p className="text-xs text-gray-500 mt-2">
                  Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {location ? 'Location will be saved with this visit.' : 'Address will be auto-geocoded if location not pinned.'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-chs-gradient text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Logging Visit...' : 'Log Visit'}
              </button>
              <Link
                to="/"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Add City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-4">Add New City</h3>
            <label htmlFor="new_city_name" className="sr-only">City Name</label>
            <input
              type="text"
              id="new_city_name"
              name="new_city_name"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
              placeholder="Enter city name"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddCity}
                disabled={!newCityName.trim() || isAddingCity}
                className="flex-1 bg-chs-gradient text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingCity ? 'Adding...' : 'Add City'}
              </button>
              <button
                onClick={() => {
                  setShowCityModal(false)
                  setNewCityName('')
                }}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subdivision Modal */}
      {showSubdivisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-2">Add New Subdivision</h3>
            <p className="text-sm text-gray-600 mb-4">
              For: <span className="font-semibold">{cities.find(c => c.id === selectedCityId)?.name}</span>
            </p>
            <label htmlFor="new_subdivision_name" className="sr-only">Subdivision Name</label>
            <input
              type="text"
              id="new_subdivision_name"
              name="new_subdivision_name"
              value={newSubdivisionName}
              onChange={(e) => setNewSubdivisionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubdivision()}
              placeholder="Enter subdivision name"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddSubdivision}
                disabled={!newSubdivisionName.trim() || isAddingSubdivision}
                className="flex-1 bg-chs-gradient text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingSubdivision ? 'Adding...' : 'Add Subdivision'}
              </button>
              <button
                onClick={() => {
                  setShowSubdivisionModal(false)
                  setNewSubdivisionName('')
                }}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogVisit
