/* ============================================================
   We10 BC परिवार फंड — App Logic & Data
   ============================================================ */

// ─────────────────────────────────────────────
// GOOGLE SHEETS CONFIG
// ─────────────────────────────────────────────
const SHEET_ID   = '1IUkCSOrmczIGYmYcTLgnrBK1cS9kH6CEkO-hKXR6kec';
// Use gviz/tq with out:json — this endpoint sends correct CORS headers for live deployments.
// The CSV endpoint (?tqx=out:csv) is blocked by browsers when the page is hosted online.
const SHEET_BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=`;
const CACHE_KEY  = 'we10bc_cache';
const CACHE_TTL  = 6 * 60 * 60 * 1000; // 6 hours — sheet updates should reflect same day

// When opening via file://, fetch will be blocked by the browser.
// Detect this and show a helpful message instead of silently failing.
const IS_FILE_PROTOCOL = location.protocol === 'file:';

// ─────────────────────────────────────────────
// FALLBACK / EMBEDDED DATA  (used when offline or Sheet is inaccessible)
// ─────────────────────────────────────────────

const FALLBACK_SUMMARY = {
  grossValue : 5396888,
  memorial   : 695927,
  netBC      : 4700961,
  perUnit    : 114658,
  costBasis  : 60807,
  xirr       : '17.29%',
  asOf       : '10/10/2026',
  proj: [
    { date:'10/10/26', label:'आज',     gross:5396888, net:4700961, perUnit:114658 },
    { date:'05/11/26', label:'',        gross:5447701, net:4744987, perUnit:115731 },
    { date:'05/04/27', label:'',        gross:5584177, net:4839326, perUnit:118032 },
  ],
};

const FALLBACK_MEMBERS = [
  { id:'vinod',    hi:'विनोद',      en:'Vinod',     units:1,  color:'#3b82f6', emoji:'👨' },
  { id:'kavish',   hi:'कविश',       en:'Kavish',    units:11, color:'#a855f7', emoji:'👨‍💼' },
  { id:'samrath',  hi:'समरथ',       en:'Samrath',   units:5,  color:'#22c55e', emoji:'🧑' },
  { id:'kamlesh',  hi:'कमलेश',      en:'Kamlesh',   units:2,  color:'#f59e0b', emoji:'👴' },
  { id:'govind',   hi:'गोविन्द',    en:'Govind',    units:2,  color:'#ef4444', emoji:'🕊️' },
  { id:'anil',     hi:'अनिल',       en:'Anil',      units:4,  color:'#06b6d4', emoji:'👨' },
  { id:'rahul',    hi:'राहुल',      en:'Rahul',     units:2,  color:'#84cc16', emoji:'🧑' },
  { id:'abhishek', hi:'अभिषेक',     en:'Abhishek',  units:1,  color:'#f97316', emoji:'🧑' },
  { id:'sonu',     hi:'सोनू',       en:'Sonu',      units:4,  color:'#ec4899', emoji:'👦' },
  { id:'jitu',     hi:'जीतू',       en:'Jitu',      units:2,  color:'#8b5cf6', emoji:'👨' },
  { id:'narendra', hi:'नरेन्द्र',   en:'Narendra',  units:4,  color:'#14b8a6', emoji:'👨' },
  { id:'ishwar',   hi:'ईश्वर',      en:'Ishwar',    units:1,  color:'#f43f5e', emoji:'🧓' },
  { id:'ashok',    hi:'अशोक',       en:'Ashok',     units:1,  color:'#64748b', emoji:'👴' },
  { id:'mangal',   hi:'मंगल दादा',  en:'Mangal Da', units:1,  color:'#78716c', emoji:'👴' },
];

// NMN-ND rows are rows 8–19 in the Calculation sheet (Mangal da, Shyam da,
// Prahalad da, Kavish, Samrath, Sonu(Ankit), Anil, Rahul, Kamlesh, Abhishek,
// Ishwar, Birju) — these are memorial fund CONTRIBUTIONS, not member loans.
// They are excluded from the loans section entirely.

const FALLBACK_LOANS = [
  // ── मई 2026
  { date:'5/5/26',  hi:'कविश',      principal:550000, rate:15,    today:585521, oct26:591250, dueDate:'5/11/26', final:591250, month:'may' },
  { date:'5/5/26',  hi:'विनोद',     principal:100000, rate:15,    today:106458, oct26:107500, dueDate:'5/11/26', final:107500, month:'may' },
  { date:'5/5/26',  hi:'गोविन्द',   principal:250000, rate:15,    today:266146, oct26:268750, dueDate:'5/11/26', final:268750, month:'may' },
  { date:'5/5/26',  hi:'राहुल',     principal:100000, rate:15,    today:106458, oct26:107500, dueDate:'5/11/26', final:107500, month:'may' },
  { date:'5/5/26',  hi:'विनोद',     principal:17615,  rate:15,    today:18753,  oct26:18936,  dueDate:'5/11/26', final:18936,  month:'may' },
  // ── जून 2026
  { date:'5/6/26',  hi:'नरेन्द्र',  principal:200000, rate:15,    today:210417, oct26:212500, dueDate:'5/12/26', final:215000, month:'jun' },
  { date:'5/6/26',  hi:'विनोद',     principal:50000,  rate:15,    today:52604,  oct26:53125,  dueDate:'5/12/26', final:53750,  month:'jun' },
  { date:'5/6/26',  hi:'कमलेश',     principal:50000,  rate:15,    today:52604,  oct26:53125,  dueDate:'5/12/26', final:53750,  month:'jun' },
  { date:'5/6/26',  hi:'कविश',      principal:700000, rate:15,    today:736458, oct26:743750, dueDate:'5/12/26', final:752500, month:'jun' },
  { date:'5/6/26',  hi:'कविश',      principal:25381,  rate:15,    today:26703,  oct26:26967,  dueDate:'5/12/26', final:27285,  month:'jun' },
  // ── जुलाई 2026
  { date:'5/7/26',  hi:'अभिषेक',    principal:100000, rate:13,    today:103431, oct26:104333, dueDate:'5/1/27',  final:106500, month:'jul' },
  { date:'5/7/26',  hi:'कविश',      principal:650000, rate:13,    today:672299, oct26:678167, dueDate:'5/1/27',  final:692250, month:'jul' },
  // ── अगस्त 2026
  { date:'5/8/26',  hi:'राहुल',     principal:250000, rate:12.5,  today:255642, oct26:257813, dueDate:'5/2/27',  final:265625, month:'aug' },
  { date:'5/8/26',  hi:'कविश',      principal:250000, rate:12.5,  today:255642, oct26:257813, dueDate:'5/2/27',  final:265625, month:'aug' },
  { date:'5/8/26',  hi:'अनिल',      principal:150000, rate:12.5,  today:153385, oct26:154688, dueDate:'5/2/27',  final:159375, month:'aug' },
  { date:'5/8/26',  hi:'नरेन्द्र',  principal:150000, rate:12.5,  today:153385, oct26:154688, dueDate:'5/2/27',  final:159375, month:'aug' },
  { date:'5/8/26',  hi:'कविश',      principal:30491,  rate:12.5,  today:31179,  oct26:31444,  dueDate:'5/2/27',  final:32397,  month:'aug' },
  // ── सितंबर 2026
  { date:'5/9/26',  hi:'गोविन्द',   principal:150000, rate:13.5,  today:151969, oct26:153375, dueDate:'5/3/27',  final:160125, month:'sep' },
  { date:'5/9/26',  hi:'विनोद',     principal:50000,  rate:13.5,  today:50656,  oct26:51125,  dueDate:'5/3/27',  final:53375,  month:'sep' },
  { date:'5/9/26',  hi:'राहुल',     principal:150000, rate:13.5,  today:151969, oct26:153375, dueDate:'5/3/27',  final:160125, month:'sep' },
  { date:'5/9/26',  hi:'अभिषेक',    principal:50000,  rate:13.5,  today:50656,  oct26:51125,  dueDate:'5/3/27',  final:53375,  month:'sep' },
  { date:'5/9/26',  hi:'अभिषेक',    principal:100000, rate:13.5,  today:101313, oct26:102250, dueDate:'5/3/27',  final:106750, month:'sep' },
  { date:'5/9/26',  hi:'कमलेश',     principal:100000, rate:13.5,  today:101313, oct26:102250, dueDate:'5/3/27',  final:106750, month:'sep' },
  { date:'5/9/26',  hi:'अनिल',      principal:50000,  rate:13.5,  today:50656,  oct26:51125,  dueDate:'5/3/27',  final:53375,  month:'sep' },
  { date:'5/9/26',  hi:'समरथ',      principal:50000,  rate:13.5,  today:50656,  oct26:51125,  dueDate:'5/3/27',  final:53375,  month:'sep' },
  { date:'5/9/26',  hi:'कविश',      principal:100000, rate:13.5,  today:101313, oct26:102250, dueDate:'5/3/27',  final:106750, month:'sep' },
  { date:'5/9/26',  hi:'कविश',      principal:100000, rate:13.5,  today:101313, oct26:102250, dueDate:'5/3/27',  final:106750, month:'sep' },
  { date:'5/9/26',  hi:'कविश',      principal:50000,  rate:13.5,  today:50656,  oct26:51125,  dueDate:'5/3/27',  final:53375,  month:'sep' },
  { date:'5/9/26',  hi:'विनोद',     principal:36259,  rate:13.5,  today:36735,  oct26:37075,  dueDate:'5/3/27',  final:38706,  month:'sep' },
  // ── अक्टूबर 2026
  { date:'5/10/26', hi:'अनिल',      principal:150000, rate:15,    today:150313, oct26:151875, dueDate:'5/4/27',  final:161250, month:'oct' },
  { date:'5/10/26', hi:'गोविन्द',   principal:100000, rate:15,    today:100208, oct26:101250, dueDate:'5/4/27',  final:107500, month:'oct' },
  { date:'5/10/26', hi:'कविश',      principal:200000, rate:15,    today:200417, oct26:202500, dueDate:'5/4/27',  final:215000, month:'oct' },
  { date:'5/10/26', hi:'कमलेश',     principal:50000,  rate:15,    today:50104,  oct26:50625,  dueDate:'5/4/27',  final:53750,  month:'oct' },
  { date:'5/10/26', hi:'विनोद',     principal:50000,  rate:15,    today:50104,  oct26:50625,  dueDate:'5/4/27',  final:53750,  month:'oct' },
  { date:'5/10/26', hi:'विनोद',     principal:35018,  rate:15,    today:35091,  oct26:35456,  dueDate:'5/4/27',  final:37644,  month:'oct' },
];

const FALLBACK_REDIST = [
  { month:'जुलाई',    amount:25000,  recipients:['विनोद (1)', 'गोविन्द (2)', 'अनिल (4)'] },
  { month:'अगस्त',   amount:25313,  recipients:['कविश (7)'] },
  { month:'सितंबर',  amount:25625,  recipients:['नरेन्द्र (1)', 'कमलेश (1)', 'राहुल (2)', 'कविश (3)'] },
  { month:'अक्टूबर', amount:25938,  recipients:['नरेन्द्र (1)', 'जीतू (2)', 'सोनू (4)'] },
  { month:'नवंबर',   amount:26250,  recipients:['समरथ (5)', 'नरेन्द्र (1)', 'ईश्वर (1)'] },
  { month:'दिसंबर',  amount:26563,  recipients:['कमलेश (1)', 'मंगल दा (1)', 'अशोक दा (1)', 'नरेन्द्र (1)', 'अभिषेक (1)', 'कविश (1)'] },
];

// ─────────────────────────────────────────────
// LIVE DATA STATE  (starts with fallback, overwritten by Sheet fetch)
// ─────────────────────────────────────────────
let DATA = {
  summary : { ...FALLBACK_SUMMARY },
  members : [...FALLBACK_MEMBERS],
  loans   : [...FALLBACK_LOANS],
  redist  : [...FALLBACK_REDIST],
  source  : 'fallback',   // 'fallback' | 'cache' | 'live'
  syncedAt: null,
};

// ─────────────────────────────────────────────
// CSV PARSER  (handles quoted fields)
// ─────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function cleanNum(s) {
  if (!s) return 0;
  // Remove ₹, $, spaces, commas
  return parseFloat(s.replace(/[₹$\s,]/g, '')) || 0;
}

// ─────────────────────────────────────────────
// SHEET PARSERS
// ─────────────────────────────────────────────

// ── "We10 BC" sheet  → summary KPIs + member units
function parseMainSheet(rows) {
  const memberColors = {
    'विनोद':'#3b82f6','कविश':'#a855f7','समरथ':'#22c55e','कमलेश':'#f59e0b',
    'गोविन्द':'#ef4444','अनिल':'#06b6d4','राहुल':'#84cc16','अभिषेक':'#f97316',
    'सोनू':'#ec4899','जीतू':'#8b5cf6','नरेन्द्र':'#14b8a6','ईश्वर ':'#f43f5e',
    'ईश्वर':'#f43f5e','अशोक':'#64748b','मंगल दादा':'#78716c',
  };
  const memberEmoji = {
    'विनोद':'👨','कविश':'👨‍💼','समरथ':'🧑','कमलेश':'👴','गोविन्द':'🕊️',
    'अनिल':'👨','राहुल':'🧑','अभिषेक':'🧑','सोनू':'👦','जीतू':'👨',
    'नरेन्द्र':'👨','ईश्वर ':'🧓','ईश्वर':'🧓','अशोक':'👴','मंगल दादा':'👴',
  };
  const memberEN = {
    'विनोद':'Vinod','कविश':'Kavish','समरथ':'Samrath','कमलेश':'Kamlesh',
    'गोविन्द':'Govind','अनिल':'Anil','राहुल':'Rahul','अभिषेक':'Abhishek',
    'सोनू':'Sonu','जीतू':'Jitu','नरेन्द्र':'Narendra','ईश्वर ':'Ishwar',
    'ईश्वर':'Ishwar','अशोक':'Ashok','मंगल दादा':'Mangal Da',
  };

  const members = [];
  let summary = null;
  let xirr = '17.35%', costBasis = 64235;
  const projRows = [];

  for (const row of rows) {
    const name = row[0]?.trim();
    if (!name) {
      // Blank col A — could be XIRR or cost basis row
      // col[2] holds the value for these rows
      const val2 = row[2]?.replace(/[₹,\s]/g, '') || '';
      const pct = parseFloat(val2);
      if (val2.includes('%') || (pct > 5 && pct < 50 && val2.includes('.'))) {
        xirr = pct.toFixed(2) + '%';
      } else {
        const cb = parseFloat(val2);
        if (cb > 50000 && cb < 100000) costBasis = cb;
      }
      continue;
    }

    // Member row: col[1] = units (number > 0), col[0] = Hindi name in lookup
    const units = parseInt(row[1]);
    if (!isNaN(units) && units > 0 && memberColors[name]) {
      members.push({
        id   : name.replace(/\s+/g, '').toLowerCase(),
        hi   : name,
        en   : memberEN[name] || name,
        units: units,
        color: memberColors[name] || '#888',
        emoji: memberEmoji[name] || '👤',
      });
    }

    // Projection rows: col[0] is a date string (DD/MM/YYYY or D/M/YYYY),
    // col[1] is null, cols[2..5] = gross, memorial, net, perUnit
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(name)) {
      const gross    = cleanNum(row[2]);
      const memorial = cleanNum(row[3]);
      const net      = cleanNum(row[4]);
      const perUnit  = cleanNum(row[5]);
      if (gross > 0) {
        projRows.push({ date: name, gross, memorial, net, perUnit });
        if (!summary) {
          // Format date as DD/MM/YY for display
          const parts = name.split('/');
          const shortDate = `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2].slice(-2)}`;
          summary = { grossValue: gross, memorial, netBC: net, perUnit, asOf: shortDate };
        }
      }
    }

    // XIRR row (col[2] is a percentage string like "17.29%")
    if (row[2] && String(row[2]).includes('%') && !name.includes('/')) {
      const v = parseFloat(String(row[2]));
      if (!isNaN(v) && v > 5 && v < 50) xirr = v.toFixed(2) + '%';
    }
    // Cost basis row (col[2] is a plain number in range 50k–100k)
    if (!row[2]?.includes('%') && !name.includes('/')) {
      const cb = cleanNum(row[2]);
      if (cb > 50000 && cb < 100000) costBasis = cb;
    }
  }

  if (!summary) summary = { ...FALLBACK_SUMMARY };
  summary.xirr = xirr;
  summary.costBasis = costBasis;

  // Build projection display rows from parsed data (up to 3)
  if (projRows.length >= 1) {
    summary.proj = projRows.slice(0, 3).map((p, i) => ({
      date    : (() => { const pts = p.date.split('/'); return `${pts[0].padStart(2,'0')}/${pts[1].padStart(2,'0')}/${pts[2].slice(-2)}`; })(),
      label   : i === 0 ? 'आज' : '',
      gross   : p.gross,
      net     : p.net,
      perUnit : p.perUnit,
    }));
  } else {
    summary.proj = FALLBACK_SUMMARY.proj;
  }

  return { summary, members: members.length > 0 ? members : FALLBACK_MEMBERS };
}

// ── "Calculation" sheet  → loans (skip NMN-ND rows 8–19 i.e. rows up to index ~17)
function parseCalculationSheet(rows) {
  const loans = [];

  // Month classifier — identifies active BC loans by their disbursement date.
  // Anything with year 2022 or 2023 is a NMN-ND memorial fund contribution → skip.
  function classifyMonth(dateStr) {
    if (!dateStr) return null;
    const s = dateStr.toLowerCase();
    // Match d/m/yy or d/m/yyyy patterns
    if (/\/4\/26$/.test(s) || s.includes('4/2026')) return 'apr';
    if (/\/5\/26$/.test(s) || s.includes('5/2026')) return 'may';
    if (/\/6\/26$/.test(s) || s.includes('6/2026')) return 'jun';
    if (/\/7\/26$/.test(s) || s.includes('7/2026')) return 'jul';
    if (/\/8\/26$/.test(s) || s.includes('8/2026')) return 'aug';
    if (/\/9\/26$/.test(s) || s.includes('9/2026')) return 'sep';
    if (/\/10\/26$/.test(s) || s.includes('10/2026')) return 'oct';
    if (/\/11\/26$/.test(s) || s.includes('11/2026')) return 'nov';
    if (/\/12\/26$/.test(s) || s.includes('12/2026')) return 'dec';
    return null; // 2022, 2023 rows → NMN-ND, skip
  }

  for (const row of rows) {
    const dateStr = row[0]?.trim();
    const name    = row[1]?.trim();
    const princ   = cleanNum(row[2]);
    const rateStr = row[3]?.trim();
    const todayV  = cleanNum(row[4]);
    const nextV   = cleanNum(row[5]);  // value at next meeting date
    const dueDate = row[6]?.trim();
    const finalV  = cleanNum(row[7]);

    if (!dateStr || !name || princ === 0) continue;
    if (dateStr === 'Date' || name === 'Total BC') continue;

    const month = classifyMonth(dateStr);
    if (!month) continue; // skip NMN-ND (2022/2023) rows

    const rate = parseFloat((rateStr || '').replace('%', '')) || 0;

    loans.push({
      date    : dateStr,
      hi      : name,
      principal: princ,
      rate,
      today   : todayV,
      oct26   : nextV,   // "next meeting" column — label in table is dynamic
      dueDate : dueDate || '—',
      final   : finalV,
      month,
    });
  }

  return loans.length > 0 ? loans : FALLBACK_LOANS;
}

// ── "Redistribution" sheet
function parseRedistSheet(rows) {
  const result = [];
  const monthMap = {
    'july':'जुलाई','aug':'अगस्त','sept':'सितंबर','sep':'सितंबर',
    'oct':'अक्टूबर','nov':'नवंबर','dec':'दिसंबर',
  };

  for (const row of rows) {
    const month  = row[1]?.trim();
    const amount = cleanNum(row[2]);
    if (!month || !amount || month.toLowerCase() === 'month') continue;

    const hi = monthMap[month.toLowerCase()] || month;
    const recipients = row.slice(3).map(r => r.trim()).filter(r => r && r !== '');

    result.push({ month: hi, amount, recipients });
  }
  return result.length > 0 ? result : FALLBACK_REDIST;
}

// ─────────────────────────────────────────────
// FETCH FROM GOOGLE SHEETS
// ─────────────────────────────────────────────

// The gviz/tq JSON response is wrapped in a JS callback:
//   /*O_o*/\ngoogle.visualization.Query.setResponse({...});
// We strip that wrapper and parse the JSON inside.
function parseGvizJSON(raw) {
  // Strip the JSONP wrapper Google adds
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Invalid gviz response');
  const json = JSON.parse(raw.slice(start, end + 1));

  // Convert gviz table format → 2D array of strings (same shape as CSV rows)
  const cols = json.table?.cols || [];
  const rows = json.table?.rows || [];
  return rows.map(row =>
    (row.c || []).map((cell, i) => {
      if (!cell || cell.v === null || cell.v === undefined) return '';
      // Dates come as Date(year,month,day) objects — convert to DD/MM/YYYY string
      const type = cols[i]?.type;
      if (type === 'date' && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
        const m = cell.v.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (m) {
          const d = String(m[3]).padStart(2,'0');
          const mo = String(Number(m[2])+1).padStart(2,'0');
          const yr = m[1].slice(-2); // last 2 digits
          return `${d}/${mo}/${yr}`;
        }
      }
      // formatted value (f) is human-readable; raw value (v) is the number
      return cell.f !== undefined && cell.f !== null ? String(cell.f) : String(cell.v);
    })
  );
}

async function fetchSheet(sheetName) {
  const url = SHEET_BASE + encodeURIComponent(sheetName);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet "${sheetName}" fetch failed: ${res.status}`);
  const text = await res.text();
  // Return parsed rows (2D string array), same interface the parsers expect
  return parseGvizJSON(text);
}

