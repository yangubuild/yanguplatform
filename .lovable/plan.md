

## Changes (3 files)

### 1. `InnerPageSidebar.tsx` — Strip to 7 items only

- Remove `PINNED_ITEMS` array (lines 28-32) and its rendered section (lines 83-102)
- Remove "All tools" section (lines 104-129)
- Remove "Apps" section (lines 131-143)
- Remove bottom "Developer" + "Settings" buttons and their wrapper (lines 166-182)
- Remove unused imports: `ShoppingBag`, `LinkIcon`, `FileText`, `LayoutGrid`, `MoreHorizontal`, `Code`, `Settings`
- Keep: "Preview as Admin" header, 6 NAV_ITEMS, Chat section

### 2. `ProfileWorkspace.tsx` — Composer into scroll flow + tab fix

- Change `"KYC"` to `"Chats"` in TABS array (line 16)
- Move the composer bar (lines 189-213) from outside the scrollable div to inside it, after the Products section (before the closing `</div>` of the scrollable area at line 187)
- Remove `shrink-0` from the composer div
- Remove `borderTop` from the composer (it's now inline content, not a footer)
- Keep `flex flex-col h-full` on root wrapper unchanged

### 3. `DashboardHome.tsx` — Grid proportions + scroll fix + partition

- Change grid columns from `280px 1fr 360px` to `220px 1fr 320px`
- Remove `overflow-y-auto` from center column cell (line 37) — scrolling handled inside ProfileWorkspace
- Remove `overflow-y-auto` from left and right column cells — they should not scroll
- Add `borderLeft: "1px solid rgba(255,255,255,0.08)"` on the inner page sidebar cell to visually separate it from the global sidebar

