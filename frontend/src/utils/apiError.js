/**
 * One place that turns any Axios/network failure into a predictable,
 * UI-safe shape: { type, message, status, retryable }.
 *
 * Consumes the Phase 2 backend error contract
 * ({ status, error, message }) but never trusts it blindly — 5xx and network
 * failures always get a generic message so no internal detail leaks, while
 * 4xx responses may surface the backend's already-safe `message`.
 */

export const ErrorTypes = Object.freeze({
  NETWORK: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
})

const GENERIC = {
  [ErrorTypes.NETWORK]: "We couldn't reach the server. Check your connection and try again.",
  [ErrorTypes.UNAUTHORIZED]: 'Your session has expired. Please sign in again.',
  [ErrorTypes.FORBIDDEN]: "You don't have permission to view this.",
  [ErrorTypes.NOT_FOUND]: 'The item you are looking for could not be found.',
  [ErrorTypes.VALIDATION]: 'Some of the information provided was invalid.',
  [ErrorTypes.CONFLICT]: 'This action conflicts with existing data.',
  [ErrorTypes.SERVER]: 'Something went wrong on our side. Please try again shortly.',
  [ErrorTypes.UNKNOWN]: 'Something went wrong. Please try again.',
}

/** Only network blips and server faults are safe to auto-offer a retry for. */
const RETRYABLE = new Set([ErrorTypes.NETWORK, ErrorTypes.SERVER])

function typeForStatus(status) {
  if (status === 401) return ErrorTypes.UNAUTHORIZED
  if (status === 403) return ErrorTypes.FORBIDDEN
  if (status === 404) return ErrorTypes.NOT_FOUND
  if (status === 409) return ErrorTypes.CONFLICT
  if (status === 400 || status === 422) return ErrorTypes.VALIDATION
  if (status >= 500) return ErrorTypes.SERVER
  return ErrorTypes.UNKNOWN
}

export function classifyError(err) {
  // No response object → request never completed (offline, DNS, CORS, timeout).
  if (!err || !err.response) {
    return {
      type: ErrorTypes.NETWORK,
      status: 0,
      message: GENERIC[ErrorTypes.NETWORK],
      retryable: true,
    }
  }

  const status = err.response.status
  const type = typeForStatus(status)
  const backendMessage = err.response.data?.message

  // Trust the backend's message only for client-side (4xx) errors, where
  // Phase 2 guarantees it is user-safe. For 5xx, always stay generic.
  const message =
    status < 500 && typeof backendMessage === 'string' && backendMessage.trim()
      ? backendMessage
      : GENERIC[type]

  return { type, status, message, retryable: RETRYABLE.has(type) }
}