async function syncFromSheet(force = false) {
  // When opened as file://, browser blocks external fetch requests.
  // Show a clear message and use cached/fallback data.
  if (IS_FILE_PROTOCOL) {
    updateSyncUI('file-protocol');
    const cached = loadCache();
    if (cached) {
      DATA = cached;
      DATA.source = 'cache';
      renderAll();
    }
    return;
  }

  // Check cache (skip if force = true)
  if (!force) {
    const cached = loadCache();
    if (cached) {
      DATA = cached;
      DATA.source = 'cache';
      renderAll();
      updateSyncUI();
      return;
    }
  }

  setSyncing(true);

  try {
    const [mainRows, calcRows, redistRows] = await Promise.all([
      fetchSheet('We10 BC'),
      fetchSheet('Calculation'),
      fetchSheet('Redistribution'),
    ]);

    const { summary, members } = parseMainSheet(mainRows);
    const loans  = parseCalculationSheet(calcRows);
    const redist = parseRedistSheet(redistRows);

    DATA = { summary, members, loans, redist, source:'live', syncedAt: Date.now() };
    saveCache(DATA);
    renderAll();
    updateSyncUI('सफल');
  } catch (err) {
    console.warn('Sheet sync failed, using fallback:', err);
    if (DATA.source === 'fallback') {
      // Already using fallback, just render it
      renderAll();
    }
    updateSyncUI('त्रुटि — स्थानीय डेटा दिखाया जा रहा है');
  } finally {
    setSyncing(false);
  }
}

