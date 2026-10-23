# iOS app (App Store)

The iOS app is a native shell ([Capacitor](https://capacitorjs.com) 8) around the deployed web app.
The menu reader, maps and affiliate links need the server's API routes, so the app's WebView loads
the production site. Only `native/www/offline.html` ships inside the app, shown when there's no
connection.

```
capacitor.config.ts        app id, name, server URL (CAP_SERVER_URL), user agent suffix
ios/App/                   Xcode project (Swift Package Manager, no CocoaPods)
ios/App/App/Info.plist     permission texts, iPhone-only portrait, app schemes (alipays, weixin, iosamap, diditaxi)
native/www/offline.html    no-connection page (6 languages)
native/make-icon.swift     renders native/assets/icon-1024.png (the App Store icon)
```

The web app can tell it's inside the iOS app: the user agent ends with `ChinaTravelBuddy-iOS`.

## Run in the simulator

```bash
npm run dev                  # web app on localhost:3000
npx cap sync ios             # without CAP_SERVER_URL the app loads http://localhost:3000
npx cap open ios             # then ▶ in Xcode
```

## Release build

1. Deploy the web app to its own HTTPS domain (not `*.vercel.app`, which is often blocked in mainland China).
2. Point the app at it and copy the config into the Xcode project:
   ```bash
   CAP_SERVER_URL=https://your-domain.example npx cap sync ios
   ```
3. In Xcode (`npx cap open ios`) → target **App** → Signing & Capabilities: choose your team. The bundle id
   is `com.chinatravelbuddy.app`; change it there and in `capacitor.config.ts` (or set `CAP_APP_ID`) if you
   register a different one.
4. Bump **Version** (`MARKETING_VERSION`) and **Build** (`CURRENT_PROJECT_VERSION`) for each upload.
5. Product → Archive → Distribute App → App Store Connect.

## App Store Connect checklist

- **Privacy policy URL** (required). Say what leaves the phone: menu photos and typed dish names go to the
  AI service and are discarded after reading; search terms and coordinates go to Amap; anonymous usage
  events; no accounts. Allergies and trip dates stay on the phone.
- **App Privacy** ("nutrition label"): Usage Data → Product Interaction (anonymous, not linked to the user,
  not used for tracking). Photos are processed, not collected. No tracking, so no ATT prompt.
- **Review notes**: the app works without signing in. Mention that it opens Alipay, WeChat, Amap and DiDi
  if installed, and that bookings open Trip.com in Safari (affiliate links).
- **Screenshots**: 6.9" iPhone (1320 × 2868) at least; iPhone only, so no iPad screenshots.
- **Availability**: exclude the China mainland storefront for now. Apps there need an MIIT app filing
  (APP 备案) and the AI features need generative-AI compliance; travellers use their home-country App Store.
- **Guideline 4.2 (minimum functionality)**: shells around websites get rejected when they feel like a web
  page. Before submitting, check on a real iPhone that the camera, location, Alipay/WeChat/Amap hand-offs and
  the offline page work, and that no screen shows browser-like UI (e.g. "add to home screen" hints).
