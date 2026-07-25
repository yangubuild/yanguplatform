import type {
  KSource, KCollection, KFAQ, KProduct, KService, KWebsiteImport,
  KSourceKind, KSourceStatus, KPermission, KVersion, KSearchHit,
  KTestResult, KAnalytics,
} from "./types";

const now = () => new Date().toISOString();
const iso = (dAgo: number) => new Date(Date.now() - dAgo * 86400000).toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Seed collections ───────────────────────────────────────────────────
const COLLECTIONS: KCollection[] = [
  { id: "col-sales",   name: "Sales Knowledge",   description: "Pitches, playbooks and objection handling.", color: "sky",     agentIds: ["a-amara"],                       createdAt: iso(30) },
  { id: "col-support", name: "Customer Support",  description: "Troubleshooting and support scripts.",       color: "emerald", agentIds: ["a-zara", "a-kaya"],              createdAt: iso(28) },
  { id: "col-hr",      name: "HR Policies",       description: "Leave, conduct and internal HR docs.",       color: "violet",  agentIds: [],                                createdAt: iso(20) },
  { id: "col-catalog", name: "Product Catalogue", description: "Products, SKUs and specifications.",         color: "amber",   agentIds: ["a-amara"],                       createdAt: iso(18) },
  { id: "col-pricing", name: "Pricing",           description: "Rate cards, discounts and tiers.",            color: "rose",    agentIds: ["a-amara", "a-kito"],             createdAt: iso(15) },
  { id: "col-company", name: "Company Information",description: "About us, brand, mission, contact.",         color: "slate",   agentIds: ["a-amara", "a-zara", "a-kaya", "a-kito"], createdAt: iso(15) },
  { id: "col-legal",   name: "Legal",             description: "Terms, privacy and compliance.",              color: "stone",   agentIds: [],                                createdAt: iso(10) },
  { id: "col-ops",     name: "Internal Operations",description: "SOPs, playbooks and workflows.",             color: "cyan",    agentIds: [],                                createdAt: iso(6)  },
];

function makeVersion(v: number, note: string, size: string, status: KSourceStatus = "indexed"): KVersion {
  return { id: uid("v"), version: v, createdAt: iso(Math.max(0, 20 - v * 3)), note, size, status };
}

const SOURCES: KSource[] = [
  { id: "src-1", name: "Product catalogue 2026.pdf",  kind: "pdf",     collectionId: "col-catalog",
    language: "English", version: 3, status: "indexed",   uploadedAt: iso(30), updatedAt: iso(3),
    size: "1.4 MB", active: true, permission: "sales",       agentIds: [], tags: ["catalogue","specs"],
    chunks: 184, sourceUrl: undefined,
    history: [makeVersion(1,"Initial upload","1.1 MB"), makeVersion(2,"Updated pricing","1.3 MB"), makeVersion(3,"Q1 2026 refresh","1.4 MB")] },
  { id: "src-2", name: "Company FAQ",                 kind: "faq",     collectionId: "col-support",
    language: "English", version: 5, status: "indexed",   uploadedAt: iso(25), updatedAt: iso(5),
    size: "42 entries", active: true, permission: "support",   agentIds: [], tags: ["faq"],
    chunks: 42, history: [makeVersion(1,"Seed FAQ","20 entries"), makeVersion(5,"Added returns","42 entries")] },
  { id: "src-3", name: "yangu.io/pricing",            kind: "url",     collectionId: "col-pricing",
    language: "English", version: 2, status: "indexed",   uploadedAt: iso(15), updatedAt: iso(1),
    size: "1 page",  active: true, permission: "all",       agentIds: [], tags: ["pricing","web"],
    chunks: 12, sourceUrl: "https://yangu.io/pricing",
    history: [makeVersion(1,"First crawl","1 page"), makeVersion(2,"Re-crawled","1 page")] },
  { id: "src-4", name: "Staff handbook v3.pdf",       kind: "pdf",     collectionId: "col-hr",
    language: "English", version: 3, status: "processing", uploadedAt: iso(0), updatedAt: iso(0),
    size: "3.2 MB", active: true, permission: "internal",  agentIds: [], tags: ["hr","policy"],
    chunks: 0, history: [makeVersion(1,"v1 handbook","2.8 MB"), makeVersion(2,"v2","3.0 MB"), makeVersion(3,"v3 draft","3.2 MB","processing")] },
  { id: "src-5", name: "Refund policy.docx",          kind: "docx",    collectionId: "col-legal",
    language: "English", version: 1, status: "ready",     uploadedAt: iso(10), updatedAt: iso(10),
    size: "82 KB", active: true, permission: "support",   agentIds: [], tags: ["policy","refund"],
    chunks: 7, history: [makeVersion(1,"Legal-approved","82 KB")] },
  { id: "src-6", name: "Onboarding SOP.docx",         kind: "sop",     collectionId: "col-ops",
    language: "English", version: 2, status: "indexed",   uploadedAt: iso(9),  updatedAt: iso(2),
    size: "140 KB", active: true, permission: "internal",  agentIds: [], tags: ["sop","ops"],
    chunks: 15, history: [makeVersion(1,"Draft","110 KB"), makeVersion(2,"Approved","140 KB")] },
  { id: "src-7", name: "About Yangu",                 kind: "note",    collectionId: "col-company",
    language: "English", version: 4, status: "indexed",   uploadedAt: iso(15), updatedAt: iso(1),
    size: "3 KB",  active: true, permission: "all",       agentIds: [], tags: ["company","brand"],
    chunks: 4, history: [makeVersion(4,"Latest edit","3 KB")] },
  { id: "src-8", name: "Contacts.csv",                kind: "csv",     collectionId: "col-company",
    language: "English", version: 1, status: "failed",    uploadedAt: iso(2),  updatedAt: iso(2),
    size: "220 KB", active: false, permission: "internal",  agentIds: [], tags: ["contacts"],
    chunks: 0, history: [makeVersion(1,"Malformed CSV","220 KB","failed")] },
  { id: "src-9", name: "2025 pricing archive.pdf",    kind: "pdf",     collectionId: "col-pricing",
    language: "English", version: 1, status: "archived",  uploadedAt: iso(120),updatedAt: iso(120),
    size: "900 KB", active: false, permission: "sales",       agentIds: [], tags: ["pricing","archive"],
    chunks: 84, history: [makeVersion(1,"Archived 2025 rates","900 KB","archived")] },
];