// ─────────────────────────────────────────────
// CACHE  (localStorage, 7-day TTL)
// ─────────────────────────────────────────────
function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (_) {}
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d.syncedAt) return null;
    if (Date.now() - d.syncedAt > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return d;
  } catch (_) { return null; }
}

// ─────────────────────────────────────────────
// SYNC UI
// ─────────────────────────────────────────────
function setSyncing(active) {
  const icon = document.getElementById('syncIcon');
  const btn  = document.getElementById('syncBtn');
  const btn2 = document.getElementById('syncBtnMobile');
  if (active) {
    if (icon) icon.classList.add('spinning');
    if (btn)  btn.disabled = true;
    if (btn2) btn2.disabled = true;
    document.getElementById('loadingOverlay')?.classList.add('show');
  } else {
    if (icon) icon.classList.remove('spinning');
    if (btn)  btn.disabled = false;
    if (btn2) btn2.disabled = false;
    document.getElementById('loadingOverlay')?.classList.remove('show');
  }
}

function updateSyncUI(msg) {
  const el = document.getElementById('syncStatus');
  const footer = document.getElementById('footerLastSync');
  const syncBtn = document.getElementById('syncBtn');

  // Special case: file:// protocol — show a persistent warning
  if (msg === 'file-protocol') {
    if (el) {
      el.innerHTML = '⚠ <a href="#" id="howToSync" style="color:var(--amber);text-decoration:underline">लाइव डेटा के लिए यहाँ देखें</a>';
      el.className = 'sync-status sync-err';
      document.getElementById('howToSync')?.addEventListener('click', (e) => {
        e.preventDefault();
        showFileProtocolModal();
      });
    }
    if (syncBtn) {
      syncBtn.title = 'file:// से live fetch नहीं हो सकता — नीचे देखें';
    }
    // Also show banner
    showFileProtocolBanner();
    return;
  }

  let label = '';
  if (DATA.syncedAt) {
    const d = new Date(DATA.syncedAt);
    const dateStr = d.toLocaleDateString('hi-IN', { day:'2-digit', month:'short', year:'numeric' });
    const timeStr = d.toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' });
    label = `${dateStr}, ${timeStr}`;
    if (footer) footer.textContent = `अंतिम अपडेट: ${label}`;
  }

  if (el) {
    if (msg === 'सफल') {
      el.textContent = '✓ अपडेट हो गया';
      el.className = 'sync-status sync-ok';
      setTimeout(() => { el.textContent = label; el.className = 'sync-status'; }, 3000);
    } else if (msg && msg.includes('त्रुटि')) {
      el.textContent = '⚠ ' + msg;
      el.className = 'sync-status sync-err';
    } else if (DATA.source === 'cache') {
      el.textContent = label ? `कैश: ${label}` : '';
      el.className = 'sync-status';
    } else if (DATA.source === 'live') {
      el.textContent = label;
      el.className = 'sync-status sync-ok';
    }
  }
}

