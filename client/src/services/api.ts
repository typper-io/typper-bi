import axios, { AxiosError } from 'axios'
import { signOut } from 'next-auth/react'

const getBaseURL = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/backend'
  }

  const appDomain = process.env.APP_DOMAIN

  if (!appDomain) {
    return '/backend'
  }

  return `https://${appDomain}/backend`
}

export const api = axios.create({
  baseURL: getBaseURL(),
  transformRequest: axios.defaults.transformRequest,
  transformResponse: axios.defaults.transformResponse,
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 300,
})

api.interceptors.response.use(
  (response) => response,
  (
    error: AxiosError<{
      message: string
    }>
  ) => {
    if (error.response?.status === 401) {
      signOut()
      window.location.href = '/'
    }

    return Promise.reject(error)
  }
)
