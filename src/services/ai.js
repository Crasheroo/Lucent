// Gemini API — darmowy tier (15 req/min)
// Klucz: https://aistudio.google.com/apikey
const GEMINI_MODEL = 'gemini-2.0-flash'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

function getApiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`
}

async function fetchGemini(parts, systemPrompt = '') {
  if (!API_KEY) throw new Error('Brak klucza API. Dodaj VITE_GEMINI_API_KEY do pliku .env.local')

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
  }

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  const response = await fetch(getApiUrl(GEMINI_MODEL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API Error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// Konwertuje format wiadomości (user/assistant) na format Gemini (user/model)
function convertMessages(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

export async function callClaude(messages, systemPrompt = '') {
  // Gemini wymaga żeby pierwsza i ostatnia wiadomość była od usera
  // i żeby role się naprzemiennie zmieniały
  const geminiMessages = convertMessages(messages)

  const body = {
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
  }

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  const response = await fetch(getApiUrl(GEMINI_MODEL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API Error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function analyzeReceipt(base64Image, mimeType = 'image/jpeg') {
  const text = await fetchGemini([
    {
      inlineData: { mimeType, data: base64Image },
    },
    {
      text: 'Przeanalizuj ten paragon i zwróć TYLKO JSON (bez markdown, bez komentarzy): {"store":"nazwa sklepu","total":liczba,"date":"YYYY-MM-DD lub null","category":"food|transport|entertainment|health|shopping|restaurants|utilities|subscriptions|fitness|education|travel|other","items":[{"name":"nazwa","price":liczba}]}',
    },
  ])

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export function buildFinancialContext(store) {
  const { profile, expenses, recurring, getCurrentMonthExpenses, getMonthlyRecurringTotal } = store
  const monthExpenses = getCurrentMonthExpenses()
  const recurringTotal = getMonthlyRecurringTotal()
  const expensesTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = {}
  monthExpenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  })

  const last3Months = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const m = d.getMonth(), y = d.getFullYear()
    const total = expenses
      .filter((e) => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y })
      .reduce((s, e) => s + e.amount, 0)
    last3Months.push({ month: d.toLocaleDateString('pl-PL', { month: 'long' }), total })
  }

  return `Dane finansowe użytkownika:
- Wynagrodzenie netto: ${profile.salary} PLN/mies.
- Stałe wydatki miesięczne: ${recurringTotal.toFixed(2)} PLN
- Wydatki w tym miesiącu: ${expensesTotal.toFixed(2)} PLN
- Zostało do końca miesiąca: ${(profile.salary - recurringTotal - expensesTotal).toFixed(2)} PLN
- Wydatki wg kategorii (ten miesiąc): ${JSON.stringify(byCategory)}
- Ostatnie 3 miesiące: ${JSON.stringify(last3Months)}
- Stałe płatności aktywne: ${recurring.filter((r) => r.active).map((r) => `${r.name}: ${r.amount} PLN`).join(', ')}`
}
