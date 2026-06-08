import axiosInstance from './axiosInstance'

export const get2faStatus   = ()       => axiosInstance.get('/user/2fa/status')
export const setup2fa       = ()       => axiosInstance.post('/user/2fa/setup')
export const enable2fa      = (code)   => axiosInstance.post('/user/2fa/enable',  { code })
export const disable2fa     = (code)   => axiosInstance.post('/user/2fa/disable', { code })

export const verifyTwoFactorLogin = (tempToken, code, rememberMe) =>
  axiosInstance.post('/auth/2fa/verify', { tempToken, code }, {
    headers: { 'X-Remember-Me': String(rememberMe) },
  })
