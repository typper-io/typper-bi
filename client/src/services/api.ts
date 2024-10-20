import axios, { AxiosError } from 'axios'
import { signOut } from 'next-auth/react'

const baseURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/backend'
    : `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/backend`

export const api = axios.create({
  baseURL,
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
