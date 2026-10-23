import type { CapacitorConfig } from "@capacitor/cli";

// iOS app (App Store). The app is a native shell around the deployed web app: the API routes
// (menu reader, maps, affiliate redirects) need the server, so the WebView loads CAP_SERVER_URL.
// Set it to the production domain before `npx cap sync ios` for a release build; without it the
// shell points at the local dev server (simulator testing). See native/README.md.
const url = process.env.CAP_SERVER_URL || "http://localhost:3000";

const config: CapacitorConfig = {
  appId: process.env.CAP_APP_ID || "com.chinatravelbuddy.app",
  appName: "China Travel Buddy",
  // Only the offline page is bundled; everything else comes from the server.
  webDir: "native/www",
  backgroundColor: "#f7f8fb",
  // Lets the web app tell it's inside the iOS app (e.g. hide "add to home screen" hints).
  appendUserAgent: "ChinaTravelBuddy-iOS",
  server: {
    url,
    cleartext: url.startsWith("http://"),
    errorPath: "offline.html",
  },
  ios: {
    // The web app handles safe areas itself (viewport-fit=cover + env(safe-area-inset-*)).
    contentInset: "never",
    scheme: "China Travel Buddy",
  },
};

export default config;
