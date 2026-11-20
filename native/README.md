# iOS app (App Store)

The iOS app, **HaodeGo** (`com.haodego.app`), is a native shell ([Capacitor](https://capacitorjs.com) 8) around the web app at https://haodego.com.
What to enter in App Store Connect (name, description, keywords, privacy label, review notes): [app-store.md](app-store.md).
The menu reader, maps and affiliate links need the server's API routes, so the app's WebView loads
the production site. Only `native/www/offline.html` ships inside the app, shown when there's no
connection.

```
capacitor.config.ts        app id, name, server URL (https://haodego.com; CAP_SERVER_URL overrides), start path /app (1.1), user agent suffix
ios/App/                   Xcode project (Swift Package Manager, no CocoaPods)
ios/App/App/Info.plist     permission texts (camera, photos, location), iPhone-only portrait, app schemes (alipays, weixin, iosamap, diditaxi)
native/www/offline.html    no-connection page (6 languages); from 1.1 it shows the saved hotel as a taxi card,
                           read from native storage (@capacitor/preferences key "offlineHotel", written by lib/offline-hotel.ts)
native/www/app/index.html  never shown: Capacitor iOS exits at launch unless the start path (/app) exists in the bundle,
                           even though the page itself comes from the server
native/assets/icon-1024.png  App Store icon: logo v3.1, copied from the workspace brand kit (haodego-brand-kit-v3.1/app-icon.png;
                           1024 px, opaque, square corners); the same file is ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
ios/App/App/PassesPlugin.swift   trip passes and tips (StoreKit 2), for lib/passes.ts
ios/App/App/ReviewPlugin.swift   App Store rating prompt, for lib/review.ts (from 1.1)
ios/App/App/PrivacyInfo.xcprivacy  the app's privacy manifest: keep it in step with the App Privacy label in app-store.md
```

The web app can tell it's inside the iOS app: the user agent ends with `ChinaTravelBuddy-iOS`.

Location inside the app goes through the native `@capacitor/geolocation` plugin (`lib/location.ts` calls it
via the injected `window.Capacitor` bridge; the website uses the browser API). That way iOS asks once with
the Info.plist text, and WebKit's "this website would like to use your location" prompt never appears, which
App Review would read as a web wrapper. New native plugins need `npx cap sync ios` and a new app build.

## Run in the simulator

```bash
npm run dev                  # web app on localhost:3000
CAP_SERVER_URL=http://localhost:3000 npx cap sync ios   # point the app at the dev server
npx cap open ios             # then ▶ in Xcode
```

## Release build

1. `https://haodego.com` must serve the web app (Vercel → Domains; Cloudflare DNS records set to "DNS only").
2. Copy the production config into the Xcode project (undoes any `CAP_SERVER_URL` used for testing):
   ```bash
   npx cap sync ios
   ```
3. In Xcode (`npx cap open ios`) → target **App** → Signing & Capabilities: choose your team. The bundle id
   `com.haodego.app` must match the app record in App Store Connect.
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
