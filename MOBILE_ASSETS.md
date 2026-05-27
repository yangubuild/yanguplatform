# Native Icons & Splash Screens

Place a 1024×1024 master icon at `resources/icon.png` and a 2732×2732
splash at `resources/splash.png` (and `resources/splash-dark.png` for dark
mode), then run:

```bash
npx @capacitor/assets generate \
  --iconBackgroundColor '#08120D' \
  --splashBackgroundColor '#08120D'
```

This regenerates every required iOS and Android icon/splash variant.
Run on the Mac/dev machine after `npx cap add ios` / `npx cap add android`,
then `npx cap sync`.