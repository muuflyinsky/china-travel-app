import type { TopicContent } from "../types";

// Imported from the research draft: 24 of 32 facts checked against the fetched
// source pages on 2026-11-11. Facts without `checked` are drafts (preview builds only); their
// `note` says why. Gaps the research couldn't source: see the workspace inbox note.
export const payment: TopicContent = {
  "checked": "2026-11-11",
  "appPath": "/#pay",
  "sources": {
    "s1": {
      "title": "China to raise single mobile transaction limit to 5,000 USD for overseas travelers",
      "publisher": "State Council (english.www.gov.cn), Xinhua report",
      "url": "https://english.www.gov.cn/news/202403/01/content_WS65e1dacdc6d0868f4e8e487b.html",
      "published": "2024-03-01",
      "kind": "official"
    },
    "s2": {
      "title": "Mobile pay limits raised for visitors",
      "publisher": "China Daily",
      "url": "https://www.chinadaily.com.cn/a/202403/02/WS65e26803a31082fc043ba22f.html",
      "published": "2024-03-02",
      "kind": "media"
    },
    "s3": {
      "title": "Using foreign bank cards for mobile payments in China",
      "publisher": "China Daily (govt channel)",
      "url": "https://govt.chinadaily.com.cn/s/202502/25/WS67bd6c5a498eec7e1f730389/using-foreign-bank-cards-for-mobile-payments-in-china.html",
      "published": "2025-02-25",
      "kind": "media"
    },
    "s4": {
      "title": "Pay with overseas bank cards",
      "publisher": "Shanghai Municipal People's Government (english.shanghai.gov.cn)",
      "url": "https://english.shanghai.gov.cn/en-Individuals-BankingandPayments-Payments/20260921/c2c94d06a0454c8fa05386b80d0ae865.html",
      "published": "2026-09-21",
      "kind": "official"
    },
    "s5": {
      "title": "WeChat Pay Waives 3 Percent Transaction Fees for International Card Payments Under 200 Yuan",
      "publisher": "Beijing Municipal People's Government (english.beijing.gov.cn)",
      "url": "https://english.beijing.gov.cn/travellinginbeijing/essentials/inboundtourismfacilitationmeasures/202603/t20260326_4566766.html",
      "published": "2026-03-26",
      "kind": "official"
    },
    "s6": {
      "title": "Overseas Bank Cards Accepted by Weixin Pay and Alipay",
      "publisher": "Beijing Chaoyang District Government",
      "url": "https://english.bjchy.gov.cn/overseas-bank-cards-accepted-weixin-pay-and-alipay",
      "kind": "official"
    },
    "s7": {
      "title": "Alipay ID (KYC document examples)",
      "publisher": "Alipay",
      "url": "https://intl.alipay.com/help/exampleKYC.htm",
      "kind": "official"
    },
    "s8": {
      "title": "Announcement No. 10 [2018] of the People's Bank of China on Cracking down on the Act of Refusing to Accept Cash Payment",
      "publisher": "People's Bank of China",
      "url": "https://www.pbc.gov.cn/en/3688241/3688663/3688669/2025092319420195711/index.html",
      "published": "2018 (English page reposted 2025)",
      "kind": "official"
    },
    "s9": {
      "title": "Opinions of the General Office of the State Council on Further Optimizing Payment Services to Facilitate Payments (PDF)",
      "publisher": "People's Bank of China / State Council General Office",
      "url": "https://www.pbc.gov.cn/en/3688253/3689006/2025080817514424531/2024032216572428952.pdf",
      "published": "2024-03-07",
      "kind": "official"
    },
    "s10": {
      "title": "SCIO Holds Policy Briefing on Further Optimizing Payment Services to Facilitate Payments",
      "publisher": "People's Bank of China",
      "url": "https://www.pbc.gov.cn/en/3688241/3688663/3688666/2025080817504215799/index.html",
      "published": "2024-03 (briefing); page date unclear",
      "kind": "official"
    },
    "s11": {
      "title": "PBC Penalty for Refusal to Accept RMB Cash in Q4 2021",
      "publisher": "People's Bank of China",
      "url": "https://www.pbc.gov.cn/en/3688110/3688172/4437084/2025080817504780488/index.html",
      "published": "2022 (Q4 2021 data)",
      "kind": "official"
    },
    "s13": {
      "title": "Convenience of Payment Services for Foreigners in Beijing Significantly Improved",
      "publisher": "Beijing Municipal People's Government",
      "url": "https://english.beijing.gov.cn/livinginbeijing/easyliving/202405/t20240508_3665214.html",
      "published": "2024-05-08",
      "kind": "official"
    },
    "s14": {
      "title": "ATM Dispensing CNY-10 Banknotes Gains Popularity Among Foreigners",
      "publisher": "Beijing Municipal People's Government",
      "url": "https://english.beijing.gov.cn/latest/news/202403/t20240325_3600711.html",
      "published": "2024-03-25",
      "kind": "official"
    },
    "s15": {
      "title": "Beijing metro enables 'tap-and-go' fare payment for foreign MasterCard, Visa card holders",
      "publisher": "Xinhua",
      "url": "https://english.news.cn/20240913/e781d45e34614f89ae4b9e89c2918746/c.html",
      "published": "2024-09-13",
      "kind": "media"
    },
    "s16": {
      "title": "Beijing Subway Introduces Tap-and-Go Payments with Five Major Card Networks",
      "publisher": "Beijing Municipal People's Government",
      "url": "https://english.beijing.gov.cn/travellinginbeijing/essentials/inboundtourismfacilitationmeasures/202603/t20260326_4566767.html",
      "published": "2026-03-26",
      "kind": "official"
    },
    "s17": {
      "title": "Shanghai Metro expands Tap to Ride pilot to entire network",
      "publisher": "Shanghai Municipal People's Government",
      "url": "https://english.shanghai.gov.cn/en-Latest-WhatsNew/20250627/d8f21f2e7d3b45a5b03757e35039b806.html",
      "published": "2025-06-27",
      "kind": "official"
    },
    "s18": {
      "title": "Shanghai taxis to accept foreign bank cards",
      "publisher": "Shanghai Municipal People's Government",
      "url": "https://english.shanghai.gov.cn/en-Latest-WhatsNew/20240415/20606ed2f43c4c86aa44c3df45e82541.html",
      "published": "2024-04-15",
      "kind": "official"
    },
    "s20": {
      "title": "BEIJING PASS Sales Exceed 10,000: A Purchase Guide",
      "publisher": "Beijing Municipal People's Government",
      "url": "https://english.beijing.gov.cn/consuminginbeijing/news/202410/t20241016_3921355.html",
      "published": "2024-10-16",
      "kind": "official"
    },
    "s21": {
      "title": "'Visa - UnionPay Zone for Beijing Central Axis' Officially Launched",
      "publisher": "Beijing Municipal People's Government",
      "url": "https://english.beijing.gov.cn/latest/news/202503/t20250304_4024570.html",
      "published": "2025-03-04",
      "kind": "official"
    },
    "s22": {
      "title": "Demonstration Zones of Payment Service for Overseas Visitors Launched at Two Airports",
      "publisher": "Beijing Municipal Foreign Affairs Office",
      "url": "https://wb.beijing.gov.cn/en/center_for_international_exchanges/information/202404/t20240425_3637560.html",
      "published": "2024-04-25",
      "kind": "official"
    },
    "s23": {
      "title": "Global UnionPay Cards Now Support Weixin Pay and Alipay",
      "publisher": "UnionPay International",
      "url": "https://m.unionpayintl.com/wap/en/mediaCenter/newsCenter/companyNews/3015917.shtml",
      "published": "2024 (exact date not in snippet)",
      "kind": "official"
    },
    "s24": {
      "title": "Payment service guide for overseas visitors to China",
      "publisher": "State Council (english.www.gov.cn)",
      "url": "https://english.www.gov.cn/news/202404/11/content_WS6617c858c6d0868f4e8e5f4d.html",
      "published": "2024-04-11",
      "kind": "official"
    },
    "s25": {
      "title": "RESPONSES (SAFE reply on foreign bank cards)",
      "publisher": "State Council (english.www.gov.cn)",
      "url": "https://english.www.gov.cn/services/202508/26/content_WS5e04749bc6d0554996894a1a.html",
      "published": "2025-08-26",
      "kind": "official"
    },
    "s26": {
      "title": "Xi'an's path as key city for inbound tourism",
      "publisher": "Xi'an Municipal Government (en.xa.gov.cn)",
      "url": "http://en.xa.gov.cn/Business/InvestmentGuide/2092543651300872194.html",
      "published": "2026 (after end-2025; exact date not in snippet)",
      "kind": "official"
    },
    "s27": {
      "title": "Xi'an becomes the new first stop for foreign tourists visiting China",
      "publisher": "Shaanxi Provincial Government",
      "url": "https://en.shaanxi.gov.cn/government/bulletin/202411/t20241106_3147627.html",
      "published": "2024-11-06",
      "kind": "official"
    },
    "s28": {
      "title": "International visitors can now use Chinese payment apps",
      "publisher": "Shaanxi Provincial Government",
      "url": "https://en.shaanxi.gov.cn/if/sczl/202405/t20240508_2328465.html",
      "published": "2024-05-08",
      "kind": "official"
    },
    "s30": {
      "title": "PBOC urges Shanghai financial institutions to improve foreign payment services",
      "publisher": "Shanghai Municipal People's Government",
      "url": "https://english.shanghai.gov.cn/en-Latest-WhatsNew/20240318/00120b1156b54df2a8aaa5e36cffdc84.html",
      "published": "2024-03-18",
      "kind": "official"
    }
  },
  "sections": [
    {
      "key": "mobile-pay",
      "title": {
        "en": "Alipay and WeChat Pay",
        "es": "Alipay y WeChat Pay",
        "fr": "Alipay et WeChat Pay",
        "de": "Alipay und WeChat Pay",
        "ja": "AlipayとWeChat Pay",
        "ko": "알리페이와 위챗페이"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "You can link a foreign bank card (Visa, Mastercard and other major networks) to Alipay or WeChat Pay and pay with it, without opening a Chinese bank account."
          },
          "src": [
            "s4",
            "s6",
            "s24"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "In March 2024 China's central bank had Alipay and WeChat Pay raise foreign visitors' limits from US$1,000 to US$5,000 per payment and from US$10,000 to US$50,000 a year."
          },
          "src": [
            "s1",
            "s2"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "With a foreign card linked to Alipay or WeChat Pay you can pay up to US$5,000 per transaction and US$50,000 a year. Check the app for your account's actual limits."
          },
          "src": [
            "s4",
            "s3"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Payments of 200 yuan or less with a linked foreign card are generally fee-free. Above 200 yuan a 3% fee on the whole amount may apply; check the payment page before confirming."
          },
          "src": [
            "s4",
            "s3",
            "s5"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "WeChat Pay (per a Beijing government notice, March 2026): first-time foreign-card users get the 3% fee waived on payments under 1,000 yuan for 60 days, saving up to 30 yuan per payment; fees are refunded pro rata on refunds."
          },
          "src": [
            "s5"
          ],
          "note": "Promotion; check it is still running. Not live: stale (old source for a price or limit). Time-limited promotion; confirm it is still running before publishing. Held back: Fee waiver is a time-limited promotion; confirm it is still running."
        },
        {
          "applies": "national",
          "text": {
            "en": "You can sign up for WeChat or Alipay with a foreign phone number, as long as it can receive SMS verification codes."
          },
          "src": [
            "s6",
            "s3"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Alipay asks for identity verification with your passport (nationality and passport number, or photos of the passport pages) when you add a card."
          },
          "src": [
            "s7"
          ],
          "note": "Official Alipay help page is undated; exact current flow not confirmed. Not live: no fetched source states it. Not supported for Alipay. s6 does support the WeChat Pay equivalent: 'If you use your passport to verify your identity, you will get a notification asking you to upload a copy of your passport' (documents: passport). Consider rewriting the fact for WeChat Pay citing s6."
        },
        {
          "applies": "national",
          "text": {
            "en": "Since November 2024, UnionPay cards issued outside the Chinese mainland can also be linked to Alipay and WeChat Pay."
          },
          "src": [
            "s23"
          ],
          "checked": "2026-11-11"
        }
      ]
    },
    {
      "key": "cards",
      "title": {
        "en": "Foreign bank cards",
        "es": "Tarjetas bancarias extranjeras",
        "fr": "Cartes bancaires étrangères",
        "de": "Ausländische Bankkarten",
        "ja": "海外の銀行カード",
        "ko": "해외 은행 카드"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "Under an April 2024 rule, tourist hotels rated three stars and up, 4A and 5A attractions, and national and provincial tourist resorts should accept both Chinese and foreign bank cards."
          },
          "src": [
            "s24"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Foreign cards work at terminals showing your card's network logo (UnionPay, Visa, Mastercard, Amex, JCB, Diners Club, Discover). If no logo is shown, ask the cashier."
          },
          "src": [
            "s4"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "China's foreign exchange regulator (SAFE) said in August 2025 that foreign bank cards are still not widely accepted in China, though POS terminals exist at airports, hotels, big malls, scenic spots and major subway stations."
          },
          "src": [
            "s25"
          ],
          "note": "Official caution that contrasts with upbeat city figures; keep a backup payment method. Not live: no fetched source states it. Cautionary claim unverifiable from downloaded text; re-fetch before using."
        }
      ]
    },
    {
      "key": "cash",
      "title": {
        "en": "Cash",
        "es": "Efectivo",
        "fr": "Espèces",
        "de": "Bargeld",
        "ja": "現金",
        "ko": "현금"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "Renminbi cash is legal tender. No business or person may refuse cash, including through notices or terms, and businesses that do can be penalised."
          },
          "src": [
            "s8",
            "s9"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Under 2024 State Council rules, businesses that refuse cash face harsher penalties and public reprimand, and banks must offer small-change kits."
          },
          "src": [
            "s9"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Refusing cash brings real fines: in the last quarter of 2021 the central bank fined 32 businesses between 1,000 and 100,000 yuan."
          },
          "src": [
            "s11"
          ],
          "checked": "2026-11-11"
        }
      ]
    },
    {
      "key": "atm",
      "title": {
        "en": "ATMs",
        "es": "Cajeros automáticos",
        "fr": "Distributeurs",
        "de": "Geldautomaten",
        "ja": "ATM",
        "ko": "ATM"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "China's 2024 payment rules tell banks to upgrade ATMs so foreign visitors can withdraw renminbi with overseas bank cards."
          },
          "src": [
            "s9"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "ATMs showing your card's network logo dispense renminbi; withdrawals are generally capped at 3,000 yuan per transaction, and your own bank may set lower limits."
          },
          "src": [
            "s4"
          ],
          "note": "Not live: stale (old source for a price or limit). Source is Shanghai's page; generalising nationwide is an inference. Held back: ATM limit only stated on a Shanghai page; may not apply nationwide."
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing reported in 2024 about 11,600 machines that let you withdraw cash with overseas cards, and some ICBC ATMs, including at Daxing airport, give out 10-yuan notes."
          },
          "src": [
            "s13",
            "s14"
          ],
          "checked": "2026-11-11"
        }
      ]
    },
    {
      "key": "transport-pay",
      "title": {
        "en": "Paying for the metro and taxis",
        "es": "Pagar el metro y los taxis",
        "fr": "Payer le métro et les taxis",
        "de": "U-Bahn und Taxi bezahlen",
        "ja": "地下鉄とタクシーの支払い",
        "ko": "지하철과 택시 결제"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "Ride-hailing apps such as DiDi and Shouyue have English versions that accept major international cards like Visa and Mastercard."
          },
          "src": [
            "s20"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Since 13 September 2024 you can tap an overseas Visa or Mastercard at every Beijing subway gate, including both airport lines, and pay the same fares as locals."
          },
          "src": [
            "s15"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "As of March 2026, Beijing subway gates, ticket purchases and top-ups accept contactless UnionPay, Visa, Mastercard, JCB and American Express cards; just hold your card to the gate."
          },
          "src": [
            "s16"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing taxis were found refusing cash or lacking change in 2024; the city has since put 'Cash Payment Accepted' signs in taxis and given drivers small-change wallets."
          },
          "src": [
            "s10",
            "s13"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "BEIJING PASS, a prepaid card launched in July 2024, is sold at both Beijing airports, subway and railway stations for 20 yuan (bring your passport) and is used mainly on public transport."
          },
          "src": [
            "s20"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "Since 28 June 2025 you can tap a contactless Visa, Mastercard, Amex, JCB or UnionPay card at any Shanghai Metro gate."
          },
          "src": [
            "s17"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "For Shanghai Metro, turn on small-amount no-PIN payment on your card. Cards with Type-B chips or without ODA are not supported."
          },
          "src": [
            "s17"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "Only some Shanghai taxis with suitable card terminals take overseas cards. The scheme started in April 2024 with Dazhong taxis."
          },
          "src": [
            "s4",
            "s18"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "xian",
          "text": {
            "en": "A Shaanxi government bulletin (Nov 2024) says overseas cards are accepted on Xi'an Metro, at Xianyang Airport and Xi'an Railway Station."
          },
          "src": [
            "s27"
          ],
          "note": "Does not say whether this is gate tap-in or ticket-machine/counter purchase. Unconfirmed. Not live: no fetched source states it."
        }
      ]
    },
    {
      "key": "city-measures",
      "title": {
        "en": "Help for visitors in the city",
        "es": "Ayuda para visitantes en la ciudad",
        "fr": "Aide aux visiteurs sur place",
        "de": "Hilfe für Besucher vor Ort",
        "ja": "市内の旅行者向けサポート",
        "ko": "시내 여행자 지원"
      },
      "facts": [
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing Capital and Daxing airports have payment service areas for foreign visitors, and Beijing said in 2024 that all merchants at both airports accept overseas cards."
          },
          "src": [
            "s22",
            "s13"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Along Beijing's Central Axis, a 'Visa-UnionPay Zone' launched in March 2025 means key businesses take overseas cards and nearby ATMs give cash on foreign cards."
          },
          "src": [
            "s21"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "In March 2024 China's central bank said foreign cards were accepted at more Shanghai airports, train stations, star-rated hotels and major shopping districts."
          },
          "src": [
            "s30"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "xian",
          "text": {
            "en": "By end-2025 Xi'an had over 1,100 foreign-card POS terminals at major sights, shopping districts and tourism venues; all 5A-rated sights accept overseas cards."
          },
          "src": [
            "s26"
          ],
          "note": "Not live: no fetched source states it."
        },
        {
          "applies": "xian",
          "text": {
            "en": "At Xi'an City Wall you can buy tickets and enter its gates with overseas Visa, Mastercard or UnionPay cards."
          },
          "src": [
            "s27"
          ],
          "note": "Not live: no fetched source states it."
        },
        {
          "applies": "xian",
          "text": {
            "en": "Shaanxi has payment service centres at key tourist spots and the airport to help visitors download apps, link cards, change money or withdraw cash."
          },
          "src": [
            "s28",
            "s26"
          ],
          "note": "Not live: no fetched source states it."
        }
      ]
    }
  ]
};
