import type { EditorSection } from "@/hooks/useBuilderEditor";

export type AdaPlanAction =
  | "update_item"
  | "add_item"
  | "update_contact"
  | "update_text"
  | "update_color"
  | "ask_clarification"
  | "unsupported";

export interface AdaMutationPlan {
  action: AdaPlanAction;
  target?: {
    section?: string;
    itemName?: string;
    categoryName?: string;
    field?: string;
  };
  changes?: Record<string, string>;
  clarification?: string;
  reason?: string;
}

export interface AdaHtmlSnapshot {
  mode: "html";
  surfaceType: string;
  surfaceTitle?: string;
  html: string | null;
}

export interface AdaSectionSnapshot {
  mode: "sections";
  surfaceType: string;
  surfaceTitle?: string;
  sections: EditorSection[];
}

export type AdaContextSnapshot = AdaHtmlSnapshot | AdaSectionSnapshot;

export interface AdaSectionUpdate {
  sectionId: string;
  schema: Record<string, unknown>;
  verify: (section: EditorSection | undefined) => boolean;
}

export type AdaPreparedMutation =
  | { kind: "clarify"; message: string }
  | { kind: "failed"; message: string }
  | {
      kind: "html";
      nextHtml: string;
      successMessage: string;
      verify: (html: string) => boolean;
    }
  | {
      kind: "sections";
      updates: AdaSectionUpdate[];
      successMessage: string;
    };

type HtmlItemCandidate = {
  title: string;
  price?: string;
  description?: string;
  titleEl: HTMLElement;
  priceEl?: HTMLElement;
  descriptionEl?: HTMLElement;
};

type StructuredItemCandidate = {
  sectionId: string;
  sectionType: string;
  arrayPath: Array<string | number>;
  item: Record<string, unknown>;
  title: string;
};

const PRICE_PATTERN = /(?:[$€£¥₹₦]|UGX|KES|TZS|RWF|NGN|GHS|ZAR|AED|INR|CNY|JPY|CAD|AUD|BRL|MXN|ETB|XOF|XAF)\s?[\d,.]+|^[\d,.]+\s?(?:[$€£¥₹₦]|UGX|KES|TZS|RWF|NGN|GHS|ZAR|AED|INR|CNY|JPY|CAD|AUD|BRL|MXN|ETB|XOF|XAF)$/i;

export function stripAdaFormatting(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractAdaPlan(raw: string): AdaMutationPlan | null {
  const direct = tryParseJson(raw);
  if (direct) return normalizePlan(direct);

  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlock) {
    const parsed = tryParseJson(codeBlock[1]);
    if (parsed) return normalizePlan(parsed);
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const parsed = tryParseJson(raw.slice(firstBrace, lastBrace + 1));
    if (parsed) return normalizePlan(parsed);
  }

  return null;
}

