import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, CornerDownRight, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getGuestSession } from '../lib/guest'
import { getLoomEmbedUrl } from '../lib/loom'
import type { Loom, Comment } from '../lib/types'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

export default function LoomView() {
  const { projectId, loomId } = useParams<{ projectId: string; loomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const guest = projectId ? getGuestSession(projectId) : null

  const [loom, setLoom] = useState<Loom | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [posting, setPosting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!loomId) return
    loadData()
  }, [loomId])

  async function loadData() {
    const [{ data: loomData }, { data: commentData }] = await Promise.all([
      supabase.from('looms').select('*').eq('id', loomId!).single(),
      supabase
        .from('comments')
        .select('*')
        .eq('loom_id', loomId!)
        .is('parent_comment_id', null)
        .order('created_at'),
    ])
    setLoom(loomData as Loom)

    const topLevel = (commentData ?? []) as Comment[]
    const withReplies = await Promise.all(
      topLevel.map(async c => {
        const { data: replies } = await supabase
          .from('comments')
          .select('*')
          .eq('parent_comment_id', c.id)
          .order('created_at')
        return { ...c, replies: (replies ?? []) as Comment[] }
      })
    )
    setComments(withReplies)
    setLoading(false)
  }

  async function postComment() {
    if (!newComment.trim() || !loomId) return
    setPosting(true)
    await supabase.from('comments').insert({
      loom_id: loomId,
      user_id: user?.id ?? null,
      guest_name: !user ? (guest?.guest_name ?? 'Guest') : null,
      guest_session_token: !user ? (guest?.session_token ?? null) : null,
      content: newComment.trim(),
      parent_comment_id: replyTo?.id ?? null,
    })
    setNewComment('')
    setReplyTo(null)
    setPosting(false)
    await loadData()
  }

  const authorLabel = user
    ? (user.display_name ?? user.email)
    : guest?.guest_name ?? 'Guest'

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  )

  if (!loom) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="text-lg font-semibold text-surface-900">Video not found</p>
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Go back</Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <button
        onClick={() => navigate(`/p/${projectId}`)}
        className="mb-6 flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors"
      >
        <ArrowLeft size={14} /> Back to project
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Video */}
        <div className="lg:col-span-3">
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-surface-200 bg-surface-900 shadow-sm">
            <iframe
              src={getLoomEmbedUrl(loom.loom_embed_id)}
              className="h-full w-full"
              allowFullScreen
              allow="autoplay; fullscreen"
              title={loom.title}
            />
          </div>
          <div className="mt-4">
            <h1 className="text-lg font-semibold text-surface-900">{loom.title}</h1>
            {loom.description && <p className="mt-1 text-sm text-surface-500">{loom.description}</p>}
            <p className="mt-2 text-xs text-surface-400">
              Added by {loom.uploaded_by_guest_name ?? 'Unknown'} · {new Date(loom.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="flex flex-col lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-surface-200 pb-3">
            <MessageSquare size={15} className="text-surface-400" />
            <span className="text-sm font-semibold text-surface-800">Comments</span>
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-500">
              {comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)}
            </span>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto py-4" style={{ maxHeight: '50vh' }}>
            {comments.length === 0 && (
              <p className="py-8 text-center text-sm text-surface-400">No comments yet. Be the first!</p>
            )}
            {comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={() => { setReplyTo(c); textareaRef.current?.focus() }}
              />
            ))}
          </div>

          {/* Input */}
          <div className="mt-auto border-t border-surface-200 pt-4">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
                <span className="text-xs text-brand-700">
                  Replying to <strong>{replyTo.guest_name ?? 'user'}</strong>
                </span>
                <button onClick={() => setReplyTo(null)} className="text-xs text-brand-500 hover:text-brand-700">cancel</button>
              </div>
            )}
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {authorLabel[0].toUpperCase()}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-surface-700">{authorLabel}</span>
                  {guest && !user && <Badge variant="orange">guest</Badge>}
                </div>
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment() }}
                  className="w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-surface-300"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-400">Ctrl+Enter to post</span>
                  <Button size="sm" onClick={postComment} loading={posting} disabled={!newComment.trim()}>
                    <Send size={13} /> Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  const authorName = comment.guest_name ?? 'User'
  const initial = authorName[0].toUpperCase()

  return (
    <div>
      <div className="flex gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-200 text-xs font-semibold text-surface-600">
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-surface-800">{authorName}</span>
            {comment.guest_name && <Badge variant="orange">guest</Badge>}
            <span className="text-xs text-surface-400">{new Date(comment.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-sm text-surface-700 whitespace-pre-wrap">{comment.content}</p>
          <button
            onClick={onReply}
            className="mt-1 flex items-center gap-1 text-xs text-surface-400 hover:text-brand-600 transition-colors"
          >
            <CornerDownRight size={11} /> Reply
          </button>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 mt-3 flex flex-col gap-3 border-l-2 border-surface-100 pl-3">
          {comment.replies.map(r => (
            <div key={r.id} className="flex gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-200 text-xs font-semibold text-surface-600">
                {(r.guest_name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-surface-800">{r.guest_name ?? 'User'}</span>
                  {r.guest_name && <Badge variant="orange">guest</Badge>}
                  <span className="text-xs text-surface-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-surface-700 whitespace-pre-wrap">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
