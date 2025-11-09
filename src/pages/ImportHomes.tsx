import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { City } from '../types'

interface ParsedHome {
  address: string
  street_name: string
  city_name: string
  subdivision_name?: string
  notes?: string
}

function ImportHomes() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [parsedHomes, setParsedHomes] = useState<ParsedHome[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setParsedHomes([])
      setImportResults(null)
    }
  }

  const parseCSV = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())

      if (lines.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Parse CSV (assuming format: address, street_name, city_name, subdivision_name, notes)
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const homes: ParsedHome[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim())

        if (values.length < 3) continue // Need at least address, street_name, city_name

        const home: ParsedHome = {
          address: values[0] || '',
          street_name: values[1] || '',
          city_name: values[2] || '',
          subdivision_name: values[3] || undefined,
          notes: values[4] || undefined,
        }

        if (home.address && home.city_name) {
          homes.push(home)
        }
      }

      if (homes.length === 0) {
        throw new Error('No valid homes found in CSV. Please check the format.')
      }

      setParsedHomes(homes)
    } catch (err: any) {
      console.error('Error parsing CSV:', err)
      setError(err.message || 'Failed to parse CSV file')
    } finally {
      setIsProcessing(false)
    }
  }

  const importHomes = async () => {
    if (parsedHomes.length === 0) return

    setIsImporting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch all cities to match names to IDs
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('id, name')

      if (citiesError) throw citiesError

      const cityMap = new Map<string, string>()
      cities?.forEach((city: City) => {
        cityMap.set(city.name.toLowerCase(), city.id)
      })

      // Fetch all subdivisions
      const { data: subdivisions, error: subdivisionsError } = await supabase
        .from('subdivisions')
        .select('id, name, city_id')

      if (subdivisionsError) throw subdivisionsError

      const subdivisionMap = new Map<string, string>()
      subdivisions?.forEach((sub: any) => {
        subdivisionMap.set(`${sub.city_id}:${sub.name.toLowerCase()}`, sub.id)
      })

      let successCount = 0
      let failedCount = 0

      // Import homes one by one
      for (const home of parsedHomes) {
        try {
          const cityId = cityMap.get(home.city_name.toLowerCase())

          if (!cityId) {
            console.warn(`City not found: ${home.city_name}`)
            failedCount++
            continue
          }

          let subdivisionId = null
          if (home.subdivision_name) {
            subdivisionId = subdivisionMap.get(`${cityId}:${home.subdivision_name.toLowerCase()}`)
          }

          const homeData = {
            address: home.address,
            street_name: home.street_name || home.address,
            city_id: cityId,
            subdivision_id: subdivisionId,
            result: 'Not Home' as const, // Default result for imported homes
            notes: home.notes ? `[IMPORTED] ${home.notes}` : '[IMPORTED] Prospective home to visit',
            canvasser_id: user?.id || null,
            source: 'manual' as const,
            date_visited: new Date().toISOString().split('T')[0],
          }

          const { error: insertError } = await supabase
            .from('homes')
            .insert([homeData])

          if (insertError) {
            // Check if it's a duplicate (unique constraint violation)
            if (insertError.code === '23505') {
              console.warn(`Duplicate home: ${home.address}`)
            } else {
              console.error(`Error importing ${home.address}:`, insertError)
            }
            failedCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Error processing home:`, err)
          failedCount++
        }
      }

      setImportResults({ success: successCount, failed: failedCount })

      if (successCount > 0) {
        setTimeout(() => {
          navigate('/view-homes')
        }, 3000)
      }
    } catch (err: any) {
      console.error('Error importing homes:', err)
      setError(err.message || 'Failed to import homes')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chs-light-aqua via-white to-chs-light-gray">
      {/* Header */}
      <header className="bg-chs-gradient shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Import Homes</h1>
            <p className="text-white/90 mt-1">Bulk import prospective homes from CSV</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              CSV Format Instructions
            </h3>
            <p className="text-blue-800 text-sm mb-3">
              Your CSV file should have the following columns (in order):
            </p>
            <ol className="text-blue-800 text-sm list-decimal list-inside space-y-1 mb-3">
              <li><strong>Address</strong> - Street address (e.g., "123 Main St")</li>
              <li><strong>Street Name</strong> - Street name (e.g., "Main Street")</li>
              <li><strong>City Name</strong> - Must match a city in your database</li>
              <li><strong>Subdivision</strong> - Optional subdivision name</li>
              <li><strong>Notes</strong> - Optional notes</li>
            </ol>
            <div className="bg-white p-3 rounded border border-blue-300 font-mono text-xs">
              <div>123 Main St,Main Street,Pearland,Silverlake,New construction</div>
              <div>456 Oak Ave,Oak Avenue,Lake Jackson,,</div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-4">Step 1: Upload CSV File</h3>

            <div className="mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-chs-teal-green file:text-white hover:file:bg-chs-water-blue cursor-pointer"
              />
            </div>

            {file && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Selected file:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={parseCSV}
              disabled={!file || isProcessing}
              className="px-6 py-3 bg-chs-teal-green text-white rounded-lg hover:bg-chs-water-blue transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Preview Homes'}
            </button>
          </div>

          {/* Preview Section */}
          {parsedHomes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-chs-deep-navy mb-4">
                Step 2: Preview & Import ({parsedHomes.length} homes)
              </h3>

              <div className="max-h-96 overflow-y-auto mb-4 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdivision</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedHomes.map((home, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">{home.address}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{home.city_name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-500">{home.subdivision_name || '-'}</td>
                        <td className="px-4 py-2 text-gray-500">{home.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={importHomes}
                disabled={isImporting}
                className="px-6 py-3 bg-chs-bright-green text-white rounded-lg hover:bg-chs-teal-green transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import {parsedHomes.length} Homes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {importResults && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-chs-deep-navy mb-4">Import Complete!</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                  <p className="text-sm text-green-800">Successfully Imported</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                  <p className="text-sm text-red-800">Failed (duplicates or errors)</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                Redirecting to View Homes in 3 seconds...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ImportHomes