export function buildAdaContextSummary(snapshot: AdaContextSnapshot): string {
  if (snapshot.mode === "html") {
    const html = snapshot.html || "";
    const doc = parseHtml(html);
    const menuItems = collectHtmlMenuItems(doc).map((item) => ({
      title: item.title,
      price: item.price || "",
      description: item.description || "",
    }));
    const categoryItems = collectHtmlCategoryCards(doc).map((item) => ({
      title: item.title,
      meta: item.description || "",
    }));
    const hero = doc.querySelector("#hero") as HTMLElement | null;
    const footer = doc.querySelector("footer") as HTMLElement | null;
    return JSON.stringify(
      {
        mode: snapshot.mode,
        surfaceType: snapshot.surfaceType,
        surfaceTitle: snapshot.surfaceTitle || "",
        hero: {
          headline: hero?.querySelector("h1")?.textContent?.trim() || "",
          subheadline: hero?.querySelector("p")?.textContent?.trim() || "",
        },
        menuItems,
        categoryItems,
        footerText: footer?.textContent?.replace(/\s+/g, " ").trim().slice(0, 400) || "",
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      mode: snapshot.mode,
      surfaceType: snapshot.surfaceType,
      surfaceTitle: snapshot.surfaceTitle || "",
      sections: snapshot.sections.map((section) => summarizeSection(section)),
    },
    null,
    2,
  );
}

export function prepareAdaMutation(snapshot: AdaContextSnapshot, plan: AdaMutationPlan): AdaPreparedMutation {
  if (plan.action === "ask_clarification") {
    return {
      kind: "clarify",
      message: stripAdaFormatting(plan.clarification || "Which exact item or section should I change?"),
    };
  }

  if (plan.action === "unsupported") {
    return {
      kind: "failed",
      message: stripAdaFormatting(plan.reason || "I can't safely apply that change from here yet."),
    };
  }

  return snapshot.mode === "html"
    ? prepareHtmlMutation(snapshot, plan)
    : prepareSectionMutation(snapshot, plan);
}

function normalizePlan(raw: unknown): AdaMutationPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const action = typeof candidate.action === "string" ? candidate.action : null;
  if (!action) return null;

  return {
    action: action as AdaPlanAction,
    target: typeof candidate.target === "object" && candidate.target !== null
      ? candidate.target as AdaMutationPlan["target"]
      : undefined,
    changes: typeof candidate.changes === "object" && candidate.changes !== null
      ? Object.fromEntries(
          Object.entries(candidate.changes as Record<string, unknown>).filter(([, value]) => typeof value === "string" && value.trim()),
        ) as Record<string, string>
      : undefined,
    clarification: typeof candidate.clarification === "string" ? candidate.clarification : undefined,
    reason: typeof candidate.reason === "string" ? candidate.reason : undefined,
  };
}

function summarizeSection(section: EditorSection) {
  const schema = (section.schema || {}) as Record<string, unknown>;
  const items = extractSectionItemCandidates([section]).map((item) => ({
    title: item.title,
    price: typeof item.item.price === "string" ? item.item.price : "",
  }));

  return {
    id: section.id,
    type: section.section_type,
    coreSlot: section.core_slot || "",
    heading:
      readString(schema, "heading") ||
      readString(schema, "headline") ||
      readString(schema, "title") ||
      readString(schema, "subheadline") ||
      "",
    items,
    keys: Object.keys(schema),
  };
}

function prepareHtmlMutation(snapshot: AdaHtmlSnapshot, plan: AdaMutationPlan): AdaPreparedMutation {
  if (!snapshot.html) {
    return { kind: "failed", message: "I can't read the current page content yet." };
  }

  const doc = parseHtml(snapshot.html);

  switch (plan.action) {
    case "update_item":
      return prepareHtmlItemUpdate(doc, plan);
    case "add_item":
      return prepareHtmlItemAdd(doc, plan);
    case "update_contact":
      return prepareHtmlContactUpdate(doc, plan);
    case "update_text":
      return prepareHtmlTextUpdate(doc, plan);
    case "update_color":
      return prepareHtmlColorUpdate(doc, plan);
    default:
      return { kind: "failed", message: "I couldn't safely map that request to a page mutation." };
  }
}

function prepareSectionMutation(snapshot: AdaSectionSnapshot, plan: AdaMutationPlan): AdaPreparedMutation {
  switch (plan.action) {
    case "update_item":
      return prepareSectionItemUpdate(snapshot.sections, plan);
    case "add_item":
      return prepareSectionItemAdd(snapshot.sections, plan);
    case "update_contact":
      return prepareSectionContactUpdate(snapshot.sections, plan);
    case "update_text":
      return prepareSectionTextUpdate(snapshot.sections, plan);
    case "update_color":
      return prepareSectionColorUpdate(snapshot.sections, plan);
    default:
      return { kind: "failed", message: "I couldn't safely map that request to a structured section update." };
  }
}

