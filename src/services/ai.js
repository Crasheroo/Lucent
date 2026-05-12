// Gemini API — darmowy tier (15 req/min, 1500/dzień)
// Klucz: https://aistudio.google.com/apikey
const GEMINI_MODEL = 'gemini-2.0-flash'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

function getApiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`
}

async function fetchGemini(contents, systemPrompt = '', retries = 2) {
  if (!API_KEY) throw new Error('Brak klucza Gemini API (VITE_GEMINI_API_KEY)')

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
  }
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // 429 = za dużo zapytań — poczekaj 3 sekundy i spróbuj ponownie
  if (response.status === 429 && retries > 0) {
    await new Promise((r) => setTimeout(r, 3000))
    return fetchGemini(contents, systemPrompt, retries - 1)
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Błąd API: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// Gemini wymaga naprzemiennych ról user/model i żeby ostatnia była user
function toGeminiContents(messages) {
  // Filtruj żeby role się naprzemiennie zmieniały
  const filtered = []
  let lastRole = null
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user'
    if (role === lastRole) {
      // Połącz z poprzednią wiadomością tego samego rola
      filtered[filtered.length - 1].parts[0].text += '\n' + m.content
    } else {
      filtered.push({ role, parts: [{ text: m.content }] })
      lastRole = role
    }
  }
  // Gemini wymaga żeby ostatnia wiadomość była od usera
  if (filtered.length > 0 && filtered[filtered.length - 1].role === 'model') {
    filtered.push({ role: 'user', parts: [{ text: 'Kontynuuj.' }] })
  }
  return filtered
}

export async function callClaude(messages, systemPrompt = '') {
  const contents = toGeminiContents(messages)
  return fetchGemini(contents, systemPrompt)
}

export async function analyzeReceipt(base64Image, mimeType = 'image/jpeg') {
  const contents = [{
    role: 'user',
    parts: [
      { inlineData: { mimeType, data: base64Image } },
      { text: 'Przeanalizuj ten paragon i zwróć TYLKO czysty JSON (zero komentarzy, zero markdown): {"store":"nazwa sklepu","total":liczba,"date":"YYYY-MM-DD lub null","category":"food|transport|entertainment|health|shopping|restaurants|utilities|subscriptions|fitness|education|travel|other","items":[{"name":"nazwa","price":liczba}]}' },
    ],
  }]

  const text = await fetchGemini(contents)
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
