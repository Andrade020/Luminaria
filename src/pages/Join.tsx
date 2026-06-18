import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { setGuestSession, generateGuestToken } from '../lib/guest'
import { useAuth } from '../hooks/useAuth'
import type { Project } from '../lib/types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Join() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hash) return
    supabase
      .from('projects')
      .select('id, name, description, invite_hash')
      .eq('invite_hash', hash)
      .single()
      .then(({ data }) => {
        if (data) setProject(data as Project)
        else setNotFound(true)
      })
  }, [hash])

  async function joinAsGuest() {
    if (!project) return
    if (!guestName.trim()) { setError('Please enter your name.'); return }
    setLoading(true)
    const token = generateGuestToken()
    setGuestSession({ project_id: project.id, guest_name: guestName.trim(), session_token: token })
    navigate(`/p/${project.id}`)
  }

  async function joinAsUser() {
    if (!project || !user) return
    await supabase.from('project_members').upsert({
      project_id: project.id,
      user_id: user.id,
      role: 'viewer',
    })
    navigate(`/p/${project.id}`)
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="text-center">
          <p className="text-2xl font-semibold text-surface-900">Invalid invite link</p>
          <p className="mt-2 text-surface-500">This link may have expired or doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <span className="text-xl font-bold text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">You're invited</h1>
          <p className="mt-1 text-surface-500">Join the project workspace</p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="mb-6 rounded-lg bg-surface-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Project</p>
            <p className="mt-0.5 text-base font-semibold text-surface-900">{project.name}</p>
            {project.description && (
              <p className="mt-1 text-sm text-surface-500">{project.description}</p>
            )}
          </div>

          {user ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-surface-600">
                Joining as <strong>{user.display_name ?? user.email}</strong>
              </p>
              <Button onClick={joinAsUser} className="w-full justify-center">
                Join Project
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-3 text-sm font-medium text-surface-700">Continue as guest</p>
                <Input
                  placeholder="Your name"
                  value={guestName}
                  onChange={e => { setGuestName(e.target.value); setError('') }}
                  error={error}
                  onKeyDown={e => e.key === 'Enter' && joinAsGuest()}
                />
              </div>
              <Button onClick={joinAsGuest} loading={loading} className="w-full justify-center">
                Enter as Guest
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-surface-400">or</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 justify-center" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="outline" className="flex-1 justify-center" onClick={() => navigate('/register')}>
                  Create Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
