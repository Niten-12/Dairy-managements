import axiosInstance from './axiosInstance'

export const login = (credentials) => axiosInstance.post('/auth/login', credentials)
export const register = (data) => axiosInstance.post('/auth/register', data)

// OTP Login
export const sendOtp    = (phone)               => axiosInstance.post('/auth/otp/send',   { phone })
export const verifyOtp  = (phone, code, rememberMe) =>
  axiosInstance.post('/auth/otp/verify', { phone, code, rememberMe })

export const REMEMBER_ME_KEY  = 'dairy_remember_me'
export const TOKEN_EXPIRY_KEY = 'dairy_token_expiry'