const FAQS: KFAQ[] = [
  { id: "faq-1", question: "Do you deliver to Kisumu?", answer: "Yes — 2 to 3 days, KES 450 flat.",
    category: "Shipping", language: "English", active: true, collectionId: "col-support", updatedAt: iso(4) },
  { id: "faq-2", question: "What are your working hours?", answer: "Mon–Fri, 8am to 6pm EAT.",
    category: "Company", language: "English", active: true, collectionId: "col-company", updatedAt: iso(5) },
  { id: "faq-3", question: "How do refunds work?", answer: "Full refund within 14 days if unused.",
    category: "Policy",   language: "English", active: true, collectionId: "col-legal",   updatedAt: iso(6) },
  { id: "faq-4", question: "Do you support Swahili?", answer: "Yes, our AI employees respond in Swahili and English.",
    category: "Product",  language: "English", active: true, collectionId: "col-catalog", updatedAt: iso(7) },
];

const PRODUCTS: KProduct[] = [
  { id: "prd-1", name: "Yangu Starter Plan", description: "For solo founders getting started.",
    features: ["1 AI Employee","1,000 conversations","200 voice minutes"], price: "$189 / mo",
    category: "Plans", availability: "in_stock", images: [], relatedProductIds: ["prd-2"],
    collectionId: "col-catalog", updatedAt: iso(4) },
  { id: "prd-2", name: "Yangu Growth Plan", description: "For growing teams that need scale.",
    features: ["Unlimited AI Employees","10,000 conversations","2,000 voice minutes","10 seats"],
    price: "$399 / mo", category: "Plans", availability: "in_stock", images: [], relatedProductIds: ["prd-1","prd-3"],
    collectionId: "col-catalog", updatedAt: iso(4) },
  { id: "prd-3", name: "Yangu Enterprise", description: "Custom rollout with SSO and dedicated support.",
    features: ["Custom pricing","Dedicated success manager","SSO / SAML","SLA"],
    price: "Custom", category: "Plans", availability: "in_stock", images: [], relatedProductIds: ["prd-2"],
    collectionId: "col-catalog", updatedAt: iso(3) },
];

