import { API_BASE, DIFFICULTY_ONE } from './constants.js'

async function readJson(res) {
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export async function startMatch(difficulty = DIFFICULTY_ONE.id) {
  const res = await fetch(`${API_BASE}/matches/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty }),
  })
  return readJson(res)
}

export async function endMatch(id, payload) {
  const res = await fetch(`${API_BASE}/matches/${id}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJson(res)
}

/** 无开局 id 时一次性上报（后端会插入完整记录）。 */
export async function reportMatch(payload) {
  const res = await fetch(`${API_BASE}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJson(res)
}

export async function fetchTop(limit = 10) {
  const res = await fetch(`${API_BASE}/matches/top?limit=${limit}`)
  return readJson(res)
}

export async function submitResult(session) {
  const body = {
    survivedSec: session.elapsedSec,
    kills: session.kills,
    level: session.level,
    exp: session.exp,
    difficulty: session.difficulty,
  }
  if (session.matchId != null) {
    return endMatch(session.matchId, body)
  }
  return reportMatch(body)
}
