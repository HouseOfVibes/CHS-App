import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import LogVisit from './pages/LogVisit'
import ViewHomes from './pages/ViewHomes'
import ManageLocations from './pages/ManageLocations'
import MapView from './pages/MapView'
import ImportHomes from './pages/ImportHomes'

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App