const SERVICES: KService[] = [
  { id: "svc-1", name: "AI Employee Setup", description: "White-glove onboarding for your first AI Employee.",
    features: ["Discovery workshop","Knowledge ingestion","Voice tuning","Go-live support"], price: "$950",
    availability: "available", collectionId: "col-ops", updatedAt: iso(5) },
  { id: "svc-2", name: "Implementation Package", description: "End-to-end rollout for growing teams.",
    features: ["Up to 3 AI Employees","Integrations","Training"], price: "$2,000",
    availability: "available", collectionId: "col-ops", updatedAt: iso(5) },
];

const WEBSITE_IMPORTS: KWebsiteImport[] = [
  { id: "wi-1", rootUrl: "https://yangu.io", mode: "homepage",
    pages: ["https://yangu.io"], status: "indexed", createdAt: iso(15), collectionId: "col-company" },
  { id: "wi-2", rootUrl: "https://yangu.io/pricing", mode: "selected",
    pages: ["https://yangu.io/pricing","https://yangu.io/pricing/enterprise"], status: "indexed",
    createdAt: iso(10), collectionId: "col-pricing" },
];

// ─── Search + test synthesizers ────────────────────────────────────────
function tokenize(q: string) { return q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }

function scoreText(text: string, tokens: string[]) {
  const t = text.toLowerCase();
  let hits = 0;
  for (const tok of tokens) if (t.includes(tok)) hits++;
  return tokens.length ? hits / tokens.length : 0;
}

