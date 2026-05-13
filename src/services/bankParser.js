const PL_MAP = {
  'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
  'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z',
}
const normalize = (s) => s.toLowerCase().replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => PL_MAP[c] || c)

// ── mBank bank-provided categories → app categories ──────────
const MBANK_CAT_MAP = {
  'zywnosc i chemia domowa':    'food',
  'jedzenie poza domem':        'restaurants',
  'przejazdy':                  'transport',
  'paliwo':                     'transport',
  'zdrowie i uroda':            'health',
  'tv, internet, telefon':      'subscriptions',
  'multimedia, ksiazki i prasa':'entertainment',
  'elektronika':                'shopping',
  'akcesoria i wyposazenie':    'shopping',
  'akcesoria i wyposazenie ':   'shopping',
  'odziez i obuwie':            'shopping',
  'wyjscia i wydarzenia':       'entertainment',
  'podroze i wyjazdy':          'travel',
  'sport i rekreacja':          'fitness',
  'edukacja':                   'education',
  'regularne oszczedzanie':     'other',
  'przelew wlasny':             'other',
  'bez kategorii':              'other',
  'wplywy - inne':              'other',
  'lokaty i konto oszcz.':      'other',
  'prezenty i wsparcie':        'other',
}

function mbankCategory(bankCat) {
  const n = normalize(bankCat.trim())
  return MBANK_CAT_MAP[n] || guessCategory(bankCat) || 'other'
}

// ── Keyword fallback for banks without category column ────────
const KEYWORDS = {
  food:          ['biedronka','lidl','kaufland','zabka','auchan','carrefour','tesco','netto','stokrotka','spar','delikatesy','piotr i pawel','intermarche','spozywczy','lewiatan','polomarket','freshmarket'],
  restaurants:   ['mcdonald','kfc','burger king','subway','pizza','restauracja','bar mleczny','kebab','sushi','dominos','papaj','north fish','kawiarnia','cafe ','coffee','starbucks','costa','pyszne'],
  transport:     ['uber','bolt','pkp','mzk','mpk','ztm','mkm','paliwo','orlen','shell','circle k','lotos','bp ','parking','myjnia','autostrada','viatoll','e-toll','pks','flixbus','polskibus','wizzair','ryanair','lot ','jakdojade'],
  entertainment: ['cinema city','multikino','helios','steam','epic games','playstation','xbox','nintendo','bilety','teatr','muzeum','zoo ','escape room','hellcase','totalcasino','casino'],
  subscriptions: ['netflix','spotify','hbo','disney','apple','google play','youtube premium','tidal','deezer','microsoft','adobe','canva','chatgpt','openai','notion','dropbox'],
  shopping:      ['allegro','amazon','zalando','empik','media markt','rtv euro agd','ikea','leroy merlin','castorama','obi ','jysk','h&m','zara','reserved','mohito','sinsay','cropp','aliexpress'],
  health:        ['apteka','dr max','rossmann','dbam o zdrowie','medicover','luxmed','lux med','nfz','szpital','klinika','stomatol','dentysta','optyk','hebe'],
  utilities:     ['tauron','pge ','enea','energa','fortum','innogy','miejskie','czynsz','woda','gaz','pgnig'],
  fitness:       ['silownia','gym','fitness','zdrofit','calypso','multisport','cityfit','mcfit'],
  education:     ['uczelnia','szkola','kurs ','udemy','coursera'],
  travel:        ['hotel','booking','airbnb','lot ','wizzair','ryanair','lotnisko'],
}

function guessCategory(text) {
  const n = normalize(text)
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    if (kws.some((kw) => n.includes(kw))) return cat
  }
  return 'other'
}

function parseAmount(str) {
  return parseFloat(
    str.replace(/\s/g, '').replace('PLN', '').replace('zł', '').replace(',', '.')
  )
}

function splitLine(line, sep) {
  const result = []
  let cur = ''
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ }
    else if (c === sep && !inQ) { result.push(cur); cur = '' }
    else { cur += c }
  }
  result.push(cur)
  return result
}

const clean = (s) => (s || '').replace(/"/g, '').trim()

// Extract merchant name — text before double-space or operation keywords
function extractMerchantName(raw) {
  const s = raw.trim()
  const m = s.match(/^(.+?)(?:\s{2,}|$)/)
  return m ? m[1].trim() : s.slice(0, 60).trim()
}

// ── mBank ────────────────────────────────────────────────────
// Format: #Data operacji;#Opis operacji;#Rachunek;#Kategoria;#Kwota;
// cols:       0              1              2          3        4
function parseMbank(lines) {
  const hi = lines.findIndex((l) => l.includes('#Data operacji'))
  if (hi === -1) return null
  const result = []
  for (let i = hi + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const cols = splitLine(line, ';')
    if (cols.length < 5) continue
    const dateStr = clean(cols[0])
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue  // skip metadata rows
    const rawDesc = clean(cols[1])
    const bankCat = clean(cols[3])
    const amtStr  = clean(cols[4])
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) continue
    const amount = parseAmount(amtStr)
    if (isNaN(amount) || amount === 0) continue
    const desc = extractMerchantName(rawDesc) || bankCat || 'Import'
    const category = bankCat ? mbankCategory(bankCat) : guessCategory(rawDesc)
    result.push({
      date: date.toISOString(),
      description: desc,
      amount: Math.abs(amount),
      rawAmount: amount,
      category,
      isExpense: amount < 0,
    })
  }
  return result.length > 0 ? result : null
}

