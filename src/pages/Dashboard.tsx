import { Link } from 'react-router-dom'

function Dashboard() {
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
          <div className="grid md:grid-cols-2 gap-6">
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
          </div>

          {/* Stats Section (Placeholder for Phase 1) */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-chs-deep-navy mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-chs-teal-green">0</p>
                <p className="text-sm text-gray-600">Total Visits</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-chs-water-blue">0</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-chs-bright-green">0</p>
                <p className="text-sm text-gray-600">Demos Scheduled</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
