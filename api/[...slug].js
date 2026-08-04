const UPSTREAM = 'https://yanphayuporfolio.42web.io'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export default async function handler(req) {
  const slug = Array.isArray(req.query.slug) ? req.query.slug.join('/') : String(req.query.slug || '')
  const url = UPSTREAM + '/api/' + slug
  const headers = {
    'User-Agent': UA,
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://yanphayuv3.vercel.app/',
  }
  if (req.method === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
    const text = await res.text()
    return {
      statusCode: res.status,
      headers: { ...cors(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' },
      body: text,
    }
  } catch (e) {
    return {
      statusCode: 502,
      headers: cors(),
      body: JSON.stringify({ ok: false, error: String((e && e.message) || e) }),
    }
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
