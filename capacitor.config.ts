import type { CapacitorConfig } from "@capacitor/cli";

// iOS app (App Store). The app is a native shell around the deployed web app: the API routes
// (menu reader, maps, affiliate redirects) need the server, so the WebView loads the production
// site. For simulator testing against the local dev server:
//   CAP_SERVER_URL=http://localhost:3000 npx cap sync ios
// and run `npx cap sync ios` again (without it) before archiving. See native/README.md.
const url = process.env.CAP_SERVER_URL || "https://haodego.com";

const config: CapacitorConfig = {
  appId: "com.haodego.app",
  // Home-screen name; the App Store name ("Haodego: China Travel Buddy") is set in App Store Connect.
  appName: "Haodego",
  // Only the offline page is bundled; everything else comes from the server.
  webDir: "native/www",
  backgroundColor: "#f7f8fb",
  // Lets the web app tell it's inside the iOS app (e.g. hide "add to home screen" hints).
  appendUserAgent: "ChinaTravelBuddy-iOS",
  server: {
    url,
    cleartext: url.startsWith("http://"),
    errorPath: "offline.html",
    // Both hosts stay inside the app (Vercel may redirect one to the other); anything else,
    // such as partner booking sites, opens in Safari.
    allowNavigation: ["haodego.com", "www.haodego.com"],
  },
  ios: {
    // The web app handles safe areas itself (viewport-fit=cover + env(safe-area-inset-*)).
    contentInset: "never",
    scheme: "China Travel Buddy",
  },
};

export default config;
