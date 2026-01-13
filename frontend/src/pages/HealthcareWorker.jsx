import { useState } from 'react'
import { api } from '../utils/api'
import { Search, User, Calendar, Activity, AlertCircle, FileText } from 'lucide-react'

export default function HealthcareWorker() {
  const [nationalId, setNationalId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [patientData, setPatientData] = useState(null)

  // Helper to safely parse JSON strings or return original if not string/JSON
  const parseJsonField = (field) => {
    if (!field) return null
    if (typeof field === 'object') return field
    try {
      return JSON.parse(field)
    } catch (e) {
      return field
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!nationalId.trim()) return

    setLoading(true)
    setError(null)
    setPatientData(null)

    const errorMessages = {
      'patient_not_found_in_registry': 'We couldn\'t find a patient with that National ID in the registry.',
      'no_valid_consent_found': 'No active consent record was found for this patient at your facility.',
      'consent_not_active': 'The patient\'s consent for this facility is currently inactive or has expired.',
      'not_found': 'The requested record could not be found.',
      'unauthorized': 'You are not authorized to perform this search.',
      'database_transaction_failed': 'A temporary system error occurred. Please try again in a few moments.'
    }

    try {
      const res = await api(`/api/consents/check?national_id=${encodeURIComponent(nationalId)}`)
      const data = await res.json()

      if (!res.ok) {
        const message = data.message || 'search_failed'
        throw new Error(errorMessages[message] || errorMessages[data.error] || 'An unexpected error occurred while searching.')
      }

      if (data.success && data.data) {
        const rawData = data.data
        // Parse nested JSON fields
        const processedData = {
          ...rawData,
          address: parseJsonField(rawData.address),
          emergency_contact: parseJsonField(rawData.emergency_contact)
        }
        setPatientData(processedData)
      } else {
        throw new Error('Could not retrieve patient data. Please verify the ID and try again.')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to search for patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient Lookup</h1>
        <p className="text-slate-500">Search for patients by National ID to view their records.</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="national-id" className="sr-only">National ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="national-id"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                placeholder="Enter Patient National ID"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors flex items-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {patientData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border-b border-gray-100 bg-gray-50/50 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-xl">
                {patientData.first_name ? patientData.first_name[0] : 'P'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {patientData.first_name} {patientData.last_name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">ID: {patientData.patient_id}</span>
                  <span>•</span>
                  <span>National ID: {patientData.national_id || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-yellow-600" />
                Personal Information
              </h3>
              <dl className="grid grid-cols-[120px,1fr] gap-2 text-sm">
                <dt className="text-slate-500">Email:</dt>
                <dd className="font-medium text-slate-900">{patientData.user?.email || 'N/A'}</dd>

                <dt className="text-slate-500">Phone:</dt>
                <dd className="font-medium text-slate-900">{patientData.phone || 'N/A'}</dd>

                <dt className="text-slate-500">DOB:</dt>
                <dd className="font-medium text-slate-900">{patientData.date_of_birth ? new Date(patientData.date_of_birth).toLocaleDateString() : 'N/A'}</dd>

                <dt className="text-slate-500">Gender:</dt>
                <dd className="font-medium text-slate-900 capitalize">{patientData.gender || 'N/A'}</dd>

                <dt className="text-slate-500">Address:</dt>
                <dd className="font-medium text-slate-900">
                  {typeof patientData.address === 'object' && patientData.address !== null ? (
                    <div className="flex flex-col">
                      <span>{patientData.address.county}, {patientData.address.sub_county}</span>
                      <span className="text-slate-500 text-xs">Ward: {patientData.address.ward}</span>
                    </div>
                  ) : (
                    patientData.address || 'N/A'
                  )}
                </dd>

                <dt className="text-slate-500">Emergency:</dt>
                <dd className="font-medium text-slate-900">
                  {typeof patientData.emergency_contact === 'object' && patientData.emergency_contact !== null ? (
                    <div className="flex flex-col">
                      <span>{patientData.emergency_contact.name} ({patientData.emergency_contact.relationship})</span>
                      <a href={`tel:${patientData.emergency_contact.phone}`} className="text-yellow-600 hover:underline">{patientData.emergency_contact.phone}</a>
                    </div>
                  ) : (
                    patientData.emergency_contact || 'N/A'
                  )}
                </dd>
              </dl>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-600" />
                Medical Data
              </h3>
              {/* Assuming patientData might have some medical info or we just show what we have */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">

                {/* This would be populated with actual medical records if available in the response */}
                <p className="italic">Access to medical records granted. <br /> Use specific modules to view details.</p>
              </div>

              {/* Example of data if available */}
              {patientData.medical_history && (
                <div className="mt-2 text-sm">
                  <strong>History:</strong> {patientData.medical_history}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
