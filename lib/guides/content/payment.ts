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
            "en": "You can link a foreign bank card (Visa, Mastercard and other major networks) to Alipay or WeChat Pay and pay with it, without opening a Chinese bank account.",
            "es": "Puedes vincular una tarjeta bancaria extranjera (Visa, Mastercard y otras redes principales) a Alipay o WeChat Pay y pagar con ella, sin abrir una cuenta en un banco chino.",
            "fr": "Vous pouvez associer une carte bancaire étrangère (Visa, Mastercard et autres grands réseaux) à Alipay ou WeChat Pay et payer avec, sans ouvrir de compte bancaire chinois.",
            "de": "Sie können eine ausländische Bankkarte (Visa, Mastercard und andere große Netzwerke) mit Alipay oder WeChat Pay verknüpfen und damit bezahlen, ohne ein chinesisches Bankkonto zu eröffnen.",
            "ja": "中国の銀行口座を開設しなくても、海外発行の銀行カード（Visa、Mastercardなどの主要ブランド）をAlipay（支付宝）やWeChat Pay（微信支付）に登録して支払いに使えます。",
            "ko": "중국 은행 계좌를 개설하지 않아도 해외 은행 카드(Visa, Mastercard 및 기타 주요 카드 네트워크)를 알리페이나 위챗페이에 연결해 결제할 수 있습니다."
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
            "en": "In March 2024 China's central bank had Alipay and WeChat Pay raise foreign visitors' limits from US$1,000 to US$5,000 per payment and from US$10,000 to US$50,000 a year.",
            "es": "En marzo de 2024, el banco central de China hizo que Alipay y WeChat Pay subieran los límites para visitantes extranjeros de US$1,000 a US$5,000 por pago y de US$10,000 a US$50,000 al año.",
            "fr": "En mars 2024, la banque centrale chinoise a demandé à Alipay et WeChat Pay de relever les plafonds des visiteurs étrangers de 1 000 US$ à 5 000 US$ par paiement et de 10 000 US$ à 50 000 US$ par an.",
            "de": "Im März 2024 ließ Chinas Zentralbank Alipay und WeChat Pay die Limits für ausländische Besucher von US$1.000 auf US$5.000 pro Zahlung und von US$10.000 auf US$50.000 pro Jahr anheben.",
            "ja": "2024年3月、中国人民銀行はAlipayとWeChat Payに対し、外国人旅行者の利用上限を1回あたりUS$1,000からUS$5,000へ、年間US$10,000からUS$50,000へ引き上げさせました。",
            "ko": "2024년 3월 중국 인민은행은 알리페이와 위챗페이의 외국인 방문객 한도를 건당 US$1,000에서 US$5,000로, 연간 US$10,000에서 US$50,000로 상향하도록 했습니다."
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
            "en": "With a foreign card linked to Alipay or WeChat Pay you can pay up to US$5,000 per transaction and US$50,000 a year. Check the app for your account's actual limits.",
            "es": "Con una tarjeta extranjera vinculada a Alipay o WeChat Pay puedes pagar hasta US$5,000 por transacción y US$50,000 al año. Consulta en la app los límites reales de tu cuenta.",
            "fr": "Avec une carte étrangère associée à Alipay ou WeChat Pay, vous pouvez payer jusqu'à 5 000 US$ par transaction et 50 000 US$ par an. Vérifiez dans l'application les plafonds réels de votre compte.",
            "de": "Mit einer ausländischen Karte in Alipay oder WeChat Pay können Sie bis zu US$5.000 pro Transaktion und US$50.000 pro Jahr bezahlen. Die tatsächlichen Limits Ihres Kontos sehen Sie in der App.",
            "ja": "海外カードをAlipayやWeChat Payに登録すると、1回あたりUS$5,000、年間US$50,000まで支払えます。実際の上限はアプリでご確認ください。",
            "ko": "알리페이나 위챗페이에 해외 카드를 연결하면 건당 최대 US$5,000, 연간 최대 US$50,000까지 결제할 수 있습니다. 계정의 실제 한도는 앱에서 확인하십시오."
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
            "en": "Payments of 200 yuan or less with a linked foreign card are generally fee-free. Above 200 yuan a 3% fee on the whole amount may apply; check the payment page before confirming.",
            "es": "Los pagos de 200 yuanes o menos con una tarjeta extranjera vinculada suelen no tener comisión. Por encima de 200 yuanes puede aplicarse una comisión del 3 % sobre el importe total; revisa la página de pago antes de confirmar.",
            "fr": "Les paiements de 200 yuans ou moins avec une carte étrangère associée sont en général sans frais. Au-delà de 200 yuans, des frais de 3 % sur la totalité du montant peuvent s'appliquer ; vérifiez la page de paiement avant de confirmer.",
            "de": "Zahlungen bis 200 Yuan mit einer verknüpften ausländischen Karte sind in der Regel gebührenfrei. Über 200 Yuan kann eine Gebühr von 3 % auf den Gesamtbetrag anfallen; prüfen Sie vor dem Bestätigen die Zahlungsseite.",
            "ja": "登録した海外カードでの200元以下の支払いは、通常手数料無料です。200元を超えると全額に対して3%の手数料がかかる場合があるため、確定前に支払い画面をご確認ください。",
            "ko": "연결한 해외 카드로 200위안 이하를 결제하면 일반적으로 수수료가 없습니다. 200위안을 초과하면 전체 금액에 3% 수수료가 붙을 수 있으므로 확인 전에 결제 화면을 확인하십시오."
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
            "en": "You can sign up for WeChat or Alipay with a foreign phone number, as long as it can receive SMS verification codes.",
            "es": "Puedes registrarte en WeChat o Alipay con un número de teléfono extranjero, siempre que pueda recibir códigos de verificación por SMS.",
            "fr": "Vous pouvez vous inscrire sur WeChat ou Alipay avec un numéro de téléphone étranger, à condition qu'il puisse recevoir des codes de vérification par SMS.",
            "de": "Sie können sich bei WeChat oder Alipay mit einer ausländischen Telefonnummer registrieren, sofern diese SMS-Bestätigungscodes empfangen kann.",
            "ja": "SMS認証コードを受信できれば、海外の電話番号でもWeChatやAlipayに登録できます。",
            "ko": "SMS 인증번호를 받을 수 있다면 해외 전화번호로도 위챗이나 알리페이에 가입할 수 있습니다."
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
            "en": "Since November 2024, UnionPay cards issued outside the Chinese mainland can also be linked to Alipay and WeChat Pay.",
            "es": "Desde noviembre de 2024, las tarjetas UnionPay emitidas fuera de China continental también pueden vincularse a Alipay y WeChat Pay.",
            "fr": "Depuis novembre 2024, les cartes UnionPay émises hors de Chine continentale peuvent aussi être associées à Alipay et WeChat Pay.",
            "de": "Seit November 2024 lassen sich auch außerhalb des chinesischen Festlands ausgegebene UnionPay-Karten mit Alipay und WeChat Pay verknüpfen.",
            "ja": "2024年11月から、中国本土以外で発行された銀聯（UnionPay）カードもAlipayとWeChat Payに登録できるようになりました。",
            "ko": "2024년 11월부터 중국 본토 이외 지역에서 발급된 UnionPay 카드도 알리페이와 위챗페이에 연결할 수 있습니다."
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
            "en": "Under an April 2024 rule, tourist hotels rated three stars and up, 4A and 5A attractions, and national and provincial tourist resorts should accept both Chinese and foreign bank cards.",
            "es": "Según una norma de abril de 2024, los hoteles turísticos de tres estrellas o más, las atracciones 4A y 5A y los complejos turísticos nacionales y provinciales deben aceptar tarjetas bancarias chinas y extranjeras.",
            "fr": "Selon une règle d'avril 2024, les hôtels touristiques de trois étoiles et plus, les sites touristiques 4A et 5A et les stations touristiques nationales et provinciales doivent accepter les cartes bancaires chinoises comme étrangères.",
            "de": "Nach einer Regel vom April 2024 sollen Touristenhotels ab drei Sternen, 4A- und 5A-Sehenswürdigkeiten sowie nationale und Provinz-Tourismusresorts chinesische und ausländische Bankkarten akzeptieren.",
            "ja": "2024年4月の規定により、三つ星以上の観光ホテル、4A・5A級の観光地、国家級・省級の観光リゾートでは、中国国内と海外の銀行カードの両方を受け付けることとされています。",
            "ko": "2024년 4월 규정에 따라 3성급 이상 관광호텔, 4A·5A급 관광지, 국가급·성급 관광 리조트는 중국 은행 카드와 해외 은행 카드를 모두 받아야 합니다."
          },
          "src": [
            "s24"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Foreign cards work at terminals showing your card's network logo (UnionPay, Visa, Mastercard, Amex, JCB, Diners Club, Discover). If no logo is shown, ask the cashier.",
            "es": "Las tarjetas extranjeras funcionan en los terminales que muestran el logotipo de la red de tu tarjeta (UnionPay, Visa, Mastercard, Amex, JCB, Diners Club, Discover). Si no hay logotipo, pregunta en caja.",
            "fr": "Les cartes étrangères fonctionnent sur les terminaux affichant le logo du réseau de votre carte (UnionPay, Visa, Mastercard, Amex, JCB, Diners Club, Discover). Si aucun logo n'est affiché, demandez au caissier.",
            "de": "Ausländische Karten funktionieren an Terminals mit dem Logo Ihres Kartennetzwerks (UnionPay, Visa, Mastercard, Amex, JCB, Diners Club, Discover). Ist kein Logo zu sehen, fragen Sie an der Kasse.",
            "ja": "海外カードは、お持ちのカードのブランドロゴ（UnionPay、Visa、Mastercard、Amex、JCB、Diners Club、Discover）が表示された端末で使えます。ロゴがない場合はレジでお尋ねください。",
            "ko": "해외 카드는 해당 카드 네트워크 로고(UnionPay, Visa, Mastercard, Amex, JCB, Diners Club, Discover)가 표시된 단말기에서 사용할 수 있습니다. 로고가 없으면 계산원에게 문의하십시오."
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
            "en": "Renminbi cash is legal tender. No business or person may refuse cash, including through notices or terms, and businesses that do can be penalised.",
            "es": "El efectivo en renminbi es de curso legal. Ningún negocio ni persona puede rechazar el efectivo, tampoco mediante avisos o condiciones, y los negocios que lo hagan pueden ser sancionados.",
            "fr": "Les espèces en renminbi ont cours légal. Aucun commerce ni aucune personne ne peut refuser les espèces, y compris par voie d'affichage ou de conditions, et les commerces qui le font peuvent être sanctionnés.",
            "de": "Renminbi-Bargeld ist gesetzliches Zahlungsmittel. Kein Geschäft und keine Person darf Bargeld ablehnen, auch nicht per Aushang oder Geschäftsbedingungen; Geschäfte, die es dennoch tun, können bestraft werden.",
            "ja": "人民元の現金は法定通貨です。事業者や個人は、掲示や規約によるものも含め現金の受け取りを拒否できず、拒否した事業者は処罰されることがあります。",
            "ko": "인민폐 현금은 법정 통화입니다. 어떤 업체나 개인도 공지나 약관 등을 통해서라도 현금을 거부할 수 없으며, 거부하는 업체는 처벌받을 수 있습니다."
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
            "en": "Under 2024 State Council rules, businesses that refuse cash face harsher penalties and public reprimand, and banks must offer small-change kits.",
            "es": "Según las normas del Consejo de Estado de 2024, los negocios que rechazan el efectivo se enfrentan a sanciones más duras y a amonestación pública, y los bancos deben ofrecer kits de cambio.",
            "fr": "Selon les règles du Conseil des affaires de l'État de 2024, les commerces qui refusent les espèces s'exposent à des sanctions plus lourdes et à un blâme public, et les banques doivent proposer des kits de petite monnaie.",
            "de": "Nach Vorschriften des Staatsrats von 2024 drohen Geschäften, die Bargeld ablehnen, strengere Strafen und eine öffentliche Rüge, und Banken müssen Wechselgeld-Sets anbieten.",
            "ja": "2024年の国務院の規定により、現金の受け取りを拒否する事業者にはより重い罰則と公開の譴責が科され、銀行は小銭セットの提供が義務付けられています。",
            "ko": "2024년 국무원 규정에 따라 현금을 거부하는 업체는 더 무거운 처벌과 공개 경고를 받으며, 은행은 잔돈 키트를 제공해야 합니다."
          },
          "src": [
            "s9"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Refusing cash brings real fines: in the last quarter of 2021 the central bank fined 32 businesses between 1,000 and 100,000 yuan.",
            "es": "Rechazar el efectivo conlleva multas reales: en el último trimestre de 2021, el banco central multó a 32 negocios con entre 1,000 y 100,000 yuanes.",
            "fr": "Refuser les espèces entraîne de vraies amendes : au dernier trimestre 2021, la banque centrale a infligé à 32 commerces des amendes de 1 000 à 100 000 yuans.",
            "de": "Die Ablehnung von Bargeld wird tatsächlich bestraft: Im letzten Quartal 2021 verhängte die Zentralbank gegen 32 Unternehmen Bußgelder zwischen 1.000 und 100.000 Yuan.",
            "ja": "現金の受け取り拒否には実際に罰金が科されています。2021年第4四半期には、中国人民銀行が32の事業者に1,000元から100,000元の罰金を科しました。",
            "ko": "현금 거부에는 실제로 벌금이 부과됩니다. 2021년 4분기에 중국 인민은행은 32개 업체에 1,000~100,000위안의 벌금을 부과했습니다."
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
            "en": "China's 2024 payment rules tell banks to upgrade ATMs so foreign visitors can withdraw renminbi with overseas bank cards.",
            "es": "Las normas de pago de China de 2024 piden a los bancos actualizar los cajeros para que los visitantes extranjeros puedan retirar renminbi con tarjetas bancarias del extranjero.",
            "fr": "Les règles de paiement chinoises de 2024 demandent aux banques de moderniser leurs distributeurs pour que les visiteurs étrangers puissent retirer des renminbi avec des cartes bancaires étrangères.",
            "de": "Chinas Zahlungsvorschriften von 2024 verpflichten Banken, Geldautomaten so aufzurüsten, dass ausländische Besucher mit ausländischen Bankkarten Renminbi abheben können.",
            "ja": "中国の2024年の決済関連規定では、外国人旅行者が海外の銀行カードで人民元を引き出せるよう、銀行にATMの改修を求めています。",
            "ko": "중국의 2024년 결제 규정은 외국인 방문객이 해외 은행 카드로 인민폐를 인출할 수 있도록 은행에 ATM을 개선하라고 지시하고 있습니다."
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
            "en": "Beijing reported in 2024 about 11,600 machines that let you withdraw cash with overseas cards, and some ICBC ATMs, including at Daxing airport, give out 10-yuan notes.",
            "es": "En 2024, Pekín informó de unos 11,600 cajeros que permiten retirar efectivo con tarjetas extranjeras, y algunos cajeros del ICBC, incluidos los del aeropuerto de Daxing, dispensan billetes de 10 yuanes.",
            "fr": "Pékin a recensé en 2024 environ 11 600 appareils permettant de retirer des espèces avec une carte étrangère, et certains distributeurs ICBC, notamment à l'aéroport de Daxing, délivrent des billets de 10 yuans.",
            "de": "Peking meldete 2024 rund 11.600 Automaten, an denen Sie mit ausländischen Karten Bargeld abheben können; einige ICBC-Geldautomaten, auch am Flughafen Daxing, geben 10-Yuan-Scheine aus.",
            "ja": "北京市は2024年、海外カードで現金を引き出せる機械が約11,600台あると発表しました。大興空港を含む一部の中国工商銀行（ICBC）のATMでは10元札も出てきます。",
            "ko": "베이징은 2024년에 해외 카드로 현금을 인출할 수 있는 기기가 약 11,600대라고 발표했으며, 다싱 공항을 포함한 일부 중국공상은행(ICBC) ATM에서는 10위안 지폐도 인출할 수 있습니다."
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
            "en": "Ride-hailing apps such as DiDi and Shouyue have English versions that accept major international cards like Visa and Mastercard.",
            "es": "Las apps de transporte con conductor como DiDi y Shouyue tienen versiones en inglés que aceptan las principales tarjetas internacionales, como Visa y Mastercard.",
            "fr": "Les applications de VTC comme DiDi et Shouyue ont des versions en anglais qui acceptent les grandes cartes internationales comme Visa et Mastercard.",
            "de": "Fahrdienst-Apps wie DiDi und Shouyue haben englische Versionen, die gängige internationale Karten wie Visa und Mastercard akzeptieren.",
            "ja": "DiDi（滴滴）や首汽約車（Shouyue）などの配車アプリには英語版があり、VisaやMastercardなどの主要な国際カードが使えます。",
            "ko": "DiDi, Shouyue 등 차량 호출 앱에는 영어 버전이 있으며 Visa, Mastercard 등 주요 국제 카드를 받습니다."
          },
          "src": [
            "s20"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Since 13 September 2024 you can tap an overseas Visa or Mastercard at every Beijing subway gate, including both airport lines, and pay the same fares as locals.",
            "es": "Desde el 13 de septiembre de 2024 puedes acercar una tarjeta Visa o Mastercard extranjera en cualquier torniquete del metro de Pekín, incluidas las dos líneas del aeropuerto, y pagar las mismas tarifas que los residentes.",
            "fr": "Depuis le 13 septembre 2024, vous pouvez présenter une carte Visa ou Mastercard étrangère sans contact à tous les portiques du métro de Pékin, y compris sur les deux lignes de l'aéroport, et payer les mêmes tarifs que les habitants.",
            "de": "Seit dem 13. September 2024 können Sie an jeder Sperre der Pekinger U-Bahn, einschließlich beider Flughafenlinien, mit einer ausländischen Visa- oder Mastercard kontaktlos bezahlen – zu denselben Fahrpreisen wie Einheimische.",
            "ja": "2024年9月13日から、両空港線を含む北京地下鉄のすべての改札で、海外のVisaやMastercardをタッチして地元の人と同じ運賃で乗車できます。",
            "ko": "2024년 9월 13일부터 두 공항 노선을 포함한 베이징 지하철의 모든 개찰구에서 해외 Visa 또는 Mastercard를 태그해 현지인과 같은 요금으로 탈 수 있습니다."
          },
          "src": [
            "s15"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "As of March 2026, Beijing subway gates, ticket purchases and top-ups accept contactless UnionPay, Visa, Mastercard, JCB and American Express cards; just hold your card to the gate.",
            "es": "Desde marzo de 2026, los torniquetes, la compra de billetes y las recargas del metro de Pekín aceptan tarjetas sin contacto UnionPay, Visa, Mastercard, JCB y American Express; solo acerca la tarjeta al torniquete.",
            "fr": "Depuis mars 2026, les portiques, l'achat de billets et les rechargements du métro de Pékin acceptent les cartes sans contact UnionPay, Visa, Mastercard, JCB et American Express ; il suffit d'approcher votre carte du portique.",
            "de": "Seit März 2026 akzeptieren die Sperren, Ticketkäufe und Aufladungen der Pekinger U-Bahn kontaktlose Karten von UnionPay, Visa, Mastercard, JCB und American Express; halten Sie Ihre Karte einfach an die Sperre.",
            "ja": "2026年3月現在、北京地下鉄の改札、切符購入、チャージでは、タッチ決済対応のUnionPay、Visa、Mastercard、JCB、American Expressカードが使えます。改札にカードをかざすだけです。",
            "ko": "2026년 3월 기준 베이징 지하철 개찰구, 승차권 구매, 충전에서 비접촉식 UnionPay, Visa, Mastercard, JCB, American Express 카드를 사용할 수 있습니다. 카드를 개찰구에 대기만 하면 됩니다."
          },
          "src": [
            "s16"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "Beijing taxis were found refusing cash or lacking change in 2024; the city has since put 'Cash Payment Accepted' signs in taxis and given drivers small-change wallets.",
            "es": "En 2024 se detectó que taxis de Pekín rechazaban el efectivo o no tenían cambio; desde entonces, la ciudad ha colocado carteles de «Cash Payment Accepted» (se acepta pago en efectivo) en los taxis y ha dado a los conductores carteras con cambio.",
            "fr": "En 2024, des taxis pékinois ont été pris à refuser les espèces ou à manquer de monnaie ; la ville a depuis apposé des panneaux « Cash Payment Accepted » dans les taxis et remis aux chauffeurs des porte-monnaie de petite monnaie.",
            "de": "2024 wurde festgestellt, dass Pekinger Taxis Bargeld ablehnten oder kein Wechselgeld hatten; seitdem hat die Stadt in Taxis Schilder mit „Cash Payment Accepted“ (Barzahlung möglich) angebracht und Fahrern Wechselgeldbörsen ausgegeben.",
            "ja": "2024年には北京のタクシーで現金の受け取り拒否や釣り銭不足が確認されました。その後、市はタクシー車内に「現金払い可」の表示を設置し、運転手に釣り銭用の小銭入れを配布しました。",
            "ko": "2024년 베이징 택시에서 현금을 거부하거나 거스름돈이 없는 사례가 확인되었습니다. 이후 시는 택시에 'Cash Payment Accepted(현금 결제 가능)' 표지를 붙이고 기사에게 잔돈 지갑을 지급했습니다."
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
            "en": "BEIJING PASS, a prepaid card launched in July 2024, is sold at both Beijing airports, subway and railway stations for 20 yuan (bring your passport) and is used mainly on public transport.",
            "es": "BEIJING PASS, una tarjeta prepago lanzada en julio de 2024, se vende en los dos aeropuertos de Pekín y en estaciones de metro y de tren por 20 yuanes (lleva tu pasaporte) y se usa sobre todo en el transporte público.",
            "fr": "BEIJING PASS, une carte prépayée lancée en juillet 2024, est vendue dans les deux aéroports de Pékin et dans les stations de métro et gares ferroviaires pour 20 yuans (munissez-vous de votre passeport) ; elle sert surtout dans les transports en commun.",
            "de": "BEIJING PASS, eine im Juli 2024 eingeführte Prepaid-Karte, wird an beiden Pekinger Flughäfen sowie an U-Bahn- und Bahnhöfen für 20 Yuan verkauft (Reisepass mitbringen) und vor allem im öffentlichen Nahverkehr genutzt.",
            "ja": "2024年7月に発売されたプリペイドカード「BEIJING PASS」は、北京の両空港、地下鉄駅、鉄道駅で20元で販売されており（パスポートが必要です）、主に公共交通機関で使われます。",
            "ko": "2024년 7월 출시된 선불카드 BEIJING PASS는 베이징의 두 공항과 지하철역, 기차역에서 20위안에 판매되며(여권 지참), 주로 대중교통에 사용됩니다."
          },
          "src": [
            "s20"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "Since 28 June 2025 you can tap a contactless Visa, Mastercard, Amex, JCB or UnionPay card at any Shanghai Metro gate.",
            "es": "Desde el 28 de junio de 2025 puedes acercar una tarjeta sin contacto Visa, Mastercard, Amex, JCB o UnionPay en cualquier torniquete del metro de Shanghái.",
            "fr": "Depuis le 28 juin 2025, vous pouvez présenter une carte sans contact Visa, Mastercard, Amex, JCB ou UnionPay à n'importe quel portique du métro de Shanghai.",
            "de": "Seit dem 28. Juni 2025 können Sie an jeder Sperre der Shanghaier Metro mit einer kontaktlosen Karte von Visa, Mastercard, Amex, JCB oder UnionPay bezahlen.",
            "ja": "2025年6月28日から、タッチ決済対応のVisa、Mastercard、Amex、JCB、UnionPayカードを上海地下鉄のすべての改札でかざして乗車できます。",
            "ko": "2025년 6월 28일부터 상하이 지하철의 모든 개찰구에서 비접촉식 Visa, Mastercard, Amex, JCB, UnionPay 카드를 태그할 수 있습니다."
          },
          "src": [
            "s17"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "For Shanghai Metro, turn on small-amount no-PIN payment on your card. Cards with Type-B chips or without ODA are not supported.",
            "es": "Para el metro de Shanghái, activa en tu tarjeta el pago de importes pequeños sin PIN. No se admiten tarjetas con chip tipo B ni sin ODA.",
            "fr": "Pour le métro de Shanghai, activez sur votre carte le paiement sans code PIN pour les petits montants. Les cartes à puce de type B ou sans ODA ne sont pas acceptées.",
            "de": "Aktivieren Sie für die Shanghaier Metro auf Ihrer Karte die PIN-freie Zahlung für Kleinbeträge. Karten mit Typ-B-Chip oder ohne ODA werden nicht unterstützt.",
            "ja": "上海地下鉄を利用する場合は、カードの少額暗証番号不要決済を有効にしてください。Type-Bチップのカードや、ODA非対応のカードは使えません。",
            "ko": "상하이 지하철을 이용하려면 카드의 소액 무비밀번호 결제를 켜십시오. Type-B 칩 카드나 ODA를 지원하지 않는 카드는 사용할 수 없습니다."
          },
          "src": [
            "s17"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "Only some Shanghai taxis with suitable card terminals take overseas cards. The scheme started in April 2024 with Dazhong taxis.",
            "es": "Solo algunos taxis de Shanghái con terminales adecuados aceptan tarjetas extranjeras. El programa empezó en abril de 2024 con los taxis Dazhong.",
            "fr": "Seuls certains taxis de Shanghai équipés de terminaux adaptés acceptent les cartes étrangères. Le dispositif a démarré en avril 2024 avec les taxis Dazhong.",
            "de": "Nur manche Shanghaier Taxis mit geeigneten Kartenterminals nehmen ausländische Karten an. Das Programm startete im April 2024 mit Dazhong-Taxis.",
            "ja": "海外カードが使えるのは、対応するカード端末を備えた一部の上海のタクシーのみです。この取り組みは2024年4月に大衆タクシー（Dazhong）から始まりました。",
            "ko": "적합한 카드 단말기를 갖춘 일부 상하이 택시에서만 해외 카드를 받습니다. 이 제도는 2024년 4월 다중(大众) 택시에서 시작되었습니다."
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
            "en": "Beijing Capital and Daxing airports have payment service areas for foreign visitors, and Beijing said in 2024 that all merchants at both airports accept overseas cards.",
            "es": "Los aeropuertos Capital y Daxing de Pekín tienen zonas de servicios de pago para visitantes extranjeros, y en 2024 Pekín afirmó que todos los comercios de ambos aeropuertos aceptan tarjetas extranjeras.",
            "fr": "Les aéroports de Pékin-Capitale et de Daxing disposent d'espaces de services de paiement pour les visiteurs étrangers, et Pékin a indiqué en 2024 que tous les commerces des deux aéroports acceptent les cartes étrangères.",
            "de": "Die Pekinger Flughäfen Capital und Daxing haben Zahlungsservicebereiche für ausländische Besucher, und Peking erklärte 2024, dass alle Händler an beiden Flughäfen ausländische Karten akzeptieren.",
            "ja": "北京首都空港と大興空港には外国人旅行者向けの決済サービスエリアがあり、北京市は2024年、両空港のすべての店舗で海外カードが使えると発表しました。",
            "ko": "베이징 서우두 공항과 다싱 공항에는 외국인 방문객용 결제 서비스 구역이 있으며, 베이징시는 2024년에 두 공항의 모든 상점이 해외 카드를 받는다고 발표했습니다."
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
            "en": "Along Beijing's Central Axis, a 'Visa-UnionPay Zone' launched in March 2025 means key businesses take overseas cards and nearby ATMs give cash on foreign cards.",
            "es": "A lo largo del Eje Central de Pekín, una «Visa-UnionPay Zone» lanzada en marzo de 2025 hace que los principales negocios acepten tarjetas extranjeras y que los cajeros cercanos den efectivo con tarjetas extranjeras.",
            "fr": "Le long de l'Axe central de Pékin, une « zone Visa-UnionPay » lancée en mars 2025 garantit que les principaux commerces acceptent les cartes étrangères et que les distributeurs voisins délivrent des espèces avec une carte étrangère.",
            "de": "Entlang der Pekinger Zentralachse bedeutet eine im März 2025 eingeführte „Visa-UnionPay-Zone“, dass wichtige Geschäfte ausländische Karten annehmen und Geldautomaten in der Nähe Bargeld auf ausländische Karten auszahlen.",
            "ja": "北京の中軸線沿いでは、2025年3月に開設された「Visa・銀聯エリア」により、主要な店舗で海外カードが使え、近くのATMで海外カードによる現金引き出しができます。",
            "ko": "베이징 중축선에서는 2025년 3월 'Visa-UnionPay 존'이 시작되어 주요 업체가 해외 카드를 받고 인근 ATM에서 해외 카드로 현금을 인출할 수 있습니다."
          },
          "src": [
            "s21"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "In March 2024 China's central bank said foreign cards were accepted at more Shanghai airports, train stations, star-rated hotels and major shopping districts.",
            "es": "En marzo de 2024, el banco central de China dijo que se aceptaban tarjetas extranjeras en más aeropuertos, estaciones de tren, hoteles con estrellas y grandes zonas comerciales de Shanghái.",
            "fr": "En mars 2024, la banque centrale chinoise a annoncé que les cartes étrangères étaient acceptées dans davantage d'aéroports, de gares, d'hôtels classés et de grands quartiers commerçants de Shanghai.",
            "de": "Im März 2024 erklärte Chinas Zentralbank, dass ausländische Karten an mehr Shanghaier Flughäfen, Bahnhöfen, Sternehotels und großen Einkaufsvierteln akzeptiert werden.",
            "ja": "2024年3月、中国人民銀行は、上海の空港、鉄道駅、星付きホテル、主要な商業エリアで海外カードが使える場所が増えたと発表しました。",
            "ko": "2024년 3월 중국 인민은행은 상하이의 더 많은 공항, 기차역, 성급 호텔, 주요 쇼핑 지구에서 해외 카드를 받는다고 발표했습니다."
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
