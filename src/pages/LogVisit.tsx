import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
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

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LogVisitFormData>({
    resolver: zodResolver(logVisitSchema),
  })

  const selectedCityId = watch('city_id')
  const selectedResult = watch('result')

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

  const onSubmit = async (data: LogVisitFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

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
      }

      const { error: insertError } = await supabase
        .from('homes')
        .insert([homeData])

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      reset()

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
              <label className="block text-sm font-semibold text-chs-deep-navy mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <select
                {...register('city_id')}
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
              <label className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Subdivision (Optional)
              </label>
              <select
                {...register('subdivision_id')}
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
              <label className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Street Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('street_name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                placeholder="e.g., Main Street"
              />
              {errors.street_name && (
                <p className="text-red-500 text-sm mt-1">{errors.street_name.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                placeholder="e.g., 123 Main Street"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Visit Result */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Visit Result <span className="text-red-500">*</span>
              </label>
              <select
                {...register('result')}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    {...register('contact_name')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Phone Number */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('phone_number')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                    placeholder="e.g., (555) 123-4567"
                  />
                </div>

                {/* Follow-up Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    {...register('follow_up_date')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-chs-deep-navy mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-chs-teal-green focus:border-transparent resize-none"
                placeholder="Additional notes or observations..."
              />
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
    </div>
  )
}

export default LogVisit
