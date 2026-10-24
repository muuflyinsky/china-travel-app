# App Store Connect: what to enter

Copy these into App Store Connect → your app. Limits are Apple's; every field below fits.

## App information

| Field | Value |
|---|---|
| Name (30) | Haodego: China Travel Buddy |
| Subtitle (30) | Menus, taxis & pay in China |
| Bundle ID | com.haodego.app |
| SKU | haodego-ios-1 |
| Primary language | English (U.S.) |
| Category | Travel · secondary: Food & Drink |
| Content rights | Does not contain third-party content that needs rights (map data and photos come from Amap's API with attribution) |
| Age rating | Answer "None" to every question → 4+ |
| Price | Free |
| Availability | All countries **except China mainland** (needs MIIT app filing / APP 备案 and generative-AI compliance first) |

## URLs

| Field | Value |
|---|---|
| Privacy policy URL | https://haodego.com/privacy |
| Support URL | https://haodego.com/support |
| Marketing URL | https://haodego.com |

## Version 1.0

**Promotional text (170)**
Point your camera at a Chinese menu and see what each dish is, whether it's safe for your allergies, and how to order it.

**Description (4000)**
```
Haodego helps you eat, get around and pay in mainland China, in your language.

READ ANY MENU
Take a photo of a printed or handwritten menu, or type dish names. Each dish shows up in seconds with its name in your language, pinyin and price, and one clear answer: OK for you, ask first, or don't order, with the reason.
• Checks every dish against your allergies and diet (peanuts, shellfish, gluten, vegetarian, halal and more)
• Severe allergy as a main ingredient? The dish can't be added to your order
• Tap a dish for its usual ingredients, literal meaning and what to watch out for
• Show the waiter a large Chinese order card: dishes, quantities and "please leave out…", with one-tap replies they can answer

GET AROUND
• Search sights, hotels, stations and addresses in any city, in English, pinyin or Chinese
• Metro and bus routes with fares, station names in pinyin and Chinese, and a taxi estimate
• Taxi card in large Chinese for the driver, and one tap to Amap or DiDi
• Browse museums, temples, parks, night views, food and shopping, best rated first

PAY AND PREPARE
• Open your Alipay pay code in one tap; step-by-step WeChat Pay help
• Price converter with the foreign-card fee
• Visa-free checker and a stay countdown that warns you before your legal limit
• Apps to install, eSIM options and ticket-release alarms for sights that need booking

TALK
• Two-way translation with voice and pinyin, and a phrasebook for taxis, restaurants and pharmacies
• Emergency numbers and an "I need help" card

Your allergies, trip dates and hotel stay on your phone. No account, no ads.

Ingredients are inferred from common recipes. With a severe allergy, always show your allergy card and confirm with staff.
```

**Keywords (100)**
`china,travel,menu,translate,allergy,alipay,wechat pay,didi,metro,beijing,shanghai,visa free,chinese`

**What's New**: First release.

**Copyright**: 2026 Haodego

## App Review information

- Sign-in required: **No**
- Contact: your name, phone, support@haodego.com
- Notes:
```
No account is needed.

To try the main feature without being in China: Eat tab → "Type names" → enter 宫保鸡丁 and 麻婆豆腐 → "Look up dishes". Dishes appear one by one with a verdict. Settings → Allergies → Peanuts (severe) changes the verdict for Kung Pao Chicken to "Don't order", with no add button.

Explore works for any Chinese city (pick one with "Other city"); routes need location or a saved hotel, so outside China use search and the taxi card.

The app opens Alipay, WeChat, Amap and DiDi when they are installed (App Store page otherwise). Hotel, train, ticket and eSIM links open the partner's site in Safari; these are affiliate links and are disclosed in Settings → How we make money.

The camera is used to read menus and hotel booking screenshots; location to find the city, nearby places and routes; the microphone and speech recognition for voice translation.
```

## App Privacy ("nutrition label")

Answer **Yes, we collect data**, then declare these. For each: *not linked to the user's identity*, *not used for tracking*.

| Data type | Purpose | Why |
|---|---|---|
| Location → Precise location | App Functionality | Sent through our server to Amap to find the city, nearby places and routes (not stored by us) |
| User Content → Photos or Videos | App Functionality | Menu photos and booking screenshots are sent to the AI service to be read, then discarded |
| User Content → Other User Content | App Functionality | Dish names and text typed for translation go to the AI service |
| Usage Data → Product Interaction | Analytics | Anonymous events with a per-session random id (lib/track.ts) |

Not collected: contact info, health data (allergies never leave the phone), identifiers, purchases, financial info, browsing history, diagnostics.

Declaring location and photos is the conservative choice: Apple exempts data that is only processed in real time and not retained, but the map and AI providers are third parties whose retention we don't control.

## Screenshots

Required: 6.9" iPhone (1320 × 2868 portrait). Taken from the iPhone 18 Pro Max simulator. Suggested order:
1. Eat: menu results with verdicts
2. Dish detail sheet
3. Order card for the waiter (Chinese)
4. Explore: route with metro steps and taxi estimate
5. Today in China (menu, driver, pay, today)
6. Talk / phrasebook

## Export compliance

Already answered in the build: `ITSAppUsesNonExemptEncryption = false` (only standard HTTPS).
