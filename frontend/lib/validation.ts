const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim())
}

export const emailFormatMessage = "Please enter a valid email address, for example name@example.com."

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function isValidPassword(value: string) {
  return passwordPattern.test(value)
}

export const passwordPolicyMessage =
  "Password must be at least 8 characters and include at least one letter and one number."
