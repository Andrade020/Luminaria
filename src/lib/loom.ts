export function extractLoomId(url: string): string | null {
  const patterns = [
    /loom\.com\/share\/([a-zA-Z0-9]+)/,
    /loom\.com\/embed\/([a-zA-Z0-9]+)/,
    /loom\.com\/v\/([a-zA-Z0-9]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getLoomEmbedUrl(loomId: string): string {
  return `https://www.loom.com/embed/${loomId}?hide_owner=true&hide_share=true&hide_title=false&hideEmbedTopBar=false`
}

export function getLoomThumbnail(loomId: string): string {
  return `https://cdn.loom.com/sessions/thumbnails/${loomId}-with-play.gif`
}