// ── PKO BP ────────────────────────────────────────────────────
// Finds header dynamically via column names
function parsePkoBp(lines) {
  const hi = lines.findIndex((l) =>
    l.includes('"Data operacji"') || (l.includes('Data operacji') && l.includes('Kwota'))
  )
  if (hi === -1) return null
  const header = splitLine(lines[hi], ',').map((c) => normalize(clean(c)))
  const iDate  = header.findIndex((h) => h.includes('data operacji'))
  const iAmt   = header.findIndex((h) => h === 'kwota')
  const iDesc  = header.findIndex((h) => h.includes('tytul') || h.includes('tytu') || h.includes('opis'))
  const iPayee = header.findIndex((h) => h.includes('kontrahent') || h.includes('dane'))
  if (iDate === -1 || iAmt === -1) return null
  const result = []
  for (let i = hi + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const cols = splitLine(line, ',')
    if (cols.length < Math.max(iDate, iAmt) + 1) continue
    const dateStr = clean(cols[iDate])
    const amtStr  = clean(cols[iAmt])
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    const desc = clean(cols[iDesc] ?? '') || clean(cols[iPayee] ?? '') || 'Import'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) continue
    const amount = parseFloat(amtStr.replace(',', '.'))
    if (isNaN(amount) || amount === 0) continue
    result.push({
      date: date.toISOString(),
      description: desc,
      amount: Math.abs(amount),
      rawAmount: amount,
      category: guessCategory(desc),
      isExpense: amount < 0,
    })
  }
  return result.length > 0 ? result : null
}

// ── ING Bank ──────────────────────────────────────────────────
function parseIng(lines) {
  const hi = lines.findIndex((l) => l.includes('Data transakcji'))
  if (hi === -1) return null
  const result = []
  for (let i = hi + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const cols = splitLine(line, ';')
    if (cols.length < 9) continue
    const dateStr = clean(cols[0])
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    const payee  = clean(cols[2])
    const title  = clean(cols[3])
    const amtStr = clean(cols[8])
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) continue
    const amount = parseAmount(amtStr)
    if (isNaN(amount) || amount === 0) continue
    const desc = extractMerchantName(title || payee) || 'Import'
    result.push({
      date: date.toISOString(),
      description: desc,
      amount: Math.abs(amount),
      rawAmount: amount,
      category: guessCategory(desc + ' ' + payee),
      isExpense: amount < 0,
    })
  }
  return result.length > 0 ? result : null
}

// ── Generic semicolon fallback (Santander, Millennium, etc.) ──
function parseGenericSemicolon(lines) {
  const hi = lines.findIndex((l) => {
    const n = normalize(l)
    return n.includes('data') && (n.includes('kwota') || n.includes('amount'))
  })
  if (hi === -1) return null
  const header = splitLine(lines[hi], ';').map((c) => normalize(clean(c)))
  const iDate = header.findIndex((h) => h.startsWith('data'))
  const iAmt  = header.findIndex((h) => h.includes('kwota') || h.includes('amount'))
  const iDesc = header.findIndex((h) => h.includes('tytul') || h.includes('opis'))
  if (iDate === -1 || iAmt === -1) return null
  const result = []
  for (let i = hi + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const cols = splitLine(line, ';')
    if (cols.length < Math.max(iDate, iAmt) + 1) continue
    const dateStr = clean(cols[iDate])
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    const amtStr = clean(cols[iAmt])
    const desc   = iDesc >= 0 ? extractMerchantName(clean(cols[iDesc])) : 'Import'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) continue
    const amount = parseAmount(amtStr)
    if (isNaN(amount) || amount === 0) continue
    result.push({
      date: date.toISOString(),
      description: desc || 'Import',
      amount: Math.abs(amount),
      rawAmount: amount,
      category: guessCategory(desc),
      isExpense: amount < 0,
    })
  }
  return result.length > 0 ? result : null
}

export function parseBank(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    parseMbank(lines) ||
    parsePkoBp(lines) ||
    parseIng(lines) ||
    parseGenericSemicolon(lines) ||
    null
  )
}

export async function readFileAsText(file) {
  const buffer = await file.arrayBuffer()
  // Try UTF-8 first (handles BOM automatically)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {}
  // Fall back to Windows-1250 (older Polish bank exports)
  try {
    return new TextDecoder('windows-1250').decode(buffer)
  } catch {}
  return new TextDecoder('iso-8859-2').decode(buffer)
}
