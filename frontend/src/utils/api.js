const BASE_URL = 'http://127.0.0.1:5000'

/**
 * Helper to retrieve tokens from either localStorage or sessionStorage.
 * Returns an object with the tokens and the storage key ('local' or 'session')
 * so we know where to save them back after a refresh.
 */
function getAuthData() {
    const localAccess = localStorage.getItem('access_token')
    const sessionAccess = sessionStorage.getItem('access_token')

    if (localAccess) {
        return {
            access_token: localAccess,
            refresh_token: localStorage.getItem('refresh_token'),
            storageType: 'localStorage'
        }
    }

    if (sessionAccess) {
        return {
            access_token: sessionAccess,
            refresh_token: sessionStorage.getItem('refresh_token'),
            storageType: 'sessionStorage'
        }
    }

    return null
}

/**
 * Helper to clear all auth data from both storages.
 * Used when refresh fails or user logs out.
 */
function clearAuth() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    sessionStorage.removeItem('user')
}

/**
 * Flag to prevent multiple refresh calls simultaneously.
 */
let isRefreshing = false

/**
 * Queue of failed requests to retry after a successful refresh.
 */
let refreshSubscribers = []

/**
 * Add a callback to the queue to be executed when the token is refreshed.
 */
function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb)
}

/**
 * Execute all subscribers with the new token.
 */
function onRefreshed(token) {
    refreshSubscribers.map((cb) => cb(token))
    refreshSubscribers = []
}

/**
 * Custom fetch wrapper that handles authentication and token refreshing.
 * 
 * @param {string} endpoint - The API endpoint (e.g., '/users/profile')
 * @param {object} options - Fetch options (method, body, etc.)
 */
export async function api(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const authData = getAuthData()

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    // Attach access token if available
    if (authData?.access_token) {
        headers['Authorization'] = `Bearer ${authData.access_token}`
    }

    const config = {
        ...options,
        headers,
    }

    try {
        const response = await fetch(url, config)

        // specific check for 401 Unauthorized
        if (response.status === 401) {
            if (!authData) {
                // No auth data to begin with, so it's a genuine 401
                return response
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((newToken) => {
                        // Update the header with the new token
                        config.headers['Authorization'] = `Bearer ${newToken}`
                        resolve(fetch(url, config))
                    })
                })
            }

            // Start the refresh process
            isRefreshing = true

            try {
                const refreshResponse = await fetch(`${BASE_URL}/auth/token-refresh`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authData.refresh_token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!refreshResponse.ok) {
                    throw new Error('Refresh failed')
                }

                const refreshBody = await refreshResponse.json()
                const newAccessToken = refreshBody.access_token

                // If backend returns a new refresh token, we should update that too.
                // Assuming backend sends back 'access_token' at minimum.

                // Save new tokens to the correct storage
                const storage = authData.storageType === 'localStorage' ? localStorage : sessionStorage
                storage.setItem('access_token', newAccessToken)

                // Retry the original request with new token
                config.headers['Authorization'] = `Bearer ${newAccessToken}`

                // Notify any other queued requests
                onRefreshed(newAccessToken)

                return fetch(url, config)

            } catch (refreshErr) {
                // If refresh fails, clear auth and redirect
                clearAuth()
                window.location.href = '/' // Hard redirect to login
                return Promise.reject(refreshErr)
            } finally {
                isRefreshing = false
            }
        }

        return response
    } catch (error) {
        return Promise.reject(error)
    }
}