function search(query: string, opts?: { collectionId?: string; agentId?: string }): KSearchHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const hits: KSearchHit[] = [];

  for (const s of SOURCES) {
    if (!s.active || s.status === "archived") continue;
    if (opts?.collectionId && s.collectionId !== opts.collectionId) continue;
    const hay = [s.name, s.tags.join(" "), s.kind, s.sourceUrl ?? ""].join(" ");
    const sc = scoreText(hay, tokens);
    if (sc > 0) hits.push({ sourceId: s.id, sourceName: s.name, kind: s.kind,
      snippet: `${s.name} · ${s.tags.slice(0,3).join(", ") || s.kind}`, score: Math.min(1, sc + 0.15) });
  }
  for (const f of FAQS) {
    if (!f.active) continue;
    if (opts?.collectionId && f.collectionId !== opts.collectionId) continue;
    const sc = Math.max(scoreText(f.question, tokens), scoreText(f.answer, tokens) * 0.9);
    if (sc > 0) hits.push({ sourceId: f.id, sourceName: f.question, kind: "faq",
      snippet: f.answer, score: Math.min(1, sc + 0.1) });
  }
  for (const p of PRODUCTS) {
    if (opts?.collectionId && p.collectionId !== opts.collectionId) continue;
    const hay = [p.name, p.description, p.features.join(" "), p.category, p.price].join(" ");
    const sc = scoreText(hay, tokens);
    if (sc > 0) hits.push({ sourceId: p.id, sourceName: p.name, kind: "product",
      snippet: p.description, score: Math.min(1, sc + 0.1) });
  }
  for (const sv of SERVICES) {
    const hay = [sv.name, sv.description, sv.features.join(" ")].join(" ");
    const sc = scoreText(hay, tokens);
    if (sc > 0) hits.push({ sourceId: sv.id, sourceName: sv.name, kind: "service",
      snippet: sv.description, score: Math.min(1, sc + 0.1) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 20);
}

function testQuestion(question: string): KTestResult {
  const start = performance.now();
  const sources = search(question).slice(0, 4);
  const missing = sources.length === 0 || (sources[0]?.score ?? 0) < 0.35;
  const confidence = missing ? Math.min(0.35, sources[0]?.score ?? 0.1) : Math.min(0.98, 0.5 + (sources[0]?.score ?? 0.5) / 2);
  const answer = missing
    ? "I don't have enough information to answer that yet. Consider adding a knowledge source that covers this topic."
    : synthesizeAnswer(question, sources);
  const processingMs = Math.round(180 + Math.random() * 220 + (performance.now() - start));
  ANALYTICS.push({ query: question, confidence, missing, at: new Date().toISOString(), sourceIds: sources.map(s => s.sourceId) });
  return { question, answer, confidence, processingMs, sources, missing };
}

function synthesizeAnswer(question: string, hits: KSearchHit[]) {
  const q = question.toLowerCase();
  if (q.includes("price") || q.includes("cost") || q.includes("plan")) {
    return "Yangu Starter is $189/mo (+ $950 setup), Growth is $399/mo (+ $2,000 setup), and Enterprise is custom.";
  }
  if (q.includes("refund")) return "Full refund within 14 days of purchase if unused. See the refund policy for details.";
  if (q.includes("deliver") || q.includes("shipping")) return "We deliver across Kenya in 2–3 days at KES 450 flat.";
  if (q.includes("hours")) return "Business hours are Monday to Friday, 8am–6pm EAT.";
  return `Based on your knowledge base: ${hits[0]?.snippet ?? "here is the most relevant context."}`;
}

// ─── Lightweight analytics store ───────────────────────────────────────
interface TestEvent { query: string; confidence: number; missing: boolean; at: string; sourceIds: string[]; }
const ANALYTICS: TestEvent[] = [
  { query: "How much does the Growth plan cost?", confidence: 0.92, missing: false, at: iso(0), sourceIds: ["prd-2","src-3"] },
  { query: "Do you support Kinyarwanda?",         confidence: 0.28, missing: true,  at: iso(0), sourceIds: [] },
  { query: "What's your refund policy?",          confidence: 0.88, missing: false, at: iso(1), sourceIds: ["src-5","faq-3"] },
  { query: "Is there a free trial?",              confidence: 0.31, missing: true,  at: iso(1), sourceIds: [] },
  { query: "Do you deliver to Kisumu?",           confidence: 0.95, missing: false, at: iso(2), sourceIds: ["faq-1"] },
];

function analytics(): KAnalytics {
  const uses: Record<string, number> = {};
  for (const e of ANALYTICS) for (const id of e.sourceIds) uses[id] = (uses[id] ?? 0) + 1;
  const mostUsedSources = Object.entries(uses)
    .map(([sourceId, uses]) => {
      const name = SOURCES.find(s => s.id === sourceId)?.name
                ?? FAQS.find(f => f.id === sourceId)?.question
                ?? PRODUCTS.find(p => p.id === sourceId)?.name
                ?? SERVICES.find(sv => sv.id === sourceId)?.name
                ?? sourceId;
      return { sourceId, name, uses };
    })
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 8);

  const searchCounts: Record<string, number> = {};
  for (const e of ANALYTICS) searchCounts[e.query] = (searchCounts[e.query] ?? 0) + 1;
  const topSearches = Object.entries(searchCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  const unansweredMap: Record<string, { count: number; lastAt: string }> = {};
  for (const e of ANALYTICS) {
    if (!e.missing) continue;
    const prev = unansweredMap[e.query];
    unansweredMap[e.query] = { count: (prev?.count ?? 0) + 1, lastAt: e.at };
  }
  const unanswered = Object.entries(unansweredMap)
    .map(([query, v]) => ({ query, count: v.count, lastAt: v.lastAt }));

  const lowConfidence = ANALYTICS
    .filter(e => !e.missing && e.confidence < 0.6)
    .map(e => ({ query: e.query, confidence: e.confidence, at: e.at }))
    .slice(0, 8);

  const missingAreas = unanswered.length
    ? Array.from(new Set(unanswered.map(u => u.query.split(" ").slice(0, 3).join(" ")))).slice(0, 6)
    : ["Free trial", "Regional languages"];

  const uploads: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    const count = SOURCES.filter(s => s.uploadedAt.slice(0, 10) === key).length + (i === 0 ? 1 : 0);
    uploads.push({ day: key, count });
  }

  const indexed = SOURCES.filter(s => s.status === "indexed" || s.status === "ready").length;

  return {
    mostUsedSources, topSearches, unanswered, lowConfidence, missingAreas, uploads,
    totals: { sources: SOURCES.length, faqs: FAQS.length, products: PRODUCTS.length, services: SERVICES.length, indexed },
  };
}

