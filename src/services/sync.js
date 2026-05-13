import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

const SKIP_KEYS = new Set(['user', 'syncing'])

export function validateCloudData(data) {
  if (!data || typeof data !== 'object') return {}
  return {
    profile: (data.profile && typeof data.profile === 'object') ? data.profile : undefined,
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    incomes: Array.isArray(data.incomes) ? data.incomes : [],
    recurring: Array.isArray(data.recurring) ? data.recurring : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    monthlySalaries: Array.isArray(data.monthlySalaries) ? data.monthlySalaries : [],
    categoryBudgets: (data.categoryBudgets && typeof data.categoryBudgets === 'object') ? data.categoryBudgets : {},
    customCategories: Array.isArray(data.customCategories) ? data.customCategories : [],
    settings: (data.settings && typeof data.settings === 'object') ? data.settings : undefined,
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
