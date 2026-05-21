const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim())
}

export const emailFormatMessage = "Please enter a valid email address, for example name@example.com."
