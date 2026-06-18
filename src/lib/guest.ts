import type { GuestSession } from './types'

const GUEST_KEY = 'luminaria_guest'

export function getGuestSession(projectId: string): GuestSession | null {
  try {
    const raw = localStorage.getItem(`${GUEST_KEY}_${projectId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setGuestSession(session: GuestSession): void {
  localStorage.setItem(
    `${GUEST_KEY}_${session.project_id}`,
    JSON.stringify(session)
  )
}

export function clearGuestSession(projectId: string): void {
  localStorage.removeItem(`${GUEST_KEY}_${projectId}`)
}

export function generateGuestToken(): string {
  return crypto.randomUUID()
}