// ─── Public API ────────────────────────────────────────────────────────
export const knowledgeDb = {
  collections: {
    list: () => COLLECTIONS,
    get: (id: string) => COLLECTIONS.find(c => c.id === id),
    add: (patch: Partial<KCollection>) => {
      const c: KCollection = {
        id: uid("col"), name: patch.name ?? "New collection", description: patch.description ?? "",
        color: patch.color ?? "slate", agentIds: patch.agentIds ?? [], createdAt: now(),
      };
      COLLECTIONS.push(c); return c;
    },
    update: (id: string, patch: Partial<KCollection>) => {
      const i = COLLECTIONS.findIndex(c => c.id === id); if (i < 0) return null;
      COLLECTIONS[i] = { ...COLLECTIONS[i], ...patch }; return COLLECTIONS[i];
    },
    remove: (id: string) => {
      const i = COLLECTIONS.findIndex(c => c.id === id); if (i < 0) return false;
      COLLECTIONS.splice(i, 1); return true;
    },
    assignAgents: (id: string, agentIds: string[]) => {
      const i = COLLECTIONS.findIndex(c => c.id === id); if (i < 0) return null;
      COLLECTIONS[i] = { ...COLLECTIONS[i], agentIds }; return COLLECTIONS[i];
    },
  },

  sources: {
    list: () => SOURCES,
    get: (id: string) => SOURCES.find(s => s.id === id),
    add: (patch: Partial<KSource> & { name: string; kind: KSourceKind; collectionId: string }) => {
      const s: KSource = {
        id: uid("src"),
        name: patch.name,
        kind: patch.kind,
        collectionId: patch.collectionId,
        language: patch.language ?? "English",
        version: 1,
        status: patch.status ?? "uploading",
        uploadedAt: now(), updatedAt: now(),
        size: patch.size ?? "—",
        active: true,
        permission: patch.permission ?? "all",
        agentIds: patch.agentIds ?? [],
        sourceUrl: patch.sourceUrl,
        tags: patch.tags ?? [],
        chunks: 0,
        history: [{ id: uid("v"), version: 1, createdAt: now(), note: "Initial upload", size: patch.size ?? "—", status: patch.status ?? "uploading" }],
      };
      SOURCES.unshift(s);
      // Simulate processing pipeline
      setTimeout(() => knowledgeDb.sources.setStatus(s.id, "processing"), 500);
      setTimeout(() => knowledgeDb.sources.setStatus(s.id, "indexed"), 1600);
      return s;
    },
    update: (id: string, patch: Partial<KSource>) => {
      const i = SOURCES.findIndex(s => s.id === id); if (i < 0) return null;
      SOURCES[i] = { ...SOURCES[i], ...patch, updatedAt: now() }; return SOURCES[i];
    },
    setStatus: (id: string, status: KSourceStatus) => {
      const i = SOURCES.findIndex(s => s.id === id); if (i < 0) return null;
      SOURCES[i] = { ...SOURCES[i], status, updatedAt: now() };
      SOURCES[i].history = [...SOURCES[i].history];
      const lastIdx = SOURCES[i].history.length - 1;
      if (lastIdx >= 0) SOURCES[i].history[lastIdx] = { ...SOURCES[i].history[lastIdx], status };
      return SOURCES[i];
    },
    archive: (id: string) => knowledgeDb.sources.update(id, { status: "archived", active: false }),
    restore: (id: string) => knowledgeDb.sources.update(id, { status: "indexed", active: true }),
    remove: (id: string) => {
      const i = SOURCES.findIndex(s => s.id === id); if (i < 0) return false;
      SOURCES.splice(i, 1); return true;
    },
    addVersion: (id: string, note: string, size = "—") => {
      const s = knowledgeDb.sources.get(id); if (!s) return null;
      const v: KVersion = { id: uid("v"), version: s.version + 1, createdAt: now(), note, size, status: "processing" };
      const next = { ...s, version: v.version, size, status: "processing" as KSourceStatus, updatedAt: now(),
        history: [...s.history, v] };
      const i = SOURCES.findIndex(x => x.id === id); SOURCES[i] = next;
      setTimeout(() => knowledgeDb.sources.setStatus(id, "indexed"), 1200);
      return next;
    },
    restoreVersion: (id: string, versionId: string) => {
      const s = knowledgeDb.sources.get(id); if (!s) return null;
      const target = s.history.find(v => v.id === versionId); if (!target) return null;
      const v: KVersion = { id: uid("v"), version: s.version + 1, createdAt: now(),
        note: `Restored from v${target.version}`, size: target.size, status: "processing" };
      const next = { ...s, version: v.version, status: "processing" as KSourceStatus, size: target.size,
        updatedAt: now(), history: [...s.history, v] };
      const i = SOURCES.findIndex(x => x.id === id); SOURCES[i] = next;
      setTimeout(() => knowledgeDb.sources.setStatus(id, "indexed"), 1000);
      return next;
    },
    setPermission: (id: string, permission: KPermission, agentIds: string[] = []) =>
      knowledgeDb.sources.update(id, { permission, agentIds }),
    listByCollection: (collectionId: string) => SOURCES.filter(s => s.collectionId === collectionId),
  },

  faqs: {
    list: () => FAQS,
    add: (patch: Partial<KFAQ> & { question: string; answer: string; collectionId: string }) => {
      const f: KFAQ = {
        id: uid("faq"), question: patch.question, answer: patch.answer,
        category: patch.category ?? "General", language: patch.language ?? "English",
        active: patch.active ?? true, collectionId: patch.collectionId, updatedAt: now(),
      };
      FAQS.push(f); return f;
    },
    update: (id: string, patch: Partial<KFAQ>) => {
      const i = FAQS.findIndex(f => f.id === id); if (i < 0) return null;
      FAQS[i] = { ...FAQS[i], ...patch, updatedAt: now() }; return FAQS[i];
    },
    remove: (id: string) => {
      const i = FAQS.findIndex(f => f.id === id); if (i < 0) return false;
      FAQS.splice(i, 1); return true;
    },
  },

  products: {
    list: () => PRODUCTS,
    add: (patch: Partial<KProduct> & { name: string; collectionId: string }) => {
      const p: KProduct = {
        id: uid("prd"), name: patch.name, description: patch.description ?? "",
        features: patch.features ?? [], price: patch.price ?? "—",
        category: patch.category ?? "General", availability: patch.availability ?? "in_stock",
        images: patch.images ?? [], relatedProductIds: patch.relatedProductIds ?? [],
        collectionId: patch.collectionId, updatedAt: now(),
      };
      PRODUCTS.push(p); return p;
    },
    update: (id: string, patch: Partial<KProduct>) => {
      const i = PRODUCTS.findIndex(p => p.id === id); if (i < 0) return null;
      PRODUCTS[i] = { ...PRODUCTS[i], ...patch, updatedAt: now() }; return PRODUCTS[i];
    },
    remove: (id: string) => {
      const i = PRODUCTS.findIndex(p => p.id === id); if (i < 0) return false;
      PRODUCTS.splice(i, 1); return true;
    },
  },

  services: {
    list: () => SERVICES,
    add: (patch: Partial<KService> & { name: string; collectionId: string }) => {
      const sv: KService = {
        id: uid("svc"), name: patch.name, description: patch.description ?? "",
        features: patch.features ?? [], price: patch.price ?? "—",
        availability: patch.availability ?? "available",
        collectionId: patch.collectionId, updatedAt: now(),
      };
      SERVICES.push(sv); return sv;
    },
    update: (id: string, patch: Partial<KService>) => {
      const i = SERVICES.findIndex(s => s.id === id); if (i < 0) return null;
      SERVICES[i] = { ...SERVICES[i], ...patch, updatedAt: now() }; return SERVICES[i];
    },
    remove: (id: string) => {
      const i = SERVICES.findIndex(s => s.id === id); if (i < 0) return false;
      SERVICES.splice(i, 1); return true;
    },
  },

  websiteImports: {
    list: () => WEBSITE_IMPORTS,
    add: (patch: Partial<KWebsiteImport> & { rootUrl: string; mode: KWebsiteImport["mode"]; collectionId: string }) => {
      const w: KWebsiteImport = {
        id: uid("wi"), rootUrl: patch.rootUrl, mode: patch.mode,
        pages: patch.pages ?? [patch.rootUrl], status: "processing",
        createdAt: now(), collectionId: patch.collectionId,
      };
      WEBSITE_IMPORTS.unshift(w);
      // Also create a KSource record for the import
      const src = knowledgeDb.sources.add({
        name: patch.rootUrl, kind: "url", collectionId: patch.collectionId,
        sourceUrl: patch.rootUrl, size: `${w.pages.length} page(s)`, tags: ["web-import"],
      });
      setTimeout(() => {
        const i = WEBSITE_IMPORTS.findIndex(x => x.id === w.id);
        if (i >= 0) WEBSITE_IMPORTS[i] = { ...WEBSITE_IMPORTS[i], status: "indexed" };
      }, 1800);
      return { ...w, sourceId: src.id };
    },
    remove: (id: string) => {
      const i = WEBSITE_IMPORTS.findIndex(w => w.id === id); if (i < 0) return false;
      WEBSITE_IMPORTS.splice(i, 1); return true;
    },
  },

  search,
  test: testQuestion,
  analytics,
};

export type KnowledgeDb = typeof knowledgeDb;