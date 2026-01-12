import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Plus, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import PatientConsents from '../components/PatientConsents'
import AccessLogList from '../components/AccessLogList'

export default function Patient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const [facilities, setFacilities] = useState([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)

  const [formData, setFormData] = useState({
    facility_name: '',
    consent_type: 'VIEW',
    purpose: 'Routine Checkup',
    expires_at: ''
  })

  // Get user from local storage
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  };
  const user = getUser();
  const userId = user?.user_id || user?.id;
  const patientId = user?.patient?.patient_id;

  useEffect(() => {
    // Fetch facilities
    setLoadingFacilities(true)
    api('/facilities')
      .then(res => res.json())
      .then(data => {
        setFacilities(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, facility_name: data[0].name }))
        }
      })
      .catch(err => console.error("Failed to fetch facilities", err))
      .finally(() => setLoadingFacilities(false))
  }, [])

  // Initialize expiry date to tomorrow by default for better UX
  useEffect(() => {
    if (isDialogOpen && !formData.expires_at) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 3)
      // Format to YYYY-MM-DD HH:mm:ss requires some manual work or string manipulation
      // For input type="datetime-local", we need YYYY-MM-DDThh:mm
      const iso = tomorrow.toISOString().slice(0, 16)
      setFormData(prev => ({ ...prev, expires_at: iso }))
    }
  }, [isDialogOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      if (!user) throw new Error('User not found in local storage')

      if (!patientId) throw new Error('Patient ID not found')

      // Check if facility is selected
      if (!formData.facility_name) throw new Error('Please select a facility')

      // Format date to "YYYY-MM-DD HH:mm:ss" if needed by backend, 
      // but let's assume standard ISO or the input format is acceptable.
      // The prompt example said "2026-01-15 13:00:00". 
      // Input datetime-local gives "2026-01-15T13:00". 
      const formattedDate = formData.expires_at.replace('T', ' ') + ':00'

      const payload = {
        facility_name: formData.facility_name,
        consent_type: formData.consent_type,
        expires_at: formattedDate,
        purpose: formData.purpose,
        patient_id: patientId
      }

      const res = await api('/api/consents', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'Failed to grant access')
      }

      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.message || 'An unexpected error occurred')
    }
  }

  const closeDialog = () => {
    if (status === 'loading') return
    setIsDialogOpen(false)
    setStatus('idle')
    setErrorMessage('')
    // Reset form defaults if needed, or keep them
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-yellow-800">Patient Dashboard</h1>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
        >
          <Plus size={18} />
          New Permission
        </button>
      </div>

      <p className="text-gray-700 mb-6">Welcome to your patient portal. Manage your health data access here.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Consents Section */}
        {patientId ? (
          <PatientConsents patientId={patientId} />
        ) : (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
            Patient profile not active.
          </div>
        )}

        {/* Access Logs Section */}
        {userId && <AccessLogList userId={userId} />}
      </div>

      {/* Dialog Overlay */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className={`px-6 py-4 flex justify-between items-center border-b border-gray-100 ${status === 'success' ? 'invisible' : ''}`}>
              <h2 className="text-lg font-semibold text-gray-800">Grant Data Access</h2>
              <button
                onClick={closeDialog}
                disabled={status === 'loading'}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in slide-in-from-bottom-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Success</h3>
                  <p className="text-gray-500">You can close this dialog now</p>

                  <button
                    onClick={closeDialog}
                    className="mt-6 text-sm text-gray-500 hover:text-gray-800 hover:underline"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === 'error' && (
                    <div className="bg-red-50 text-red-700 p-3 rounded flex gap-2 items-start text-sm">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Request Failed</p>
                        <p>{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                    {loadingFacilities ? (
                      <div className="text-sm text-gray-500">Loading facilities...</div>
                    ) : (
                      <select
                        name="facility_name"
                        value={formData.facility_name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                      >
                        <option value="">-- Select Facility --</option>
                        {facilities.map(f => (
                          <option key={f.id} value={f.name}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consent Type</label>
                      <select
                        name="consent_type"
                        value={formData.consent_type}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                      >
                        <option value="VIEW">VIEW</option>
                        <option value="EDIT">EDIT</option>
                        <option value="SHARE">SHARE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                      <input
                        type="datetime-local"
                        name="expires_at"
                        value={formData.expires_at}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder="e.g. Routine Checkup"
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeDialog}
                      disabled={status === 'loading'}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-25"
                    >
                      {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                      {status === 'loading' ? 'Granting...' : 'Grant Access'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
