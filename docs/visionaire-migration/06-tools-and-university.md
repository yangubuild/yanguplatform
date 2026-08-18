# Visionaire — Tools & Digital Product University (M)

## AI tools

All three share one edge function, `supabase/functions/visionaire-llm/index.ts`:
- Auth-gated by `requireUser()` from `../_shared/require-auth.ts`; CORS handled inline.
- Model: `google/gemini-3-flash-preview` via `https://ai.gateway.lovable.dev/v1/chat/completions`, `LOVABLE_API_KEY`, non-streaming. Explicit 429 and 402 handling.
- System prompts are keyed by `toolKey`:
  - `product_descriptions` — "world-class digital product copywriter": headline, subheadline, 3–5 benefit bullets, CTA.
  - `product_ideas` — "digital product strategist": product name, format, target audience, price range, one-line pitch.
  - `book_title_generator` — "bestselling book title creator": main title + subtitle options.
  - Anything else falls back to a generic assistant prompt.
- Frontend: each tool page builds the prompt from its form, calls `supabase.functions.invoke('visionaire-llm')`, renders the text, and persists via `useSaveToolRun()` → `visionaire_tool_runs`; history via `useToolRuns(toolKey)` (last 20).
- **Copy verbatim.** The only change needed in the new project is that `LOVABLE_API_KEY` is provisioned automatically when Lovable Cloud + AI is enabled.

## PDF Rebrander

`src/pages/dashboard/visionaire/PDFRebrander.tsx`, client-side only:
1. File picker accepts `application/pdf`.
2. Uploads to `visionaire-uploads` at `{user_id}/{timestamp}-{filename}` (requires auth).
3. Form: title, subtitle, optional logo image.
4. Lines 43–75: draws a gradient background + logo + text onto a `<canvas>` and downloads `branded-cover.png`.

Honest assessment: it does not rebrand a PDF. It generates a cover image. In the independent project either rename it "Cover Generator" or implement real PDF manipulation (`pdf-lib` client-side, or a server function) — the latter is a genuine build, not a copy.

## Digital Product University

Fully static — no database, no `learning_*` tables, no progress persistence.

- Track metadata: `src/data/university/masterclass-courses.ts` — **7 tracks**, all `comingSoon: false`: `how-to-use-master-library`, `online-business-master-plan`, `funnel-guide`, `platforms-guide`, `pricing-guide`, `copywriting-guide`, `visuals-guide`.
- Lesson bodies: `src/data/university/course-content/course-1..7-content.tsx` (React nodes, ~182 KB total) exposed through `course-content/index.ts` as `COURSE_CONTENT_MAP: Record<number, LessonContent[]>` where `LessonContent = { title, readTime?, content: React.ReactNode }`.
- Extra data: `master-library-lessons.tsx`, `visionaire-library.json` (150 catalog entries used for library-guide content).
- Pages: `DigitalProductUniversity.tsx` (hub grid) → `UniversityCourseDetail.tsx` (lesson list) → `UniversityLessonViewer.tsx` (prev/next navigation, local completion state only).
- Header art comes from `src/assets/university/*` and course icons from `src/assets/university/courses/*`.

Migration: copy the entire `src/data/university/` tree and the three page components verbatim. Moving lesson content into the database is a deliberate later project — the content is JSX with embedded components, not plain markdown, so it cannot be dumped into a text column without a rewrite.

## Evergreen Problems

`src/data/evergreen-problems.json` — 27 records, rendered by `EvergreenProblems.tsx` and `EvergreenProblemDetail.tsx` (slug-routed). Fully static; copy verbatim.

## Book Cover Templates & Completed Products

- `BookCoverTemplates.tsx` generates 120 tile URLs against `entrepedia-products.com` (`Cover-1`…`Cover-120`) — no DB rows.
- `src/components/visionaire/CompletedProducts.tsx` holds a hardcoded array with `entrepedia-products.com` cover links.
Both must be re-hosted before the third-party host is a problem; see the risk table in `00-executive-summary.md`.