// ─────────────────────────────────────────────
// FILE:// PROTOCOL HELPERS
// ─────────────────────────────────────────────
function showFileProtocolBanner() {
  if (document.getElementById('fileProtocolBanner')) return; // already shown
  const banner = document.createElement('div');
  banner.id = 'fileProtocolBanner';
  banner.className = 'fp-banner';
  banner.innerHTML = `
    <div class="fp-banner-inner">
      <span class="fp-icon">⚠</span>
      <div class="fp-text">
        <strong>Live डेटा fetch नहीं हो रहा</strong> — आप website को सीधे file के रूप में खोल रहे हैं।
        Google Sheet से live data लाने के लिए Terminal में यह command चलाएँ:
        <code>cd "${location.pathname.replace(/\/[^/]+$/, '')}" && python3 -m http.server 8080</code>
        फिर browser में जाएँ: <a href="http://localhost:8080" target="_blank">http://localhost:8080</a>
      </div>
      <button class="fp-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  document.body.prepend(banner);
}

function showFileProtocolModal() {
  showFileProtocolBanner();
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

const LIMIT_PER_UNIT     = 250000;  // ₹2,50,000 per unit (rule 12)
const MONTHLY_CONTRIB    = 1200;    // ₹1,200 per unit per month
const MIN_LOAN_FOR_LIMIT = 50000;   // loans < ₹50,000 are NOT counted against limit (rule 1)

function memberLoans(memberId) {
  const m = DATA.members.find(x => x.id === memberId);
  if (!m) return [];
  return DATA.loans.filter(l => {
    const lName = l.hi?.trim();
    return lName === m.hi?.trim() || lName === m.hi?.trim() + ' ' || l.member === memberId;
  });
}

// Only loans ≥ ₹50,000 count against the limit (rule 1)
function totalBorrowed(memberId) {
  return memberLoans(memberId)
    .filter(l => l.principal >= MIN_LOAN_FOR_LIMIT)
    .reduce((s, l) => s + l.principal, 0);
}

// Total principal of ALL loans (for display in modal only)
function totalBorrowedAll(memberId) {
  return memberLoans(memberId).reduce((s, l) => s + l.principal, 0);
}

function maxLimit(member) {
  return member.units * LIMIT_PER_UNIT;
}

// Remaining limit right now
function remainingLimit(member) {
  return Math.max(0, maxLimit(member) - totalBorrowed(member.id));
}

// Remaining limit after the upcoming meeting:
// Find the earliest due date across all active loans — that's the next meeting.
// Loans repaid at that meeting free up their principal in the limit.
function remainingLimitAfterMeeting(member) {
  const loans = memberLoans(member.id);

  // Find the nearest due date from all active loans (across all members)
  const allDueDates = DATA.loans
    .map(l => l.dueDate)
    .filter(d => d && d !== '—')
    .map(d => {
      // Parse D/M/YY or D/M/YYYY
      const parts = d.split('/');
      if (parts.length !== 3) return null;
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
      return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
    })
    .filter(d => d && !isNaN(d));

  const nextMeetingDate = allDueDates.length > 0
    ? new Date(Math.min(...allDueDates.map(d => d.getTime())))
    : null;

  if (!nextMeetingDate) return remainingLimit(member);

  // Format back to D/M/YY for comparison
  const nextDD = `${nextMeetingDate.getDate()}/${nextMeetingDate.getMonth()+1}/${String(nextMeetingDate.getFullYear()).slice(-2)}`;

  const repaying = loans
    .filter(l => l.dueDate === nextDD && l.principal >= MIN_LOAN_FOR_LIMIT)
    .reduce((s, l) => s + l.principal, 0);

  return Math.max(0, remainingLimit(member) + repaying);
}

function rateClass(rate) {
  if (rate >= 16)  return 'rate-high';
  if (rate >= 14)  return 'rate-mid';
  return 'rate-low';
}

function avatarStyle(color) {
  return `background:${color}22; color:${color}; border:2px solid ${color}44;`;
}

// ─────────────────────────────────────────────
// RENDER ALL
// ─────────────────────────────────────────────
function renderAll() {
  renderDashboard();
  renderUnitSummary();
  renderRedistTable();
  renderMembers();
  renderLoans(currentFilter);
}

// ─────────────────────────────────────────────
// RENDER: Dashboard KPIs & Projections
// ─────────────────────────────────────────────
function renderDashboard() {
  const s = DATA.summary;

  // KPI values
  setEl('kpiGross',   fmt(s.grossValue));
  setEl('kpiNet',     fmt(s.netBC));
  setEl('kpiPerUnit', fmt(s.perUnit));
  setEl('kpiMemorial',fmt(s.memorial));
  setEl('heroXirr',   s.xirr || '17.35%');
  setEl('kpiDate',    (s.asOf || '07/09/2026') + ' तक');
  setEl('kpiCostBasis','लागत आधार ' + fmt(s.costBasis || 64235));

  // Projections
  if (s.proj && s.proj.length >= 3) {
    updateProjRow('projRow1', s.proj[0], true);
    updateProjRow('projRow2', s.proj[1], false);
    updateProjRow('projRow3', s.proj[2], false);
  }
}

function updateProjRow(id, p, isToday) {
  const row = document.getElementById(id);
  if (!row) return;
  const cells = row.querySelectorAll('span');
  if (cells.length < 4) return;
  cells[0].innerHTML = isToday
    ? `${p.date} <em>आज</em>`
    : p.date;
  cells[1].textContent = fmt(p.gross);
  cells[2].textContent = fmt(p.net);
  cells[3].textContent = fmt(p.perUnit);
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ─────────────────────────────────────────────
// RENDER: Unit Summary
// ─────────────────────────────────────────────
function renderUnitSummary() {
  const grid = document.getElementById('unitSummaryGrid');
  if (!grid) return;
  const pv = DATA.summary.perUnit || 116626;
  grid.innerHTML = DATA.members.map(m => `
    <div class="unit-item">
      <span class="unit-name">${m.hi}</span>
      <span class="unit-count" style="color:${m.color}">${m.units}</span>
      <span class="unit-label">यूनिट · ${fmt(m.units * pv)}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
// RENDER: Redistribution Table
// ─────────────────────────────────────────────
function renderRedistTable() {
  const el = document.getElementById('redistTable');
  if (!el) return;
  el.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>माह</th>
          <th>प्रति यूनिट राशि</th>
          <th>प्राप्तकर्ता</th>
        </tr>
      </thead>
      <tbody>
        ${DATA.redist.map(r => `
          <tr>
            <td><strong>${r.month}</strong></td>
            <td style="color:var(--green);font-weight:600">${fmt(r.amount)}</td>
            <td>${r.recipients.map(p => `<span class="tag" style="font-family:'Noto Sans Devanagari',sans-serif;margin:2px">${p}</span>`).join(' ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ─────────────────────────────────────────────
// RENDER: Members Grid
// ─────────────────────────────────────────────
function renderMembers() {
  const grid = document.getElementById('membersGrid');
  if (!grid) return;
  const pv = DATA.summary.perUnit || 116626;

  grid.innerHTML = DATA.members.map(m => {
    const borrowed     = totalBorrowed(m.id);       // only loans ≥ ₹50k
    const maxLim       = maxLimit(m);
    const remLim       = remainingLimit(m);
    const remLimAfter  = remainingLimitAfterMeeting(m);
    const barPct       = maxLim > 0 ? Math.min((borrowed / maxLim) * 100, 100) : 0;
    const barColor     = barPct > 75 ? 'var(--red)' : barPct > 40 ? 'var(--amber)' : 'var(--green)';
    const remColor     = remLim === 0 ? 'var(--red)' : remLim < maxLim * 0.3 ? 'var(--amber)' : 'var(--green)';
    const remAfterColor= remLimAfter === 0 ? 'var(--red)' : remLimAfter < maxLim * 0.3 ? 'var(--amber)' : 'var(--green)';

    return `
      <div class="member-card" data-member="${m.id}">
        <div class="member-avatar" style="${avatarStyle(m.color)}">${m.emoji}</div>
        <div class="member-name">${m.hi}</div>
        <div class="member-name-en">${m.en}</div>
        <div class="member-stats">
          <div class="mstat">
            <div class="mstat-label">यूनिट</div>
            <div class="mstat-val" style="color:${m.color}">${m.units}</div>
          </div>
          <div class="mstat">
            <div class="mstat-label">पोर्टफोलियो</div>
            <div class="mstat-val" style="font-size:0.78rem">${fmt(m.units * pv)}</div>
          </div>
          <div class="mstat">
            <div class="mstat-label">कुल उधार*</div>
            <div class="mstat-val" style="font-size:0.78rem;color:var(--amber)">${borrowed > 0 ? fmt(borrowed) : '—'}</div>
          </div>
          <div class="mstat">
            <div class="mstat-label">कुल सीमा</div>
            <div class="mstat-val" style="font-size:0.78rem">${fmt(maxLim)}</div>
          </div>
        </div>

        <!-- Limit bars -->
        <div class="limit-section">
          <div class="limit-row">
            <span class="limit-row-label">शेष सीमा (अभी)</span>
            <span class="limit-row-val" style="color:${remColor}">${fmt(remLim)}</span>
          </div>
          <div class="bar-track" style="margin-bottom:0.5rem">
            <div class="bar-fill" style="width:${barPct}%;background:${barColor}"></div>
          </div>
          <div class="limit-row">
            <span class="limit-row-label">शेष सीमा (अगली मीटिंग बाद)</span>
            <span class="limit-row-val" style="color:${remAfterColor}">${fmt(remLimAfter)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${maxLim > 0 ? Math.min(((maxLim - remLimAfter)/maxLim)*100,100) : 0}%;background:${remAfterColor}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // footnote — remove existing one first to avoid duplicates on re-render
  document.querySelector('.members-note')?.remove();
  const note = document.createElement('p');
  note.className = 'members-note';
  note.textContent = '* ₹50,000 से कम के ऋण सीमा गणना में नहीं जोड़े जाते।';
  grid.after(note);

  grid.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('click', () => openMemberModal(card.dataset.member));
  });
}

// ─────────────────────────────────────────────
// MEMBER MODAL
// ─────────────────────────────────────────────
function openMemberModal(memberId) {
  const m = DATA.members.find(x => x.id === memberId);
  if (!m) return;
  const loans = memberLoans(memberId);
  const pv    = DATA.summary.perUnit || 116626;
  const modal = document.getElementById('memberModal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    <div class="modal-member-header">
      <div class="member-avatar" style="${avatarStyle(m.color)};width:52px;height:52px;font-size:1.4rem;margin-bottom:0.75rem">${m.emoji}</div>
      <h2>${m.hi} <span style="font-size:0.75em;opacity:0.5">(${m.en})</span></h2>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.25rem">
        ${m.units} यूनिट · पोर्टफोलियो मूल्य: <strong style="color:var(--green)">${fmt(m.units * pv)}</strong>
      </p>
    </div>
    <h4 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem">
      ऋण विवरण (${loans.length} ऋण)
    </h4>
    ${loans.length === 0
      ? `<div class="no-loans">कोई सक्रिय ऋण नहीं।</div>`
      : `<div class="modal-loan-list">
          ${loans.map(l => `
            <div class="modal-loan-item">
              <div><div class="ml-label">तारीख</div><div class="ml-val">${l.date}</div></div>
              <div><div class="ml-label">मूलधन</div><div class="ml-val">${fmt(l.principal)}</div></div>
              <div><div class="ml-label">दर / देय</div><div class="ml-val">${l.rate}% · ${l.dueDate}</div></div>
              <div><div class="ml-label">आज का मूल्य</div><div class="ml-val" style="color:var(--blue)">${fmt(l.today)}</div></div>
              <div><div class="ml-label">अंतिम राशि</div><div class="ml-val" style="color:var(--green)">${fmt(l.final)}</div></div>
              <div><div class="ml-label">ब्याज लाभ</div><div class="ml-val" style="color:var(--amber)">+${fmt(l.final - l.principal)}</div></div>
            </div>
          `).join('')}
        </div>`
    }
    <div style="margin-top:1.25rem;padding:0.75rem 1rem;background:var(--bg3);border-radius:var(--radius-sm);font-size:0.85rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem">
        <span style="color:var(--text-muted)">कुल उधार (सभी)</span>
        <span style="font-weight:600">${fmt(totalBorrowedAll(memberId))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem">
        <span style="color:var(--text-muted)">उधार (सीमा में गिनने योग्य)*</span>
        <span style="font-weight:600">${fmt(totalBorrowed(memberId))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem">
        <span style="color:var(--text-muted)">कुल सीमा</span>
        <span style="font-weight:600">${fmt(maxLimit(m))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem">
        <span style="color:var(--text-muted)">शेष सीमा (अभी)</span>
        <span style="font-weight:600;color:var(--green)">${fmt(remainingLimit(m))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
        <span style="color:var(--text-muted)">शेष सीमा (अगली मीटिंग बाद)</span>
        <span style="font-weight:600;color:var(--blue)">${fmt(remainingLimitAfterMeeting(m))}</span>
      </div>
      <div style="font-size:0.72rem;color:var(--text-dim);margin-top:0.25rem">* ₹50,000 से कम के ऋण सीमा में नहीं जोड़े जाते।</div>
    </div>
  `;
  modal.classList.add('open');
}

function closeMemberModal() {
  document.getElementById('memberModal').classList.remove('open');
}

// ─────────────────────────────────────────────
// RENDER: Loans Table
// ─────────────────────────────────────────────
let currentFilter = 'all';

function renderLoans(filter = 'all') {
  currentFilter = filter;
  const tbody = document.getElementById('loansBody');
  if (!tbody) return;

  const filtered = filter === 'all' ? DATA.loans : DATA.loans.filter(l => l.month === filter);

  tbody.innerHTML = filtered.map(l => `
    <tr>
      <td style="color:var(--text-muted);font-size:0.8rem">${l.date}</td>
      <td class="member-name-cell">${l.hi}</td>
      <td>${fmt(l.principal)}</td>
      <td><span class="rate-badge ${rateClass(l.rate)}">${l.rate}%</span></td>
      <td class="amount-today">${fmt(l.today)}</td>
      <td>${fmt(l.oct26)}</td>
      <td class="date-due">${l.dueDate}</td>
      <td class="amount-final">${fmt(l.final)}</td>
    </tr>
  `).join('');

  renderLoanTotals(filtered);
}

function renderLoanTotals(loans) {
  const el = document.getElementById('loanTotals');
  if (!el) return;
  const totalPrincipal = loans.reduce((s, l) => s + l.principal, 0);
  const totalToday     = loans.reduce((s, l) => s + l.today, 0);
  const totalFinal     = loans.reduce((s, l) => s + l.final, 0);
  const totalInterest  = totalFinal - totalPrincipal;

  el.innerHTML = `
    <div class="kpi-card accent-blue">
      <div class="kpi-label">कुल मूलधन</div>
      <div class="kpi-value">${fmt(totalPrincipal)}</div>
      <div class="kpi-note">${loans.length} ऋण रिकॉर्ड</div>
    </div>
    <div class="kpi-card accent-green">
      <div class="kpi-label">आज का मूल्य</div>
      <div class="kpi-value">${fmt(totalToday)}</div>
      <div class="kpi-note">ब्याज सहित</div>
    </div>
    <div class="kpi-card accent-amber">
      <div class="kpi-label">अर्जित ब्याज</div>
      <div class="kpi-value">${fmt(totalInterest)}</div>
      <div class="kpi-note">दर्शाए गए ऋणों पर</div>
    </div>
    <div class="kpi-card accent-purple">
      <div class="kpi-label">अंतिम निपटान</div>
      <div class="kpi-value">${fmt(totalFinal)}</div>
      <div class="kpi-note">देय तारीख पर</div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
      document.getElementById('mobileNav').classList.remove('open');
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById('tab-' + tabId);
  if (section) section.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// HAMBURGER
// ─────────────────────────────────────────────
function initHamburger() {
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobileNav').classList.toggle('open');
  });
}

// ─────────────────────────────────────────────
// FILTER BUTTONS
// ─────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLoans(btn.dataset.filter);
    });
  });
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function initModal() {
  document.getElementById('modalClose')?.addEventListener('click', closeMemberModal);
  document.getElementById('memberModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeMemberModal();
  });
}

// ─────────────────────────────────────────────
// SYNC BUTTON
// ─────────────────────────────────────────────
function initSyncButtons() {
  document.getElementById('syncBtn')?.addEventListener('click', () => syncFromSheet(true));
  document.getElementById('syncBtnMobile')?.addEventListener('click', () => {
    syncFromSheet(true);
    document.getElementById('mobileNav').classList.remove('open');
  });
}

// ─────────────────────────────────────────────
// WEEKLY AUTO-SYNC CHECK
// ─────────────────────────────────────────────
function checkWeeklySync() {
  const cached = loadCache();
  if (!cached || !cached.syncedAt) return true; // no cache → needs sync
  return (Date.now() - cached.syncedAt) > CACHE_TTL;
}

// ─────────────────────────────────────────────
// ANIMATED COUNTERS
// ─────────────────────────────────────────────
function animateCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.animated) return;
      el.dataset.animated = '1';
      const raw = el.textContent.replace(/[₹,%\s]/g, '');
      const target = parseFloat(raw);
      if (!isNaN(target) && target > 100) {
        let start = 0;
        const increment = target / (900 / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) { start = target; clearInterval(timer); }
          el.textContent = '₹' + Math.round(start).toLocaleString('en-IN');
        }, 16);
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.kpi-value').forEach(c => observer.observe(c));
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render immediately with fallback data so the page feels instant
  renderAll();
  initTabs();
  initHamburger();
  initFilters();
  initModal();
  initSyncButtons();
  animateCounters();

  // 2. Then sync from Google Sheets (uses cache if fresh, fetches live if stale/forced)
  await syncFromSheet(false);
  animateCounters(); // re-init for any new KPI cards rendered
});