function prepareHtmlItemUpdate(doc: Document, plan: AdaMutationPlan): AdaPreparedMutation {
  const targetName = plan.target?.itemName?.trim();
  if (!targetName) {
    return { kind: "clarify", message: "Tell me the exact current item name you want me to change." };
  }

  const sectionHint = normalizeText(plan.target?.section || "");
  const candidates = sectionHint.includes("categor")
    ? collectHtmlCategoryCards(doc)
    : collectHtmlMenuItems(doc);
  const match = matchNamedCandidate(candidates, targetName);
  if (match.status !== "single") {
    return { kind: "clarify", message: match.message };
  }

  const changes = plan.changes || {};
  if (changes.title) match.candidate.titleEl.textContent = changes.title;
  if (changes.price && match.candidate.priceEl) match.candidate.priceEl.textContent = changes.price;
  if (changes.description) {
    if (match.candidate.descriptionEl) {
      match.candidate.descriptionEl.textContent = changes.description;
    } else if (!sectionHint.includes("categor")) {
      const paragraph = doc.createElement("p");
      paragraph.textContent = changes.description;
      paragraph.style.cssText = "font-size:13px;color:#F0F5E877;line-height:1.6;";
      match.candidate.titleEl.parentElement?.appendChild(paragraph);
    }
  }

  const nextHtml = doc.documentElement.outerHTML;
  const expectedTitle = changes.title || match.candidate.title;
  const expectedPrice = changes.price || match.candidate.price;
  const expectedDescription = changes.description || match.candidate.description;

  return {
    kind: "html",
    nextHtml,
    successMessage: buildSuccessMessage(expectedTitle, changes),
    verify: (html) => verifyHtmlItemValues(html, expectedTitle, expectedPrice, expectedDescription),
  };
}

function prepareHtmlItemAdd(doc: Document, plan: AdaMutationPlan): AdaPreparedMutation {
  const changes = plan.changes || {};
  const title = changes.title?.trim();
  const price = changes.price?.trim();

  if (!title || !price) {
    return { kind: "clarify", message: "Tell me the new item name and price so I can add it correctly." };
  }

  const menuSection = findMenuSection(doc);
  const cards = collectHtmlMenuItems(doc);
  const templateCardTitle = cards[0]?.titleEl.closest("div")?.parentElement as HTMLElement | null;
  const grid = templateCardTitle?.parentElement as HTMLElement | null;

  if (!menuSection || !grid || !templateCardTitle) {
    return { kind: "failed", message: "I couldn't find a real menu card layout to clone safely." };
  }

  const clone = templateCardTitle.cloneNode(true) as HTMLElement;
  const cloneDoc = parseHtml(clone.outerHTML);
  const cloneCard = cloneDoc.body.firstElementChild as HTMLElement | null;
  if (!cloneCard) {
    return { kind: "failed", message: "I couldn't prepare a safe new item card." };
  }

  const cloneCandidate = collectHtmlMenuItems(cloneDoc)[0];
  if (cloneCandidate) {
    cloneCandidate.titleEl.textContent = title;
    if (cloneCandidate.priceEl) cloneCandidate.priceEl.textContent = price;
    if (cloneCandidate.descriptionEl) cloneCandidate.descriptionEl.textContent = changes.description || "Freshly added item";
  }

  grid.appendChild(cloneCard);
  const nextHtml = doc.documentElement.outerHTML;
  return {
    kind: "html",
    nextHtml,
    successMessage: `I added ${title} at ${price}, and it is now visible in the editor.`,
    verify: (html) => verifyHtmlItemValues(html, title, price, changes.description || "Freshly added item"),
  };
}

