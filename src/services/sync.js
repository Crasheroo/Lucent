import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

const SKIP_KEYS = new Set(['user', 'syncing'])

const isValidId    = (v) => typeof v === 'string' && v.length > 0
const isValidNum   = (v) => typeof v === 'number' && isFinite(v) && v >= 0
const isValidDate  = (v) => typeof v === 'string' && !isNaN(new Date(v).getTime())
const isValidStr   = (v) => typeof v === 'string'

function filterExpenses(arr) {
  if (!Array.isArray(arr)) return []
  return arr.filter((e) =>
    e && typeof e === 'object' &&
    isValidId(e.id) &&
    isValidNum(e.amount) &&
    isValidDate(e.date) &&
    isValidStr(e.category)
  )
}

function filterRecurring(arr) {
  if (!Array.isArray(arr)) return []
  return arr.filter((r) =>
    r && typeof r === 'object' &&
    isValidId(r.id) &&
    isValidNum(r.amount) &&
    isValidStr(r.name)
  )
}

function filterGoals(arr) {
  if (!Array.isArray(arr)) return []
  return arr.filter((g) =>
    g && typeof g === 'object' &&
    isValidId(g.id) &&
    isValidNum(g.targetAmount) &&
    isValidStr(g.name)
  )
}

function filterCustomCategories(arr) {
  if (!Array.isArray(arr)) return []
  return arr.filter((c) =>
    c && typeof c === 'object' &&
    isValidId(c.id) &&
    isValidStr(c.label)
  )
}

export function validateCloudData(data) {
  if (!data || typeof data !== 'object') return {}
  return {
    profile:          (data.profile && typeof data.profile === 'object') ? data.profile : undefined,
    expenses:         filterExpenses(data.expenses),
    incomes:          Array.isArray(data.incomes) ? data.incomes : [],
    recurring:        filterRecurring(data.recurring),
    goals:            filterGoals(data.goals),
    monthlySalaries:  Array.isArray(data.monthlySalaries) ? data.monthlySalaries : [],
    categoryBudgets:  (data.categoryBudgets && typeof data.categoryBudgets === 'object') ? data.categoryBudgets : {},
    customCategories: filterCustomCategories(data.customCategories),
    settings:         (data.settings && typeof data.settings === 'object') ? data.settings : undefined,
  }
}

export function extractSyncData(state) {
  const result = {}
  for (const [key, value] of Object.entries(state)) {
    if (!SKIP_KEYS.has(key) && typeof value !== 'function') {
      result[key] = value
    }
  }
  return result
}

export async function downloadUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function uploadUserData(uid, data) {
  await setDoc(doc(db, 'users', uid), data)
}
