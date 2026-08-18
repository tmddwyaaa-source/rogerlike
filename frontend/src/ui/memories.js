/**
 * 本机回忆：最多 10 条对局记录（localStorage，Node 自测走内存）。
 */
const KEY = 'rogerlike.memories'
export const MEMORY_CAP = 10

const mem = { items: [] }

function readStore() {
  if (typeof localStorage === 'undefined') return mem.items
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeStore(items) {
  mem.items = items
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* ignore quota */
  }
}

export function loadMemories() {
  mem.items = readStore()
  return mem.items.slice()
}

export function saveMemory(entry) {
  const items = readStore()
  const rec = {
    id: Date.now(),
    at: Date.now(),
    win: Boolean(entry.win),
    timeText: entry.timeText || '00:00',
    survivedSec: entry.survivedSec ?? 0,
    level: entry.level ?? 1,
    exp: entry.exp ?? 0,
    expNeed: entry.expNeed ?? 0,
    hp: entry.hp ?? 0,
    hpMax: entry.hpMax ?? 3,
    charge: entry.charge ?? 0,
    chargeMax: entry.chargeMax ?? 0.75,
    charging: Boolean(entry.charging),
    charName: entry.charName || '游侠',
    kills: entry.kills ?? 0,
    upgrades: Array.isArray(entry.upgrades) ? entry.upgrades.slice() : [],
    difficulty: entry.difficulty ?? '1',
  }
  items.unshift(rec)
  writeStore(items.slice(0, MEMORY_CAP))
  return rec
}

/** 按第一次选到的顺序汇总；同一 id 记次数。 */
export function summarizePicked(upgrades) {
  const order = []
  const counts = new Map()
  for (const u of upgrades || []) {
    const id = u?.id
    if (!id) continue
    if (!counts.has(id)) {
      order.push(id)
      counts.set(id, 0)
    }
    counts.set(id, counts.get(id) + 1)
  }
  return order.map((id) => ({ id, count: counts.get(id) }))
}

export function getMemory(id) {
  return loadMemories().find((m) => m.id === id) ?? null
}