function prepareHtmlContactUpdate(doc: Document, plan: AdaMutationPlan): AdaPreparedMutation {
  const footer = (doc.querySelector("footer") || doc.querySelector("#contact")) as HTMLElement | null;
  if (!footer) {
    return { kind: "failed", message: "I couldn't find the contact area on this page." };
  }

  const changes = plan.changes || {};
  const verificationChecks: Array<(html: string) => boolean> = [];

  if (changes.phone) {
    const phoneLink = footer.querySelector('a[href^="tel:"]') as HTMLAnchorElement | null;
    if (phoneLink) {
      phoneLink.href = `tel:${changes.phone}`;
      phoneLink.textContent = changes.phone;
    } else {
      footer.appendChild(makeFooterLine(doc, `Phone: ${changes.phone}`));
    }
    verificationChecks.push((html) => normalizeText(html).includes(normalizeText(changes.phone || "")));
  }

  if (changes.email) {
    const emailLink = footer.querySelector('a[href^="mailto:"]') as HTMLAnchorElement | null;
    if (emailLink) {
      emailLink.href = `mailto:${changes.email}`;
      emailLink.textContent = changes.email;
    } else {
      footer.appendChild(makeFooterLine(doc, `Email: ${changes.email}`));
    }
    verificationChecks.push((html) => normalizeText(html).includes(normalizeText(changes.email || "")));
  }

  if (changes.address) {
    footer.appendChild(makeFooterLine(doc, changes.address));
    verificationChecks.push((html) => normalizeText(html).includes(normalizeText(changes.address || "")));
  }

  if (changes.whatsapp) {
    const existingWhatsApp = footer.querySelector('a[href*="wa.me"], a[href*="whatsapp"], a[href^="https://wa.me/"]') as HTMLAnchorElement | null;
    const cleanNumber = changes.whatsapp.replace(/[^\d+]/g, "");
    if (existingWhatsApp) {
      existingWhatsApp.href = `https://wa.me/${cleanNumber.replace(/[^\d]/g, "")}`;
      existingWhatsApp.textContent = `WhatsApp: ${changes.whatsapp}`;
    } else {
      const link = doc.createElement("a");
      link.href = `https://wa.me/${cleanNumber.replace(/[^\d]/g, "")}`;
      link.textContent = `WhatsApp: ${changes.whatsapp}`;
      link.style.cssText = "display:block;margin-top:8px;color:inherit;text-decoration:none;";
      footer.appendChild(link);
    }
    verificationChecks.push((html) => normalizeText(html).includes(normalizeText(changes.whatsapp || "")));
  }

  const nextHtml = doc.documentElement.outerHTML;
  return {
    kind: "html",
    nextHtml,
    successMessage: "I updated the contact details and verified the change in the editor.",
    verify: (html) => verificationChecks.length > 0 && verificationChecks.every((check) => check(html)),
  };
}

function prepareHtmlTextUpdate(doc: Document, plan: AdaMutationPlan): AdaPreparedMutation {
  const changes = plan.changes || {};
  const sectionHint = normalizeText(plan.target?.section || "");
  const targetSection =
    (sectionHint.includes("hero") ? doc.querySelector("#hero") : null) ||
    (plan.target?.section ? doc.querySelector(`#${plan.target.section}`) : null) ||
    findSectionByHeading(doc, plan.target?.section || "");

  if (!targetSection) {
    return { kind: "clarify", message: "Tell me the exact section you want me to update." };
  }

  const heading = targetSection.querySelector("h1, h2, h3") as HTMLElement | null;
  const body = targetSection.querySelector("p") as HTMLElement | null;

  if (changes.headline && heading) heading.textContent = changes.headline;
  if (changes.subheadline && body) body.textContent = changes.subheadline;
  if (changes.text) {
    if (body) body.textContent = changes.text;
    else if (heading) heading.textContent = changes.text;
  }

  if (!changes.headline && !changes.subheadline && !changes.text) {
    return { kind: "clarify", message: "Tell me the new text you want in that section." };
  }

  const expected = changes.headline || changes.subheadline || changes.text || "";
  const nextHtml = doc.documentElement.outerHTML;
  return {
    kind: "html",
    nextHtml,
    successMessage: "I updated that section text and verified it in the editor.",
    verify: (html) => normalizeText(html).includes(normalizeText(expected)),
  };
}

