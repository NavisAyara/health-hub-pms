import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Patient from './pages/Patient'
import Admin from './pages/Admin'
import HealthcareWorker from './pages/HealthcareWorker'
import NotFound from './pages/NotFound'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Auth routes */}
        <Route index element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* App sections - Protected */}
        <Route element={<RequireAuth allowedRoles={['patient']} />}>
          <Route path="patient" element={<Patient />} />
        </Route>

        <Route element={<RequireAuth allowedRoles={['admin']} />}>
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route element={<RequireAuth allowedRoles={['healthcare_worker']} />}>
          <Route path="healthcare-worker" element={<HealthcareWorker />} />
        </Route>

        {/* 404 - catch all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App;

