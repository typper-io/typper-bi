import axios, { AxiosError } from 'axios'
import { signOut } from 'next-auth/react'

export const api = axios.create({
  baseURL: '/backend',
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
