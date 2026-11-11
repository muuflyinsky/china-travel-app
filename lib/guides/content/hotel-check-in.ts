import type { TopicContent } from "../types";

// Imported from the research draft: 21 of 26 facts checked against the fetched
// source pages on 2026-11-11. Facts without `checked` are drafts (preview builds only); their
// `note` says why. Gaps the research couldn't source: see the workspace inbox note.
export const hotelCheckIn: TopicContent = {
  "checked": "2026-11-11",
  "appPath": "/stay",
  "sources": {
    "s1": {
      "title": "Regulations on filing accommodation registration for foreigners (NIA English page, Exit and Entry Administration Law art. 39 / art. 76)",
      "publisher": "National Immigration Administration",
      "url": "https://en.nia.gov.cn/n167/n247/n10178/c68246/content.html",
      "kind": "official"
    },
    "s2": {
      "title": "As a visa-exempt visitor, do I need to register accommodation upon entering China?",
      "publisher": "Shanghai Municipal People's Government (english.shanghai.gov.cn)",
      "url": "https://english.shanghai.gov.cn/en-Visa2/20250814/0a5c4552fc6f4c10a95e9e6207451035.html",
      "published": "2025-08-14",
      "kind": "official"
    },
    "s3": {
      "title": "Procedures for the Accommodation Registration of Overseas Personnel",
      "publisher": "Shanghai Municipal People's Government (english.shanghai.gov.cn)",
      "url": "https://english.shanghai.gov.cn/en-Bulletin/20250728/272abda1e8ac4217a566b4d969b43548.html",
      "published": "2025-07-28",
      "kind": "official"
    },
    "s4": {
      "title": "Accommodation registration (online services)",
      "publisher": "Shanghai Municipal People's Government (english.shanghai.gov.cn)",
      "url": "https://english.shanghai.gov.cn/en-OnlineServices/20231210/6f0c6f35a9fd482cb4dacaa25b28c339.html",
      "published": "2023-12-10",
      "kind": "official"
    },
    "s5": {
      "title": "How can foreign visitors register for temporary accommodation?",
      "publisher": "Shanghai Municipal People's Government (english.shanghai.gov.cn)",
      "url": "https://english.shanghai.gov.cn/en-FAQs-TravelinShanghai/20231225/ae178747b46741f8857f6f93ba8c4a6c.html",
      "published": "2023-12-25",
      "kind": "official"
    },
    "s6": {
      "title": "Hotels told not to turn away foreign guests",
      "publisher": "Shanghai Municipal People's Government (repost of China Daily)",
      "url": "https://english.shanghai.gov.cn/en-Latest-WhatsNew/20240529/6ff842313deb45e1b14cf5fd2a01d065.html",
      "published": "2024-05-29",
      "kind": "official"
    },
    "s10": {
      "title": "Online accommodation registration pilot for foreigners staying outside hotels (Visit China service page)",
      "publisher": "State Council (english.www.gov.cn)",
      "url": "https://english.www.gov.cn/services/visitchina/202603/21/content_WS69ce1384c6d00ca5f9a0a36d.html",
      "published": "2026-03-21",
      "kind": "official"
    },
    "s12": {
      "title": "How can foreigners register accommodation in Beijing (12345 hotline FAQ)",
      "publisher": "Beijing Municipal People's Government (english.beijing.gov.cn)",
      "url": "https://english.beijing.gov.cn/12345hotline/faqs/all/202507/t20250722_4155054.html",
      "published": "2025-07-22",
      "kind": "official"
    },
    "s13": {
      "title": "Service guide for foreigners in Beijing: accommodation registration",
      "publisher": "Beijing Municipal People's Government (english.beijing.gov.cn)",
      "url": "https://english.beijing.gov.cn/specials/serviceguideforforeignersinbeijing/202505/t20250514_4088768.html",
      "published": "2025-05-14",
      "kind": "official"
    },
    "s14": {
      "title": "Do I need to register with the police if I'm staying at a hotel, or does that rule only apply if I'm staying with friends?",
      "publisher": "China Daily government services portal (govt.chinadaily.com.cn)",
      "url": "https://govt.chinadaily.com.cn/s/202601/23/WS6973287c498e23165e06d00b/do-i-need-to-register-with-the-police-if-im-staying-at-a-hotel-or-does-that-rule-only-apply-if-im-staying-with-friends.html",
      "published": "2026-01-23",
      "kind": "media"
    },
    "s16": {
      "title": "China enhances payment services at key tourism sites",
      "publisher": "China Daily government services portal (govt.chinadaily.com.cn)",
      "url": "https://govt.chinadaily.com.cn/s/202404/10/WS66267634498ed2d7b7eac4e5/china-enhances-payment-services-at-key-tourism-sites.html",
      "published": "2024-04-10",
      "kind": "media"
    },
    "s18": {
      "title": "Payments made easier for foreign visitors, expats",
      "publisher": "China Daily government services portal (govt.chinadaily.com.cn)",
      "url": "https://govt.chinadaily.com.cn/s/202405/13/WS664bf4d6498ed2d7b7eae193/payments-made-easier-for-foreign-visitors-expats_2.html",
      "published": "2024-05-13",
      "kind": "media"
    }
  },
  "sections": [
    {
      "key": "rule",
      "title": {
        "en": "The rule",
        "es": "La norma",
        "fr": "La règle",
        "de": "Die Regel",
        "ja": "規則",
        "ko": "규정"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "If you stay in a hotel, the front desk registers you and sends your details to the local police. You don't need to register separately."
          },
          "src": [
            "s14",
            "s2",
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "If you stay anywhere other than a hotel, such as a friend's home or a rented flat, you or your host must register with the local police within 24 hours of arriving."
          },
          "src": [
            "s2",
            "s14"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Missing the non-hotel registration can bring a police warning and a fine of up to CNY 2,000 (Exit and Entry Administration Law, Article 76)."
          },
          "src": [
            "s1"
          ],
          "note": "Not live: no fetched source states it. Only source (NIA page) could not be fetched; the CNY 2,000 fine under Article 76 is unverified. s12 only says late registration 'is subject to penalties' (Beijing)."
        },
        {
          "applies": "national",
          "text": {
            "en": "Hotels that fail to report foreign guests are penalised under the Public Security Administration Punishments Law. The penalty falls on the hotel, not the guest."
          },
          "src": [
            "s1"
          ],
          "note": "Snippet only; confirm wording on the NIA page. Not live: no fetched source states it. Only source not fetched. s3 names the hotel-industry laws hotels register under, but does not state penalties."
        },
        {
          "applies": "national",
          "text": {
            "en": "Entering visa-free doesn't exempt you: visa-exempt visitors must have their accommodation registered just like visa holders."
          },
          "src": [
            "s2"
          ],
          "checked": "2026-11-11"
        }
      ]
    },
    {
      "key": "at-the-desk",
      "title": {
        "en": "At the front desk",
        "es": "En recepción",
        "fr": "À la réception",
        "de": "An der Rezeption",
        "ja": "フロントで",
        "ko": "프런트에서"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "Hotels must check your ID and send your registration to the local police within 24 hours of check-in."
          },
          "src": [
            "s14",
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Since May 2024, China's Ministry of Public Security, Ministry of Commerce and National Immigration Administration have said hotels must not turn you away for lacking 'foreign-related qualifications'."
          },
          "src": [
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "This followed complaints in 2024 that some hotels, especially budget ones in smaller cities, turned foreigners away saying they lacked qualifications or couldn't enter passport details into the system."
          },
          "src": [
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "In 2024 authorities also promised free online English training for hotel staff and said police would improve how foreign guests' registration is handled."
          },
          "src": [
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "At check-in, show your valid passport or residence permit; you may also be asked to fill in a temporary accommodation form."
          },
          "src": [
            "s5"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "If you stay in a hotel, the hotel registers you. The online registration launched in 2026 is only for stays outside hotels."
          },
          "src": [
            "s10",
            "s14"
          ],
          "checked": "2026-11-11"
        }
      ]
    },
    {
      "key": "payment",
      "title": {
        "en": "Paying the hotel",
        "es": "Pagar el hotel",
        "fr": "Payer l’hôtel",
        "de": "Das Hotel bezahlen",
        "ja": "ホテルの支払い",
        "ko": "호텔 결제"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "Since an April 2024 circular, tourist hotels rated three stars and above must accept both Chinese and foreign bank cards."
          },
          "src": [
            "s16"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Foreign cards are accepted where the card network's logo is displayed. Major hotels take cards bearing UnionPay, Visa, Mastercard, Diners Club, JCB or American Express logos."
          },
          "src": [
            "s18"
          ],
          "note": "Quote from a PBOC Dalian branch official; a general statement, not a guarantee. Not live: stale (old source for a price or limit). Quote is from Igor Popov, a Dalian resident, describing Dalian, not a PBOC official; research note is wrong. Weak source for a national claim. 'Logo displayed' rule not stated. Held back: Quote is from a resident, not a PBOC official; weak basis."
        },
        {
          "applies": "national",
          "text": {
            "en": "Visitors can link a foreign Visa or Mastercard to Alipay or WeChat Pay. The single-payment limit for overseas users rose from US$1,000 to US$5,000 in 2024."
          },
          "src": [
            "s18"
          ],
          "note": "Not live: no fetched source states it. Fetched page is page 2 of 4; it does not mention Alipay/WeChat Pay linking or the US$1,000 to US$5,000 limit. Claim may be on another page; unverified. Limits are likely to change."
        }
      ]
    },
    {
      "key": "private-stay",
      "title": {
        "en": "Staying with friends or in a rented flat",
        "es": "Alojarse con amigos o en un piso alquilado",
        "fr": "Loger chez des amis ou en location",
        "de": "Bei Freunden oder in einer Ferienwohnung",
        "ja": "知人宅や貸し部屋に泊まる場合",
        "ko": "지인 집이나 임대 숙소에 머물 때"
      },
      "facts": [
        {
          "applies": "national",
          "text": {
            "en": "Since 20 March 2026, if you stay outside a hotel in Hebei, Liaoning, Zhejiang, Hubei, Guangxi, Chongqing or Sichuan, you can register your accommodation online (pilot)."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "You or your host can register online through the NIA website, the 'NIA 12367' app, the 'NIA 12367' WeChat mini program, or the Alipay mini program."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Registering online counts the same as registering in person, and you can still register at a local police station."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "China plans to extend online registration nationwide gradually, depending on how the 2026 pilot goes."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        }
      ]
    },
    {
      "key": "city-rules",
      "title": {
        "en": "How to register in the city",
        "es": "Cómo registrarse en la ciudad",
        "fr": "Se déclarer sur place",
        "de": "Anmeldung vor Ort",
        "ja": "市内での登録方法",
        "ko": "시내 등록 방법"
      },
      "facts": [
        {
          "applies": "beijing",
          "text": {
            "en": "In Beijing, if you're not in a hotel, register within 24 hours of arriving, either at the local police station or online."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "To register online in Beijing, open the WeChat official account 北京公安出入境, go to 资讯指南 (Information Guide), then tap 网上住宿登记办理 (Online Accommodation Registration)."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing's online accommodation registration system works in English, French, Japanese, Korean and Russian as well as Chinese."
          },
          "src": [
            "s12",
            "s13"
          ],
          "note": "Snippet only. A non-official guide says only mainland phone numbers can register; not confirmed officially. Not live: no fetched source states it. s12 says nothing about languages; s13 404. Unverified."
        },
        {
          "applies": "beijing",
          "text": {
            "en": "For help in Beijing, call the exit-entry hotline 010-12367 (+86-10-12367 from abroad) and choose English."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "In Beijing, if you don't register within 24 hours, police can penalise you."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "In Shanghai, if you're not in a hotel, you or your host must register within 24 hours of check-in."
          },
          "src": [
            "s2",
            "s3"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "In Shanghai you can register online through the Self-help Declaration System for Overseas Personnel's Accommodation Registration, or in the Suishenban (随申办) app: switch to 'International', then Other services, Accommodation registration."
          },
          "src": [
            "s4",
            "s3"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "To register at a Shanghai police station, bring the required ID (your passport, or a local host's ID and household booklet) and fill in a form. Police verify it and keep a copy."
          },
          "src": [
            "s5"
          ],
          "checked": "2026-11-11"
        }
      ]
    }
  ]
};
