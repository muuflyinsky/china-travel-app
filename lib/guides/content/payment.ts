import type { TopicContent } from "../types";

// Imported from the research draft (32 facts). Sources were only seen in search results:
// open each one, check the facts that cite it, then set `verified: "YYYY-MM-DD"`. Until then the facts
// show on preview builds only. Gaps the research couldn't source: see the workspace inbox note.
export const payment: TopicContent = {
  "checked": "2026-11-05",
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
    "s12": {
      "title": "China fines KFC and other businesses for rejecting cash payments",
      "publisher": "Caixin Global",
      "url": "https://www.caixinglobal.com/2024-05-15/china-fines-kfc-and-other-businesses-for-rejecting-cash-payments-102196668.html",
      "published": "2024-05-15",
      "kind": "media"
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
    "s19": {
      "title": "Beijing Optimizes Payment Services to Offer More Convenience for Foreign Tourists",
      "publisher": "Beijing Municipal People's Government",
      "url": "https://english.beijing.gov.cn/latest/news/202407/t20240712_3744760.html",
      "published": "2024-07-12",
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
            "en": "Visitors can link a foreign Visa, Mastercard or other international card to Alipay or WeChat Pay and pay without a Chinese bank account."
          },
          "src": [
            "s4",
            "s6",
            "s24"
          ]
        },
        {
          "applies": "national",
          "text": {
            "en": "In March 2024 the central bank had Alipay and Tenpay (WeChat Pay) raise the foreign-visitor cap per payment from US$1,000 to US$5,000 and the yearly cap from US$10,000 to US$50,000."
          },
          "src": [
            "s1",
            "s2"
          ]
        },
        {
          "applies": "national",
          "text": {
            "en": "Shanghai's official payment page (Sept 2026) still lists up to US$5,000 per transaction and up to US$50,000 per year for overseas cards linked to Alipay or WeChat Pay."
          },
          "src": [
            "s4",
            "s3"
          ],
          "note": "Conflict: a Beijing Chaoyang district page (undated) lists RMB 6,000 per transaction, RMB 50,000 per month and RMB 60,000 per year. Possibly an older rule or a different account tier; prefer the USD figures."
        },
        {
          "applies": "national",
          "text": {
            "en": "Paying with a linked foreign card costs nothing up to 200 yuan; above 200 yuan a 3% fee applies, charged on the whole amount, not just the part above 200."
          },
          "src": [
            "s4",
            "s3",
            "s5"
          ],
          "note": "Shanghai page says the fee 'may' apply and is on the full amount. Your card issuer may add its own foreign transaction fee (not in official sources)."
        },
        {
          "applies": "national",
          "text": {
            "en": "WeChat Pay (per a Beijing government notice, March 2026): first-time foreign-card users get the 3% fee waived on payments under 1,000 yuan for 60 days, saving up to 30 yuan per payment; fees are refunded pro rata on refunds."
          },
          "src": [
            "s5"
          ],
          "note": "Promotion; check it is still running."
        },
        {
          "applies": "national",
          "text": {
            "en": "You can sign up with a foreign phone number as long as it receives SMS codes."
          },
          "src": [
            "s6",
            "s24"
          ]
        },
        {
          "applies": "national",
          "text": {
            "en": "Alipay asks for identity verification with your passport (nationality and passport number, or photos of the passport pages) when you add a card."
          },
          "src": [
            "s7"
          ],
          "note": "Official Alipay help page is undated; exact current flow not confirmed."
        },
        {
          "applies": "national",
          "text": {
            "en": "UnionPay cards issued outside the Chinese mainland can also be linked to Alipay and WeChat Pay."
          },
          "src": [
            "s23"
          ]
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
            "en": "A PBOC-led circular says domestic and overseas bank cards should be accepted at three-star-plus hotels and 4A/5A tourist attractions, among other key venues."
          },
          "src": [
            "s24"
          ],
          "note": "Snippet wording; underlying circular is the 2024 payment-services push."
        },
        {
          "applies": "national",
          "text": {
            "en": "Foreign cards work at card terminals showing your card's network logo (UnionPay, Visa, Mastercard, Amex, JCB, Diners, Discover); if no logo shows, ask the cashier."
          },
          "src": [
            "s4"
          ],
          "note": "Source is Shanghai's official page; logo rule is general."
        },
        {
          "applies": "national",
          "text": {
            "en": "China's foreign exchange regulator (SAFE) said in August 2025 that foreign bank cards are still not widely accepted in China, though POS terminals exist at airports, hotels, big malls, scenic spots and major subway stations."
          },
          "src": [
            "s25"
          ],
          "note": "Official caution that contrasts with upbeat city figures; keep a backup payment method."
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
            "en": "Renminbi cash is legal tender: PBOC rules bar any business or person from refusing cash, including via notices or terms; violators can be investigated and fined."
          },
          "src": [
            "s8",
            "s9"
          ]
        },
        {
          "applies": "national",
          "text": {
            "en": "The 2024 State Council payment opinions keep up the crackdown on refusing cash, with heavier penalties and public naming, and ask banks to supply small-denomination change kits."
          },
          "src": [
            "s9"
          ]
        },
        {
          "applies": "national",
          "text": {
            "en": "Fines are real: in Q4 2021 the PBOC penalised 32 businesses with fines of 1,000 to 100,000 yuan; in 2024 it fined a KFC franchise 30,000 yuan for refusing cash."
          },
          "src": [
            "s11",
            "s12"
          ]
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
            "en": "State Council 2024 opinions direct banks to upgrade ATMs so foreign visitors can withdraw renminbi with overseas cards."
          },
          "src": [
            "s9"
          ]
        },
        {
          "applies": "national",
          "text": {
            "en": "ATMs showing your card's network logo dispense renminbi; withdrawals are generally capped at 3,000 yuan per transaction, and your own bank may set lower limits."
          },
          "src": [
            "s4"
          ]
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing reported (2024) about 11,600 self-service machines taking overseas cards for cash, and some ICBC ATMs dispensing 10-yuan notes for Visa/Mastercard holders."
          },
          "src": [
            "s13",
            "s14"
          ],
          "note": "2024 counts; no newer figure found."
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
            "en": "Ride-hailing apps such as DiDi and Shouyue have English versions that accept international Visa and Mastercard cards."
          },
          "src": [
            "s19"
          ]
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing subway gates accept tap-to-pay with overseas Visa and Mastercard on all lines, including both airport expresses, since 13 September 2024; fares match local rates."
          },
          "src": [
            "s15"
          ]
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Since June 2025 Beijing subway also takes JCB and American Express taps; as of March 2026 gates, ticket purchases and top-ups accept UnionPay, Visa, Mastercard, JCB and Amex."
          },
          "src": [
            "s16"
          ]
        },
        {
          "applies": "beijing",
          "text": {
            "en": "A SCIO briefing noted some Beijing taxi drivers would not take cash or lacked change; the city later put 'cash accepted' signs and small-change wallets in taxis."
          },
          "src": [
            "s10",
            "s19"
          ]
        },
        {
          "applies": "beijing",
          "text": {
            "en": "BEIJING PASS, a prepaid card sold at the airports and stations since July 2024, works on buses, rail lines and over 20,000 taxis."
          },
          "src": [
            "s20"
          ]
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "Since 28 June 2025 the whole Shanghai Metro network accepts tap-in with contactless Visa, Mastercard, Amex, JCB and UnionPay cards."
          },
          "src": [
            "s17"
          ]
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "For Shanghai Metro taps, turn on small-amount no-PIN payment on your card; Type-B chip cards and cards without ODA are not supported."
          },
          "src": [
            "s17"
          ]
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "Only some Shanghai taxis with suitable POS terminals take overseas cards; the scheme started in April 2024 with Dazhong taxis."
          },
          "src": [
            "s4",
            "s18"
          ],
          "note": "Current number of equipped taxis unknown."
        },
        {
          "applies": "xian",
          "text": {
            "en": "A Shaanxi government bulletin (Nov 2024) says overseas cards are accepted on Xi'an Metro, at Xianyang Airport and Xi'an Railway Station."
          },
          "src": [
            "s27"
          ],
          "note": "Does not say whether this is gate tap-in or ticket-machine/counter purchase. Unconfirmed."
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
            "en": "Capital and Daxing airports have payment-service demonstration areas and help desks for foreign visitors; Beijing said all airport merchants accept overseas cards."
          },
          "src": [
            "s22",
            "s13"
          ],
          "note": "2024 figures."
        },
        {
          "applies": "beijing",
          "text": {
            "en": "A 'Visa-UnionPay Zone' along the Central Axis (launched March 2025) commits key businesses there to take overseas cards and its ATMs to give cash on foreign cards."
          },
          "src": [
            "s21"
          ]
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "The PBOC said in March 2024 that foreign cards were accepted at Shanghai airports, train stations, star-rated hotels and major shopping districts."
          },
          "src": [
            "s30"
          ]
        },
        {
          "applies": "xian",
          "text": {
            "en": "By end-2025 Xi'an had over 1,100 foreign-card POS terminals at major sights, shopping districts and tourism venues; all 5A-rated sights accept overseas cards."
          },
          "src": [
            "s26"
          ]
        },
        {
          "applies": "xian",
          "text": {
            "en": "At Xi'an City Wall you can buy tickets and enter its gates with overseas Visa, Mastercard or UnionPay cards."
          },
          "src": [
            "s27"
          ]
        },
        {
          "applies": "xian",
          "text": {
            "en": "Shaanxi has payment service centres at key tourist spots and the airport to help visitors download apps, link cards, change money or withdraw cash."
          },
          "src": [
            "s28",
            "s26"
          ]
        }
      ]
    }
  ]
};
