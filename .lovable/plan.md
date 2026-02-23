

## Global Font System: Lufga as Platform Font

### Overview
Copy all 18 Lufga font files into the project, register them with `@font-face` declarations, and update the design system so every element inherits Lufga automatically.

### Steps

**1. Copy all 18 font files to `public/fonts/`**

Copy each uploaded `.otf` file into `public/fonts/` so they can be referenced in CSS:
- Lufga-Thin.otf, Lufga-ThinItalic.otf
- Lufga-ExtraLight.otf, Lufga-ExtraLightItalic.otf
- Lufga-Light.otf, Lufga-LightItalic.otf
- Lufga-Regular.otf, Lufga-Italic.otf
- Lufga-Medium.otf, Lufga-MediumItalic.otf
- Lufga-SemiBold.otf, Lufga-SemiBoldItalic.otf
- Lufga-Bold.otf, Lufga-BoldItalic.otf
- Lufga-ExtraBold.otf, Lufga-ExtraBoldItalic.otf
- Lufga-Black.otf, Lufga-BlackItalic.otf

**2. Update `src/index.css`**

- Remove the Google Fonts import for Inter and JetBrains Mono (line 1).
- Add 18 `@font-face` blocks mapping each file to the correct weight (100-900) and style (normal/italic).
- No other CSS changes.

**3. Update `tailwind.config.ts`**

- Set `fontFamily.sans` to `["Lufga", "system-ui", "sans-serif"]`.
- Set `fontFamily.display` to `["Lufga", "system-ui", "sans-serif"]`.
- Keep `fontFamily.mono` as-is (JetBrains Mono fallback is fine for code blocks).

**4. Remove Lufga from Fontshare CDN**

- Remove the Fontshare `<link>` tag in `index.html` (line 6) since we now self-host the fonts.

### What stays the same
- All spacing, font sizes, colors, weights, and component structure remain untouched.
- Only the font-family source changes from Inter/CDN-Lufga to self-hosted Lufga.

### Technical details

Font registration example (repeated for all 18 variants):
```css
@font-face {
  font-family: "Lufga";
  src: url("/fonts/Lufga-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Tailwind config change:
```ts
fontFamily: {
  sans: ["Lufga", "system-ui", "sans-serif"],
  display: ["Lufga", "system-ui", "sans-serif"],
  mono: ["JetBrains Mono", "monospace"],
},
```

