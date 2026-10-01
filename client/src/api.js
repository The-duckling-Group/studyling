async function handle(res) {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`)
  return res.json()
}

export const api = {
  get: (url) => fetch(url).then(handle),
  post: (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }).then(handle),
  del: (url) => fetch(url, { method: 'DELETE' }).then(handle),
}
