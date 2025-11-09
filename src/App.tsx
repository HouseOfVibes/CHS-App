import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LogVisit from './pages/LogVisit'
import ViewHomes from './pages/ViewHomes'
import ManageLocations from './pages/ManageLocations'
import MapView from './pages/MapView'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log-visit" element={<LogVisit />} />
          <Route path="/view-homes" element={<ViewHomes />} />
          <Route path="/manage-locations" element={<ManageLocations />} />
          <Route path="/map-view" element={<MapView />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
