import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, FolderPlus, ChevronRight, ChevronDown, Folder, Film, Copy, Check, ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getGuestSession } from '../lib/guest'
import { extractLoomId, getLoomThumbnail } from '../lib/loom'
import type { Project, Folder as FolderType, Loom } from '../lib/types'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

interface FolderNode extends FolderType {
  children: FolderNode[]
  looms: Loom[]
}

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const guest = projectId ? getGuestSession(projectId) : null
  const isAuthenticated = !!user || !!guest

  const [project, setProject] = useState<Project | null>(null)
  const [tree, setTree] = useState<FolderNode[]>([])
  const [rootLooms, setRootLooms] = useState<Loom[]>([])
  const [loading, setLoading] = useState(true)
  const [notAllowed, setNotAllowed] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copiedLink, setCopiedLink] = useState(false)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)

  const [showAddLoom, setShowAddLoom] = useState(false)
  const [loomUrl, setLoomUrl] = useState('')
  const [loomTitle, setLoomTitle] = useState('')
  const [loomDesc, setLoomDesc] = useState('')
  const [loomFolder, setLoomFolder] = useState<string | null>(null)
  const [addingLoom, setAddingLoom] = useState(false)
  const [loomError, setLoomError] = useState('')

  useEffect(() => {
    if (!projectId) return
    if (authLoading) return
    if (!isAuthenticated) { navigate('/login'); return }
    loadProject()
  }, [projectId, isAuthenticated, authLoading])

  async function loadProject() {
    if (!projectId) return
    const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single()
    if (!proj) { setNotAllowed(true); setLoading(false); return }

    if (user) {
      const { data: member } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()
      if (!member && proj.owner_id !== user.id) { setNotAllowed(true); setLoading(false); return }
    }

    setProject(proj as Project)
    await loadFoldersAndLooms(projectId)
    setLoading(false)
  }

  async function loadFoldersAndLooms(pid: string) {
    const [{ data: folders }, { data: looms }] = await Promise.all([
      supabase.from('folders').select('*').eq('project_id', pid).order('order_index'),
      supabase.from('looms').select('*').eq('project_id', pid).order('created_at', { ascending: false }),
    ])

    const folderList = (folders ?? []) as FolderType[]
    const loomList = (looms ?? []) as Loom[]

    const map = new Map<string, FolderNode>()
    folderList.forEach(f => map.set(f.id, { ...f, children: [], looms: [] }))
    loomList.forEach(l => {
      if (l.folder_id && map.has(l.folder_id)) map.get(l.folder_id)!.looms.push(l)
    })

    const roots: FolderNode[] = []
    folderList.forEach(f => {
      const node = map.get(f.id)!
      if (f.parent_folder_id && map.has(f.parent_folder_id)) map.get(f.parent_folder_id)!.children.push(node)
      else roots.push(node)
    })

    setTree(roots)
    setRootLooms(loomList.filter(l => !l.folder_id))
    setExpanded(new Set(folderList.map(f => f.id)))
  }

  async function deleteLoom(loomId: string) {
    await supabase.from('looms').delete().eq('id', loomId)
    if (projectId) await loadFoldersAndLooms(projectId)
  }

  function canDeleteLoom(loom: Loom) {
    if (!user) return false
    return loom.uploaded_by_id === user.id || project?.owner_id === user.id
  }

  async function createFolder() {
    if (!newFolderName.trim() || !projectId) return
    setCreatingFolder(true)
    await supabase.from('folders').insert({
      project_id: projectId,
      parent_folder_id: newFolderParent,
      name: newFolderName.trim(),
      order_index: 0,
    })
    setCreatingFolder(false)
    setShowNewFolder(false)
    setNewFolderName('')
    setNewFolderParent(null)
    await loadFoldersAndLooms(projectId)
  }

  async function addLoom() {
    if (!loomTitle.trim() || !loomUrl.trim() || !projectId) return
    const loomId = extractLoomId(loomUrl)
    if (!loomId) { setLoomError('Invalid Loom URL. Please paste a valid loom.com share link.'); return }
    setAddingLoom(true)
    await supabase.from('looms').insert({
      project_id: projectId,
      folder_id: loomFolder,
      loom_url: loomUrl.trim(),
      loom_embed_id: loomId,
      title: loomTitle.trim(),
      description: loomDesc.trim() || null,
      uploaded_by_id: user?.id ?? null,
      uploaded_by_guest_name: guest?.guest_name ?? null,
    })
    setAddingLoom(false)
    setShowAddLoom(false)
    setLoomUrl('')
    setLoomTitle('')
    setLoomDesc('')
    setLoomFolder(null)
    setLoomError('')
    await loadFoldersAndLooms(projectId)
  }

  function copyInviteLink() {
    if (!project) return
    navigator.clipboard.writeText(`${window.location.origin}/join/${project.invite_hash}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function flatFolders(nodes: FolderNode[], depth = 0): { id: string; label: string }[] {
    return nodes.flatMap(n => [
      { id: n.id, label: '  '.repeat(depth) + n.name },
      ...flatFolders(n.children, depth + 1),
    ])
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  )

  if (notAllowed) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="text-lg font-semibold text-surface-900">Access denied</p>
      <p className="text-sm text-surface-500">You don't have access to this project.</p>
      {user && <Button variant="outline" onClick={() => navigate('/dashboard')}><ArrowLeft size={14} /> Dashboard</Button>}
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Folder sidebar */}
      <aside className="w-60 shrink-0 border-r border-surface-200 bg-surface-50 overflow-y-auto">
        <div className="p-4">
          <button onClick={() => navigate('/dashboard')} className="mb-4 flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-700 transition-colors">
            <ArrowLeft size={12} /> All projects
          </button>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Folders</p>
            <button
              onClick={() => { setNewFolderParent(null); setShowNewFolder(true) }}
              className="rounded p-0.5 text-surface-400 hover:bg-surface-200 hover:text-surface-700 transition-colors"
              title="New folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-0.5">
            <FolderTree
              nodes={tree}
              expanded={expanded}
              onToggle={id => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })}
              onAddSubfolder={id => { setNewFolderParent(id); setShowNewFolder(true) }}
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-surface-900">{project?.name}</h1>
              {project?.description && <p className="mt-0.5 text-sm text-surface-500">{project.description}</p>}
              {guest && (
                <Badge variant="orange" className="mt-2">
                  Viewing as guest: {guest.guest_name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs text-surface-600 hover:bg-surface-50 transition-colors"
              >
                {copiedLink ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copiedLink ? 'Copied!' : 'Invite link'}
              </button>
              <Button size="sm" onClick={() => { setLoomFolder(null); setShowAddLoom(true) }}>
                <Plus size={14} /> Add Loom
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-8">
            {rootLooms.length > 0 && (
              <LoomGrid
                looms={rootLooms}
                onOpen={id => navigate(`/p/${projectId}/loom/${id}`)}
                onDelete={deleteLoom}
                canDelete={canDeleteLoom}
              />
            )}
            {tree.map(node => (
              <FolderSection
                key={node.id}
                node={node}
                projectId={projectId!}
                onAddLoom={folderId => { setLoomFolder(folderId); setShowAddLoom(true) }}
                onAddSubfolder={folderId => { setNewFolderParent(folderId); setShowNewFolder(true) }}
                onOpenLoom={loomId => navigate(`/p/${projectId}/loom/${loomId}`)}
                onDeleteLoom={deleteLoom}
                canDeleteLoom={canDeleteLoom}
              />
            ))}
          </div>
        </div>
      </div>

      {/* New folder modal */}
      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} title="New Folder">
        <div className="flex flex-col gap-4">
          <Input
            label="Folder name"
            placeholder="e.g. Python Scripts"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createFolder()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={createFolder} loading={creatingFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add loom modal */}
      <Modal open={showAddLoom} onClose={() => { setShowAddLoom(false); setLoomError('') }} title="Add Loom Video">
        <div className="flex flex-col gap-4">
          <Input
            label="Loom URL"
            placeholder="https://www.loom.com/share/..."
            value={loomUrl}
            onChange={e => { setLoomUrl(e.target.value); setLoomError('') }}
            error={loomError}
          />
          <Input
            label="Title"
            placeholder="Brief description of this recording"
            value={loomTitle}
            onChange={e => setLoomTitle(e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="Additional context"
            value={loomDesc}
            onChange={e => setLoomDesc(e.target.value)}
          />
          {flatFolders(tree).length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-surface-800">Folder (optional)</label>
              <select
                value={loomFolder ?? ''}
                onChange={e => setLoomFolder(e.target.value || null)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">No folder (root)</option>
                {flatFolders(tree).map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowAddLoom(false); setLoomError('') }}>Cancel</Button>
            <Button onClick={addLoom} loading={addingLoom} disabled={!loomTitle.trim() || !loomUrl.trim()}>
              Add Video
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function FolderTree({
  nodes, expanded, onToggle, onAddSubfolder,
}: {
  nodes: FolderNode[]
  expanded: Set<string>
  onToggle: (id: string) => void
  onAddSubfolder: (id: string) => void
}) {
  return (
    <>
      {nodes.map(node => (
        <div key={node.id}>
          <div className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer">
            <button onClick={() => onToggle(node.id)} className="flex items-center gap-1 flex-1 min-w-0">
              {expanded.has(node.id) ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
              <Folder size={13} className="shrink-0 text-brand-500" />
              <span className="truncate">{node.name}</span>
            </button>
            <button
              onClick={() => onAddSubfolder(node.id)}
              className="hidden group-hover:flex shrink-0 rounded p-0.5 text-surface-400 hover:text-brand-600 transition-colors"
            >
              <Plus size={11} />
            </button>
          </div>
          {expanded.has(node.id) && node.children.length > 0 && (
            <div className="ml-3 border-l border-surface-200 pl-2">
              <FolderTree nodes={node.children} expanded={expanded} onToggle={onToggle} onAddSubfolder={onAddSubfolder} />
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function FolderSection({
  node, projectId, onAddLoom, onAddSubfolder, onOpenLoom, onDeleteLoom, canDeleteLoom,
}: {
  node: FolderNode
  projectId: string
  onAddLoom: (folderId: string) => void
  onAddSubfolder: (folderId: string) => void
  onOpenLoom: (loomId: string) => void
  onDeleteLoom: (loomId: string) => void
  canDeleteLoom: (loom: Loom) => boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-surface-200 pb-2">
        <div className="flex items-center gap-2">
          <Folder size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-surface-800">{node.name}</h2>
          {node.looms.length > 0 && (
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-500">{node.looms.length}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onAddSubfolder(node.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 transition-colors">
            <FolderPlus size={12} /> Subfolder
          </button>
          <button onClick={() => onAddLoom(node.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 transition-colors">
            <Plus size={12} /> Add Loom
          </button>
        </div>
      </div>

      {node.looms.length > 0 && (
        <div className="mt-3">
          <LoomGrid looms={node.looms} onOpen={onOpenLoom} onDelete={onDeleteLoom} canDelete={canDeleteLoom} />
        </div>
      )}

      {node.children.map(child => (
        <div key={child.id} className="mt-6 ml-4 border-l-2 border-surface-100 pl-4">
          <FolderSection node={child} projectId={projectId} onAddLoom={onAddLoom} onAddSubfolder={onAddSubfolder} onOpenLoom={onOpenLoom} onDeleteLoom={onDeleteLoom} canDeleteLoom={canDeleteLoom} />
        </div>
      ))}
    </div>
  )
}

function LoomGrid({
  looms, onOpen, onDelete, canDelete,
}: {
  looms: Loom[]
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  canDelete: (loom: Loom) => boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {looms.map(loom => (
        <LoomCard
          key={loom.id}
          loom={loom}
          onOpen={() => onOpen(loom.id)}
          onDelete={() => onDelete(loom.id)}
          canDelete={canDelete(loom)}
        />
      ))}
    </div>
  )
}

function LoomCard({
  loom, onOpen, onDelete, canDelete,
}: {
  loom: Loom
  onOpen: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirming) {
      onDelete()
    } else {
      setConfirming(true)
    }
  }

  function cancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
  }

  return (
    <div className="group relative rounded-xl border border-surface-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail / fallback */}
      <div className="relative aspect-video bg-surface-100 overflow-hidden cursor-pointer" onClick={onOpen}>
        {!thumbFailed ? (
          <img
            src={getLoomThumbnail(loom.loom_embed_id)}
            alt={loom.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-950 to-brand-800 px-4">
            <Film size={22} className="text-brand-400 shrink-0" />
            <p className="text-center text-sm font-semibold text-white line-clamp-3 leading-snug">{loom.title}</p>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow">
            <Film size={18} className="text-brand-600" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 cursor-pointer" onClick={onOpen}>
        <p className="text-sm font-medium text-surface-900 line-clamp-1">{loom.title}</p>
        {loom.description && <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{loom.description}</p>}
        <p className="mt-1.5 text-xs text-surface-400">
          by {loom.uploaded_by_guest_name ?? 'Unknown'} · {new Date(loom.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Delete button */}
      {canDelete && (
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          {confirming ? (
            <div className="flex items-center gap-1 rounded-lg bg-white/95 shadow px-2 py-1 border border-red-200">
              <span className="text-xs text-red-600 font-medium">Delete?</span>
              <button onClick={handleDelete} className="rounded px-1.5 py-0.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">Yes</button>
              <button onClick={cancelDelete} className="rounded px-1.5 py-0.5 text-xs text-surface-600 hover:bg-surface-100 transition-colors">No</button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow text-surface-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
              title="Delete video"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