function prepareHtmlColorUpdate(doc: Document, plan: AdaMutationPlan): AdaPreparedMutation {
  const changes = plan.changes || {};
  const backgroundColor = changes.backgroundColor || changes.background || "";
  const textColor = changes.textColor || changes.foreground || "";
  const sectionHint = normalizeText(plan.target?.section || "page");
  const target =
    sectionHint.includes("page") || sectionHint.includes("body")
      ? doc.body
      : ((doc.querySelector(`#${plan.target?.section}`) || findSectionByHeading(doc, plan.target?.section || "")) as HTMLElement | null);

  if (!target) {
    return { kind: "clarify", message: "Tell me which section should get the new color." };
  }

  if (backgroundColor) target.style.backgroundColor = backgroundColor;
  if (textColor) target.style.color = textColor;

  if (!backgroundColor && !textColor) {
    return { kind: "clarify", message: "Tell me the exact color you want me to apply." };
  }

  const nextHtml = doc.documentElement.outerHTML;
  return {
    kind: "html",
    nextHtml,
    successMessage: "I updated the color in the editor and verified the change.",
    verify: (html) => {
      const verifyDoc = parseHtml(html);
      const verifyTarget = target === doc.body
        ? verifyDoc.body
        : (verifyDoc.querySelector(`#${plan.target?.section}`) || findSectionByHeading(verifyDoc, plan.target?.section || "")) as HTMLElement | null;
      if (!verifyTarget) return false;
      return (!backgroundColor || normalizeText(verifyTarget.getAttribute("style") || "").includes(normalizeText(backgroundColor)))
        && (!textColor || normalizeText(verifyTarget.getAttribute("style") || "").includes(normalizeText(textColor)));
    },
  };
}

function prepareSectionItemUpdate(sections: EditorSection[], plan: AdaMutationPlan): AdaPreparedMutation {
  const targetName = plan.target?.itemName?.trim();
  if (!targetName) {
    return { kind: "clarify", message: "Tell me the exact current item name you want me to update." };
  }

  const candidates = extractSectionItemCandidates(sections);
  const match = matchNamedCandidate(candidates, targetName);
  if (match.status !== "single") {
    return { kind: "clarify", message: match.message };
  }

  const changes = plan.changes || {};
  const section = sections.find((entry) => entry.id === match.candidate.sectionId);
  if (!section) {
    return { kind: "failed", message: "I couldn't find that section anymore." };
  }

  const nextSchema = cloneJson(section.schema || {});
  const target = getAtPath(nextSchema, match.candidate.arrayPath);
  if (!target || typeof target !== "object") {
    return { kind: "failed", message: "I couldn't safely update that item in the saved section data." };
  }

  if (changes.title) (target as Record<string, unknown>).title = changes.title;
  if (changes.price) (target as Record<string, unknown>).price = changes.price;
  if (changes.description) (target as Record<string, unknown>).description = changes.description;

  const expectedTitle = changes.title || match.candidate.title;
  const expectedPrice = changes.price || (typeof match.candidate.item.price === "string" ? match.candidate.item.price : undefined);
  const expectedDescription = changes.description || (typeof match.candidate.item.description === "string" ? match.candidate.item.description : undefined);

  return {
    kind: "sections",
    updates: [
      {
        sectionId: section.id,
        schema: nextSchema,
        verify: (latestSection) => verifyStructuredItem(latestSection, expectedTitle, expectedPrice, expectedDescription),
      },
    ],
    successMessage: buildSuccessMessage(expectedTitle, changes),
  };
}

function prepareSectionItemAdd(sections: EditorSection[], plan: AdaMutationPlan): AdaPreparedMutation {
  const changes = plan.changes || {};
  const title = changes.title?.trim();
  const price = changes.price?.trim();
  if (!title || !price) {
    return { kind: "clarify", message: "Tell me the new item name and price so I can add it correctly." };
  }

  const targetSection =
    sections.find((section) => normalizeText(section.core_slot || "") === "main content") ||
    sections.find((section) => Array.isArray((section.schema as Record<string, unknown>).items));

  if (!targetSection) {
    return { kind: "failed", message: "I couldn't find a real item list to add into safely." };
  }

  const nextSchema = cloneJson(targetSection.schema || {});
  const schemaRecord = nextSchema as Record<string, unknown>;
  if (Array.isArray(schemaRecord.items)) {
    schemaRecord.items = [
      ...schemaRecord.items,
      { title, price, description: changes.description || "" },
    ];
  } else {
    return { kind: "failed", message: "This section does not expose a reusable items array yet." };
  }

  return {
    kind: "sections",
    updates: [
      {
        sectionId: targetSection.id,
        schema: nextSchema,
        verify: (latestSection) => verifyStructuredItem(latestSection, title, price, changes.description || ""),
      },
    ],
    successMessage: `I added ${title} at ${price}, and it is now visible in the editor.`,
  };
}

