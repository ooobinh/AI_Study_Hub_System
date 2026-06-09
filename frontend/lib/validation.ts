const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim())
}

export function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

export const emailFormatMessage = "Please enter a valid email address, for example name@example.com."

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function isStrongPassword(value: string) {
  return passwordPattern.test(value)
}

export function isValidPassword(value: string) {
  return isStrongPassword(value)
}

export const passwordPolicyMessage =
  "Password must be at least 8 characters and include at least one letter and one number."
