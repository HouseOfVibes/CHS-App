import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LoadScript } from '@react-google-maps/api'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import LogVisit from './pages/LogVisit'
import ViewHomes from './pages/ViewHomes'
import ManageLocations from './pages/ManageLocations'
import MapView from './pages/MapView'
import ImportHomes from './pages/ImportHomes'

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function App() {
  return (
    <ErrorBoundary>
      <LoadScript googleMapsApiKey={googleMapsApiKey || ''} loadingElement={<div />}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log-visit" element={<LogVisit />} />
              <Route path="/view-homes" element={<ViewHomes />} />
              <Route path="/manage-locations" element={<ManageLocations />} />
              <Route path="/map-view" element={<MapView />} />
              <Route path="/import-homes" element={<ImportHomes />} />
            </Routes>
          </div>
        </Router>
      </LoadScript>
    </ErrorBoundary>
  )
}

export default App
