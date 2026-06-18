import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ display_name: displayName.trim() }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-xl font-semibold text-surface-900">Settings</h1>
      <p className="mt-0.5 text-sm text-surface-500">Manage your account</p>

      <div className="mt-8 flex flex-col gap-6 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">Account</p>
        </div>
        <Input
          label="Display name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
        <div>
          <p className="text-sm font-medium text-surface-800">Email</p>
          <p className="mt-1 text-sm text-surface-500">{user?.email}</p>
        </div>
        <div className="flex items-center justify-between border-t border-surface-100 pt-4">
          <Button variant="danger" onClick={() => signOut()}>Sign Out</Button>
          <Button onClick={save} loading={saving}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
