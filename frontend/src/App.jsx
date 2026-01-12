import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Patient from './pages/Patient'
import Admin from './pages/Admin'
import HealthcareWorker from './pages/HealthcareWorker'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Auth routes */}
        <Route index element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* App sections (empty placeholders) */}
        <Route path="patient" element={<Patient />} />
        <Route path="admin" element={<Admin />} />
        <Route path="healthcare-worker" element={<HealthcareWorker />} />

        {/* 404 - catch all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App;

