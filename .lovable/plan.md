

## Route Debug Bar -- Production Safety

Hide the `RouteDebugBar` component in production by gating all render sites on `import.meta.env.DEV`.

### File: `src/components/routing/PublicRouteResolver.tsx`

Three locations render `<RouteDebugBar>`:

1. **~Line 168** (null route fallback): Wrap in `{import.meta.env.DEV && <RouteDebugBar ... />}`
2. **~Line 179** (not_found on production domain): Same conditional wrap
3. **~Line 235** (final return with resolved content): Same conditional wrap

No other files, routes, or layout changes needed. The `RouteDebugBar` function itself stays in the file for future dev use -- it simply won't render when `import.meta.env.DEV` is `false`.