function prepareSectionContactUpdate(sections: EditorSection[], plan: AdaMutationPlan): AdaPreparedMutation {
  const footer = sections.find((section) => section.core_slot === "footer" || section.section_type === "footer");
  if (!footer) {
    return { kind: "failed", message: "I couldn't find the contact section in this builder." };
  }

  const nextSchema = cloneJson(footer.schema || {});
  const schemaRecord = nextSchema as Record<string, unknown>;
  const changes = plan.changes || {};

  if (changes.phone) schemaRecord.phone = changes.phone;
  if (changes.email) schemaRecord.email = changes.email;
  if (changes.address) schemaRecord.address = changes.address;
  if (changes.whatsapp) {
    const social = (schemaRecord.social && typeof schemaRecord.social === "object")
      ? { ...(schemaRecord.social as Record<string, unknown>) }
      : {};
    social.whatsapp = changes.whatsapp;
    schemaRecord.social = social;
  }

  return {
    kind: "sections",
    updates: [
      {
        sectionId: footer.id,
        schema: nextSchema,
        verify: (latestSection) => {
          const latest = (latestSection?.schema || {}) as Record<string, unknown>;
          return (!changes.phone || latest.phone === changes.phone)
            && (!changes.email || latest.email === changes.email)
            && (!changes.address || latest.address === changes.address)
            && (!changes.whatsapp || ((latest.social as Record<string, unknown> | undefined)?.whatsapp === changes.whatsapp));
        },
      },
    ],
    successMessage: "I updated the contact details and verified the change in the editor.",
  };
}

function prepareSectionTextUpdate(sections: EditorSection[], plan: AdaMutationPlan): AdaPreparedMutation {
  const target = findTargetSection(sections, plan.target?.section || "hero");
  if (!target) {
    return { kind: "clarify", message: "Tell me the exact section you want me to update." };
  }

  const nextSchema = cloneJson(target.schema || {});
  const schemaRecord = nextSchema as Record<string, unknown>;
  const changes = plan.changes || {};

  if (changes.headline) schemaRecord.headline = changes.headline;
  if (changes.subheadline) schemaRecord.subheadline = changes.subheadline;
  if (changes.text) {
    if (typeof schemaRecord.description === "string") schemaRecord.description = changes.text;
    else if (typeof schemaRecord.body === "string") schemaRecord.body = changes.text;
    else if (typeof schemaRecord.heading === "string") schemaRecord.heading = changes.text;
  }

  const expected = changes.headline || changes.subheadline || changes.text || "";
  return {
    kind: "sections",
    updates: [
      {
        sectionId: target.id,
        schema: nextSchema,
        verify: (latestSection) => normalizeText(JSON.stringify(latestSection?.schema || {})).includes(normalizeText(expected)),
      },
    ],
    successMessage: "I updated that section text and verified it in the editor.",
  };
}

function prepareSectionColorUpdate(sections: EditorSection[], plan: AdaMutationPlan): AdaPreparedMutation {
  const target = findTargetSection(sections, plan.target?.section || "hero");
  if (!target) {
    return { kind: "clarify", message: "Tell me which section should get the new color." };
  }

  const nextSchema = cloneJson(target.schema || {});
  const schemaRecord = nextSchema as Record<string, unknown>;
  const changes = plan.changes || {};
  const backgroundColor = changes.backgroundColor || changes.background;
  const textColor = changes.textColor || changes.foreground;

  if (backgroundColor) schemaRecord.background_color = backgroundColor;
  if (textColor) schemaRecord.text_color = textColor;

  if (!backgroundColor && !textColor) {
    return { kind: "clarify", message: "Tell me the exact color you want me to apply." };
  }

  return {
    kind: "sections",
    updates: [
      {
        sectionId: target.id,
        schema: nextSchema,
        verify: (latestSection) => {
          const latest = (latestSection?.schema || {}) as Record<string, unknown>;
          return (!backgroundColor || latest.background_color === backgroundColor)
            && (!textColor || latest.text_color === textColor);
        },
      },
    ],
    successMessage: "I updated the color in the editor and verified the change.",
  };
}

