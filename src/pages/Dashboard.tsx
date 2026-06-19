import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Users, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Project } from '../lib/types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchProjects()
  }, [user])

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects((data as Project[]) ?? [])
    setLoading(false)
  }

  async function createProject() {
    if (!newName.trim()) return
    setCreating(true)
    const hash = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    const { data } = await supabase
      .from('projects')
      .insert({ name: newName.trim(), description: newDesc.trim() || null, owner_id: user!.id, invite_hash: hash })
      .select()
      .single()
    setCreating(false)
    setShowCreate(false)
    setNewName('')
    setNewDesc('')
    if (data) navigate(`/p/${data.id}`)
  }

  function copyInviteLink(project: Project) {
    const url = `${window.location.origin}/join/${project.invite_hash}`
    navigator.clipboard.writeText(url)
    setCopiedId(project.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Projects</h1>
          <p className="mt-0.5 text-sm text-surface-500">Your workspaces and shared projects</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Project
        </Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 py-16 text-center">
            <FolderOpen size={40} className="text-surface-300" />
            <p className="mt-3 text-base font-medium text-surface-600">No projects yet</p>
            <p className="mt-1 text-sm text-surface-400">Create your first project to get started</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/p/${p.id}`)}
                >
                  <h2 className="font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="mt-1 text-sm text-surface-500 line-clamp-2">{p.description}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-3">
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <Users size={12} />
                    {p.owner_id === user?.id ? 'Owner' : 'Member'}
                  </div>
                  <button
                    onClick={() => copyInviteLink(p)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                    title="Copy invite link"
                  >
                    {copiedId === p.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    {copiedId === p.id ? 'Copied!' : 'Invite link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="flex flex-col gap-4">
          <Input
            label="Project name"
            placeholder="e.g. Automation Backend"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of the project"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createProject} loading={creating} disabled={!newName.trim()}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