function collectHtmlMenuItems(doc: Document): HtmlItemCandidate[] {
  const section = findMenuSection(doc);
  if (!section) return [];

  const items: HtmlItemCandidate[] = [];
  const seen = new Set<string>();
  section.querySelectorAll("h3").forEach((titleEl) => {
    const title = titleEl.textContent?.trim() || "";
    if (!title) return;

    let scope: HTMLElement | null = titleEl.parentElement as HTMLElement | null;
    while (scope && scope !== section) {
      const priceEl = findPriceElement(scope);
      if (priceEl) {
        const key = `${normalizeText(title)}::${normalizeText(priceEl.textContent || "")}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            title,
            price: priceEl.textContent?.trim(),
            description: scope.querySelector("p")?.textContent?.trim(),
            titleEl: titleEl as HTMLElement,
            priceEl,
            descriptionEl: scope.querySelector("p") as HTMLElement | undefined,
          });
        }
        break;
      }
      scope = scope.parentElement;
    }
  });

  return items;
}

function collectHtmlCategoryCards(doc: Document): HtmlItemCandidate[] {
  const section = (doc.querySelector("#categories") || doc.querySelector("section")) as HTMLElement | null;
  if (!section) return [];

  const items: HtmlItemCandidate[] = [];
  const seen = new Set<string>();
  section.querySelectorAll("img[alt]").forEach((imageEl) => {
    const title = imageEl.getAttribute("alt")?.trim() || "";
    if (!title || seen.has(normalizeText(title))) return;
    seen.add(normalizeText(title));
    const card = imageEl.closest("div")?.parentElement as HTMLElement | null;
    const textSpans = Array.from(card?.querySelectorAll("span") || []).map((el) => el as HTMLElement);
    const titleEl = textSpans.find((span) => normalizeText(span.textContent || "") === normalizeText(title));
    if (!titleEl) return;
    const metaEl = textSpans.find((span) => span !== titleEl && normalizeText(span.textContent || "") !== "→");
    items.push({
      title,
      description: metaEl?.textContent?.trim(),
      titleEl,
      descriptionEl: metaEl,
    });
  });
  return items;
}

function extractSectionItemCandidates(sections: EditorSection[]): StructuredItemCandidate[] {
  const candidates: StructuredItemCandidate[] = [];

  sections.forEach((section) => {
    const schema = (section.schema || {}) as Record<string, unknown>;

    const pushItems = (items: unknown[], basePath: Array<string | number>) => {
      items.forEach((item, index) => {
        if (!item || typeof item !== "object") return;
        const record = item as Record<string, unknown>;
        const title = readString(record, "title") || readString(record, "name");
        if (!title) return;
        candidates.push({
          sectionId: section.id,
          sectionType: section.section_type,
          arrayPath: [...basePath, index],
          item: record,
          title,
        });
      });
    };

    if (Array.isArray(schema.items)) pushItems(schema.items, ["items"]);
    if (Array.isArray(schema.products)) pushItems(schema.products, ["products"]);
    if (Array.isArray(schema.listings)) pushItems(schema.listings, ["listings"]);

    if (Array.isArray(schema.categories)) {
      schema.categories.forEach((category, categoryIndex) => {
        if (!category || typeof category !== "object") return;
        const categoryRecord = category as Record<string, unknown>;
        if (Array.isArray(categoryRecord.items)) {
          pushItems(categoryRecord.items, ["categories", categoryIndex, "items"]);
        }
      });
    }
  });

  return candidates;
}

function matchNamedCandidate<T extends { title: string }>(candidates: T[], targetName: string):
  | { status: "single"; candidate: T }
  | { status: "clarify"; message: string } {
  const normalizedTarget = normalizeText(targetName);
  const exact = candidates.filter((candidate) => normalizeText(candidate.title) === normalizedTarget);
  if (exact.length === 1) return { status: "single", candidate: exact[0] };
  if (exact.length > 1) {
    return { status: "clarify", message: `I found multiple items named ${targetName}. Tell me which one you want me to change.` };
  }

  const partial = candidates.filter((candidate) => {
    const normalizedTitle = normalizeText(candidate.title);
    return normalizedTitle.includes(normalizedTarget) || normalizedTarget.includes(normalizedTitle);
  });

  if (partial.length === 1) return { status: "single", candidate: partial[0] };
  if (partial.length > 1) {
    return {
      status: "clarify",
      message: `I found multiple close matches: ${partial.slice(0, 4).map((entry) => entry.title).join(", ")}. Tell me the exact current item name.`,
    };
  }

  return {
    status: "clarify",
    message: `I couldn't find ${targetName} in the current editor content. Tell me the exact current item name shown on the page.`,
  };
}

function verifyHtmlItemValues(html: string, title?: string, price?: string, description?: string) {
  const doc = parseHtml(html);
  const items = collectHtmlMenuItems(doc);
  const match = items.find((item) => !title || normalizeText(item.title) === normalizeText(title));
  if (!match) return false;
  return (!price || normalizeText(match.price || "") === normalizeText(price))
    && (!description || normalizeText(match.description || "") === normalizeText(description));
}

function verifyStructuredItem(section: EditorSection | undefined, title?: string, price?: string, description?: string) {
  if (!section) return false;
  return extractSectionItemCandidates([section]).some((item) => {
    const record = item.item;
    return (!title || normalizeText(item.title) === normalizeText(title))
      && (!price || normalizeText(readString(record, "price")) === normalizeText(price))
      && (!description || normalizeText(readString(record, "description")) === normalizeText(description));
  });
}

function buildSuccessMessage(itemTitle: string, changes: Record<string, string>) {
  const updates: string[] = [];
  if (changes.title) updates.push(`renamed to ${changes.title}`);
  if (changes.price) updates.push(`priced at ${changes.price}`);
  if (changes.description) updates.push("updated description");
  const suffix = updates.length > 0 ? ` ${updates.join(" and ")}` : "";
  return `I updated ${itemTitle}${suffix}, and the change is now visible in the editor.`;
}

function makeFooterLine(doc: Document, text: string) {
  const paragraph = doc.createElement("p");
  paragraph.textContent = text;
  paragraph.style.cssText = "margin-top:8px;color:inherit;";
  return paragraph;
}

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

function findMenuSection(doc: Document) {
  return (doc.querySelector("#menu") || findSectionByHeading(doc, "menu")) as HTMLElement | null;
}

function findSectionByHeading(doc: Document, sectionName: string) {
  const normalized = normalizeText(sectionName);
  if (!normalized) return null;
  return Array.from(doc.querySelectorAll("section, footer, nav, header")).find((section) => {
    const heading = section.querySelector("h1, h2, h3, h4")?.textContent || "";
    const id = (section as HTMLElement).id || "";
    return normalizeText(heading).includes(normalized) || normalizeText(id).includes(normalized);
  }) as HTMLElement | null;
}

function findPriceElement(scope: HTMLElement) {
  return Array.from(scope.querySelectorAll("span, strong, p, div"))
    .map((entry) => entry as HTMLElement)
    .find((entry) => PRICE_PATTERN.test((entry.textContent || "").trim()));
}

function findTargetSection(sections: EditorSection[], sectionName: string) {
  const normalized = normalizeText(sectionName);
  if (!normalized) return sections.find((section) => section.core_slot === "hero") || sections[0] || null;
  return sections.find((section) =>
    normalizeText(section.section_type).includes(normalized)
    || normalizeText(section.core_slot || "").includes(normalized)
    || normalizeText(JSON.stringify(section.schema || {})).includes(normalized),
  ) || null;
}

function readString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? String(record[key]) : "";
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getAtPath(value: unknown, path: Array<string | number>): unknown {
  let cursor = value as any;
  for (const key of path) {
    if (cursor == null) return undefined;
    cursor = cursor[key as any];
  }
  return cursor;
}

function tryParseJson(raw: string) {
  try {
    return JSON.parse(raw.trim()) as Record<string, unknown>;
  } catch {
    return null;
  }
}