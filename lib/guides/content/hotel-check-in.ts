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
            "en": "If you stay in a hotel, the front desk registers you and sends your details to the local police. You don't need to register separately.",
            "es": "Si te alojas en un hotel, la recepción te registra y envía tus datos a la policía local. No necesitas registrarte por separado.",
            "fr": "Si vous séjournez à l'hôtel, la réception vous enregistre et transmet vos informations à la police locale. Vous n'avez pas à vous déclarer séparément.",
            "de": "Wenn Sie in einem Hotel übernachten, registriert Sie die Rezeption und übermittelt Ihre Daten an die örtliche Polizei. Sie müssen sich nicht gesondert anmelden.",
            "ja": "ホテルに宿泊する場合は、フロントがあなたを登録し、情報を地元の警察に送ります。別途登録する必要はありません。",
            "ko": "호텔에 묵으면 프런트에서 투숙 등록을 하고 귀하의 정보를 관할 공안(경찰)에 전송합니다. 따로 등록할 필요가 없습니다."
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
            "en": "If you stay anywhere other than a hotel, such as a friend's home or a rented flat, you or your host must register with the local police within 24 hours of arriving.",
            "es": "Si te alojas en otro lugar que no sea un hotel, como la casa de un amigo o un piso de alquiler, tú o tu anfitrión deben registrarte en la policía local en las 24 horas siguientes a tu llegada.",
            "fr": "Si vous logez ailleurs qu'à l'hôtel, par exemple chez un ami ou dans un appartement loué, vous ou votre hôte devez vous déclarer à la police locale dans les 24 heures suivant votre arrivée.",
            "de": "Wenn Sie anderswo als in einem Hotel übernachten, etwa bei Freunden oder in einer Mietwohnung, müssen Sie oder Ihr Gastgeber sich innerhalb von 24 Stunden nach Ankunft bei der örtlichen Polizei anmelden.",
            "ja": "友人宅や賃貸住宅など、ホテル以外に滞在する場合は、到着から24時間以内に、あなたまたは受け入れ先が地元の警察で登録しなければなりません。",
            "ko": "친구 집이나 임대 아파트 등 호텔 이외의 곳에 묵으면 도착 후 24시간 이내에 본인 또는 집주인이 관할 공안에 등록해야 합니다."
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
            "en": "Entering visa-free doesn't exempt you: visa-exempt visitors must have their accommodation registered just like visa holders.",
            "es": "Entrar sin visado no te exime: los visitantes exentos de visado deben registrar su alojamiento igual que quienes tienen visado.",
            "fr": "Entrer sans visa ne vous en dispense pas : les visiteurs exemptés de visa doivent faire enregistrer leur hébergement comme les titulaires d'un visa.",
            "de": "Die visumfreie Einreise befreit Sie nicht davon: Auch visumfrei Einreisende müssen ihre Unterkunft genauso anmelden lassen wie Visuminhaber.",
            "ja": "ビザ免除で入国しても免除にはなりません。ビザ免除の旅行者も、ビザ保持者と同様に宿泊登録が必要です。",
            "ko": "무비자로 입국해도 면제되지 않습니다. 비자 면제 방문객도 비자 소지자와 마찬가지로 숙박 등록을 해야 합니다."
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
            "en": "Hotels must check your ID and send your registration to the local police within 24 hours of check-in.",
            "es": "Los hoteles deben comprobar tu documento de identidad y enviar tu registro a la policía local en las 24 horas siguientes al check-in.",
            "fr": "Les hôtels doivent vérifier votre pièce d'identité et transmettre votre enregistrement à la police locale dans les 24 heures suivant votre arrivée.",
            "de": "Hotels müssen Ihren Ausweis prüfen und Ihre Anmeldung innerhalb von 24 Stunden nach dem Check-in an die örtliche Polizei übermitteln.",
            "ja": "ホテルはチェックイン時に身分証を確認し、チェックインから24時間以内に宿泊登録を地元の警察に送らなければなりません。",
            "ko": "호텔은 체크인 후 24시간 이내에 신분증을 확인하고 투숙 등록 정보를 관할 공안에 전송해야 합니다."
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
            "en": "Since May 2024, China's Ministry of Public Security, Ministry of Commerce and National Immigration Administration have said hotels must not turn you away for lacking 'foreign-related qualifications'.",
            "es": "Desde mayo de 2024, el Ministerio de Seguridad Pública, el Ministerio de Comercio y la Administración Nacional de Inmigración de China han dicho que los hoteles no pueden rechazarte por carecer de «cualificación para extranjeros».",
            "fr": "Depuis mai 2024, le ministère chinois de la Sécurité publique, le ministère du Commerce et l'Administration nationale de l'immigration ont indiqué que les hôtels ne doivent pas vous refuser au motif qu'ils n'ont pas de « qualifications pour accueillir des étrangers ».",
            "de": "Seit Mai 2024 haben Chinas Ministerium für öffentliche Sicherheit, das Handelsministerium und die Nationale Einwanderungsbehörde erklärt, dass Hotels Sie nicht wegen fehlender „Qualifikation für Ausländer“ abweisen dürfen.",
            "ja": "2024年5月から、中国の公安部、商務部、国家移民管理局は、「外国人受け入れ資格」がないことを理由にホテルが宿泊を断ってはならないとしています。",
            "ko": "2024년 5월부터 중국 공안부, 상무부, 국가이민관리국은 호텔이 '외국인 접대 자격'이 없다는 이유로 투숙을 거부해서는 안 된다고 밝혔습니다."
          },
          "src": [
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "This followed complaints in 2024 that some hotels, especially budget ones in smaller cities, turned foreigners away saying they lacked qualifications or couldn't enter passport details into the system.",
            "es": "Esto se produjo tras quejas en 2024 de que algunos hoteles, sobre todo económicos en ciudades más pequeñas, rechazaban a extranjeros alegando que no tenían la cualificación o que no podían introducir los datos del pasaporte en el sistema.",
            "fr": "Cela faisait suite à des plaintes en 2024 selon lesquelles certains hôtels, surtout des établissements économiques dans de petites villes, refusaient des étrangers en invoquant un manque de qualifications ou l'impossibilité de saisir les données du passeport dans le système.",
            "de": "Anlass waren Beschwerden im Jahr 2024, dass einige Hotels, besonders günstige in kleineren Städten, Ausländer abwiesen, weil ihnen angeblich die Qualifikation fehle oder sie Passdaten nicht ins System eingeben könnten.",
            "ja": "これは2024年、一部のホテル、特に地方都市の格安ホテルが、資格がない、またはパスポート情報をシステムに入力できないとして外国人の宿泊を断っているという苦情が寄せられたことを受けたものです。",
            "ko": "이는 2024년 일부 호텔, 특히 중소도시의 저가 호텔이 자격이 없다거나 시스템에 여권 정보를 입력할 수 없다며 외국인을 거절한다는 민원이 제기된 데 따른 것입니다."
          },
          "src": [
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "In 2024 authorities also promised free online English training for hotel staff and said police would improve how foreign guests' registration is handled.",
            "es": "En 2024, las autoridades también prometieron formación gratuita en línea de inglés para el personal hotelero y dijeron que la policía mejoraría la gestión del registro de huéspedes extranjeros.",
            "fr": "En 2024, les autorités ont aussi promis une formation gratuite en ligne à l'anglais pour le personnel hôtelier et annoncé que la police améliorerait le traitement de l'enregistrement des clients étrangers.",
            "de": "2024 versprachen die Behörden außerdem kostenlose Online-Englischkurse für Hotelpersonal und kündigten an, dass die Polizei die Anmeldung ausländischer Gäste verbessern werde.",
            "ja": "2024年には当局が、ホテル従業員向けの無料オンライン英語研修の提供と、警察による外国人宿泊客の登録手続きの改善も約束しました。",
            "ko": "2024년 당국은 호텔 직원 대상 무료 온라인 영어 교육을 약속하고, 공안이 외국인 투숙객 등록 처리 방식을 개선하겠다고 밝혔습니다."
          },
          "src": [
            "s6"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "At check-in, show your valid passport or residence permit; you may also be asked to fill in a temporary accommodation form.",
            "es": "En el check-in, muestra tu pasaporte o permiso de residencia válido; también pueden pedirte que rellenes un formulario de alojamiento temporal.",
            "fr": "À l'arrivée, présentez votre passeport ou votre permis de séjour en cours de validité ; on peut aussi vous demander de remplir un formulaire d'hébergement temporaire.",
            "de": "Zeigen Sie beim Check-in Ihren gültigen Reisepass oder Aufenthaltstitel vor; eventuell müssen Sie auch ein Formular zur vorübergehenden Unterkunft ausfüllen.",
            "ja": "チェックイン時には有効なパスポートまたは居留許可を提示してください。臨時宿泊登録表への記入を求められることもあります。",
            "ko": "체크인할 때 유효한 여권이나 거류 허가증을 제시하십시오. 임시 숙박 등록표 작성을 요청받을 수도 있습니다."
          },
          "src": [
            "s5"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "If you stay in a hotel, the hotel registers you. The online registration launched in 2026 is only for stays outside hotels.",
            "es": "Si te alojas en un hotel, el hotel te registra. El registro en línea lanzado en 2026 es solo para alojamientos fuera de hoteles.",
            "fr": "Si vous séjournez à l'hôtel, c'est l'hôtel qui vous enregistre. L'enregistrement en ligne lancé en 2026 concerne uniquement les séjours hors hôtel.",
            "de": "Wenn Sie in einem Hotel übernachten, meldet das Hotel Sie an. Die 2026 eingeführte Online-Anmeldung gilt nur für Aufenthalte außerhalb von Hotels.",
            "ja": "ホテルに宿泊する場合は、ホテルが登録を行います。2026年に始まったオンライン登録は、ホテル以外に滞在する場合のみが対象です。",
            "ko": "호텔에 묵으면 호텔이 등록해 줍니다. 2026년에 시작된 온라인 등록은 호텔 이외 숙소에 묵는 경우에만 해당합니다."
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
            "en": "Since an April 2024 circular, tourist hotels rated three stars and above must accept both Chinese and foreign bank cards.",
            "es": "Desde una circular de abril de 2024, los hoteles turísticos de tres estrellas o más deben aceptar tarjetas bancarias chinas y extranjeras.",
            "fr": "Depuis une circulaire d'avril 2024, les hôtels touristiques de trois étoiles et plus doivent accepter les cartes bancaires chinoises comme étrangères.",
            "de": "Seit einem Rundschreiben vom April 2024 müssen Touristenhotels ab drei Sternen chinesische und ausländische Bankkarten akzeptieren.",
            "ja": "2024年4月の通知により、三つ星以上の観光ホテルは中国国内と海外の銀行カードの両方を受け付けなければなりません。",
            "ko": "2024년 4월 통지에 따라 3성급 이상 관광호텔은 중국 은행 카드와 해외 은행 카드를 모두 받아야 합니다."
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
            "en": "Since 20 March 2026, if you stay outside a hotel in Hebei, Liaoning, Zhejiang, Hubei, Guangxi, Chongqing or Sichuan, you can register your accommodation online (pilot).",
            "es": "Desde el 20 de marzo de 2026, si te alojas fuera de un hotel en Hebei, Liaoning, Zhejiang, Hubei, Guangxi, Chongqing o Sichuan, puedes registrar tu alojamiento en línea (programa piloto).",
            "fr": "Depuis le 20 mars 2026, si vous logez hors hôtel dans le Hebei, le Liaoning, le Zhejiang, le Hubei, le Guangxi, à Chongqing ou dans le Sichuan, vous pouvez déclarer votre hébergement en ligne (phase pilote).",
            "de": "Seit dem 20. März 2026 können Sie Ihre Unterkunft online anmelden, wenn Sie in Hebei, Liaoning, Zhejiang, Hubei, Guangxi, Chongqing oder Sichuan außerhalb eines Hotels übernachten (Pilotprojekt).",
            "ja": "2026年3月20日から、河北省、遼寧省、浙江省、湖北省、広西チワン族自治区、重慶市、四川省でホテル以外に滞在する場合、宿泊登録をオンラインで行えます（試行）。",
            "ko": "2026년 3월 20일부터 허베이, 랴오닝, 저장, 후베이, 광시, 충칭, 쓰촨에서 호텔 이외 숙소에 묵으면 숙박 등록을 온라인으로 할 수 있습니다(시범 운영)."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "You or your host can register online through the NIA website, the 'NIA 12367' app, the 'NIA 12367' WeChat mini program, or the Alipay mini program.",
            "es": "Tú o tu anfitrión pueden hacer el registro en línea a través de la web de la NIA, la app «NIA 12367», el miniprograma de WeChat «NIA 12367» o el miniprograma de Alipay.",
            "fr": "Vous ou votre hôte pouvez faire la déclaration en ligne via le site de la NIA, l'application « NIA 12367 », le mini-programme WeChat « NIA 12367 » ou le mini-programme Alipay.",
            "de": "Sie oder Ihr Gastgeber können sich online über die NIA-Website, die App „NIA 12367“, das WeChat-Miniprogramm „NIA 12367“ oder das Alipay-Miniprogramm anmelden.",
            "ja": "あなたまたは受け入れ先は、国家移民管理局のウェブサイト、「NIA 12367」アプリ、「NIA 12367」WeChatミニプログラム、またはAlipayミニプログラムからオンラインで登録できます。",
            "ko": "본인 또는 집주인이 국가이민관리국(NIA) 웹사이트, 'NIA 12367' 앱, 'NIA 12367' 위챗 미니프로그램, 알리페이 미니프로그램을 통해 온라인으로 등록할 수 있습니다."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "Registering online counts the same as registering in person, and you can still register at a local police station.",
            "es": "Registrarte en línea vale lo mismo que hacerlo en persona, y también puedes registrarte en una comisaría local.",
            "fr": "La déclaration en ligne a la même valeur qu'une déclaration en personne, et vous pouvez toujours vous déclarer dans un poste de police local.",
            "de": "Die Online-Anmeldung gilt genauso wie die persönliche Anmeldung, und Sie können sich weiterhin bei einer örtlichen Polizeidienststelle anmelden.",
            "ja": "オンライン登録は窓口での登録と同じ効力があり、引き続き地元の派出所でも登録できます。",
            "ko": "온라인 등록은 방문 등록과 동일한 효력이 있으며, 관할 파출소에서 등록할 수도 있습니다."
          },
          "src": [
            "s10"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "national",
          "text": {
            "en": "China plans to extend online registration nationwide gradually, depending on how the 2026 pilot goes.",
            "es": "China prevé ampliar el registro en línea a todo el país de forma gradual, según cómo funcione el piloto de 2026.",
            "fr": "La Chine prévoit d'étendre progressivement la déclaration en ligne à tout le pays, selon les résultats du pilote de 2026.",
            "de": "China plant, die Online-Anmeldung je nach Verlauf des Pilotprojekts 2026 schrittweise landesweit auszuweiten.",
            "ja": "中国は2026年の試行の状況を踏まえ、オンライン登録を段階的に全国へ拡大する予定です。",
            "ko": "중국은 2026년 시범 운영 결과에 따라 온라인 등록을 점차 전국으로 확대할 계획입니다."
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
            "en": "In Beijing, if you're not in a hotel, register within 24 hours of arriving, either at the local police station or online.",
            "es": "En Pekín, si no te alojas en un hotel, regístrate en las 24 horas siguientes a tu llegada, en la comisaría local o en línea.",
            "fr": "À Pékin, si vous n'êtes pas à l'hôtel, déclarez-vous dans les 24 heures suivant votre arrivée, au poste de police local ou en ligne.",
            "de": "Wenn Sie in Peking nicht im Hotel übernachten, melden Sie sich innerhalb von 24 Stunden nach Ankunft an, entweder bei der örtlichen Polizeidienststelle oder online.",
            "ja": "北京でホテル以外に滞在する場合は、到着から24時間以内に、地元の派出所またはオンラインで登録してください。",
            "ko": "베이징에서 호텔에 묵지 않는 경우 도착 후 24시간 이내에 관할 파출소나 온라인으로 등록하십시오."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "To register online in Beijing, open the WeChat official account 北京公安出入境, go to 资讯指南 (Information Guide), then tap 网上住宿登记办理 (Online Accommodation Registration).",
            "es": "Para registrarte en línea en Pekín, abre la cuenta oficial de WeChat 北京公安出入境, entra en 资讯指南 (Guía informativa) y toca 网上住宿登记办理 (Registro de alojamiento en línea).",
            "fr": "Pour vous déclarer en ligne à Pékin, ouvrez le compte officiel WeChat 北京公安出入境, allez dans 资讯指南 (Guide d'information), puis touchez 网上住宿登记办理 (Déclaration d'hébergement en ligne).",
            "de": "Für die Online-Anmeldung in Peking öffnen Sie den offiziellen WeChat-Account 北京公安出入境, gehen zu 资讯指南 (Informationsleitfaden) und tippen dann auf 网上住宿登记办理 (Online-Unterkunftsanmeldung).",
            "ja": "北京でオンライン登録するには、WeChat公式アカウント「北京公安出入境」を開き、「资讯指南」（情報ガイド）から「网上住宿登记办理」（オンライン宿泊登録）をタップします。",
            "ko": "베이징에서 온라인으로 등록하려면 위챗 공식 계정 北京公安出入境을 열고 资讯指南(정보 안내)으로 이동한 뒤 网上住宿登记办理(온라인 숙박 등록)를 누르십시오."
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
            "en": "For help in Beijing, call the exit-entry hotline 010-12367 (+86-10-12367 from abroad) and choose English.",
            "es": "Para obtener ayuda en Pekín, llama a la línea de entrada y salida 010-12367 (+86-10-12367 desde el extranjero) y elige inglés.",
            "fr": "Pour obtenir de l'aide à Pékin, appelez la ligne des entrées et sorties 010-12367 (+86-10-12367 depuis l'étranger) et choisissez l'anglais.",
            "de": "Hilfe in Peking erhalten Sie über die Ein- und Ausreise-Hotline 010-12367 (+86-10-12367 aus dem Ausland); wählen Sie Englisch.",
            "ja": "北京でのお問い合わせは、出入国ホットライン010-12367（海外からは+86-10-12367）に電話し、英語を選択してください。",
            "ko": "베이징에서 도움이 필요하면 출입국 핫라인 010-12367(해외에서는 +86-10-12367)로 전화해 영어를 선택하십시오."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "beijing",
          "text": {
            "en": "In Beijing, if you don't register within 24 hours, police can penalise you.",
            "es": "En Pekín, si no te registras en 24 horas, la policía puede sancionarte.",
            "fr": "À Pékin, si vous ne vous déclarez pas dans les 24 heures, la police peut vous sanctionner.",
            "de": "Wenn Sie sich in Peking nicht innerhalb von 24 Stunden anmelden, kann die Polizei Sie bestrafen.",
            "ja": "北京では、24時間以内に登録しないと警察から処罰されることがあります。",
            "ko": "베이징에서 24시간 이내에 등록하지 않으면 공안이 처벌할 수 있습니다."
          },
          "src": [
            "s12"
          ],
          "checked": "2026-11-11"
        },
        {
          "applies": "shanghai",
          "text": {
            "en": "In Shanghai, if you're not in a hotel, you or your host must register within 24 hours of check-in.",
            "es": "En Shanghái, si no te alojas en un hotel, tú o tu anfitrión deben hacer el registro en las 24 horas siguientes a tu llegada al alojamiento.",
            "fr": "À Shanghai, si vous n'êtes pas à l'hôtel, vous ou votre hôte devez faire la déclaration dans les 24 heures suivant votre arrivée dans le logement.",
            "de": "Wenn Sie in Shanghai nicht im Hotel übernachten, müssen Sie oder Ihr Gastgeber Sie innerhalb von 24 Stunden nach dem Einzug anmelden.",
            "ja": "上海でホテル以外に滞在する場合は、入居から24時間以内に、あなたまたは受け入れ先が登録しなければなりません。",
            "ko": "상하이에서 호텔에 묵지 않는 경우 입주 후 24시간 이내에 본인 또는 집주인이 등록해야 합니다."
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
            "en": "In Shanghai you can register online through the Self-help Declaration System for Overseas Personnel's Accommodation Registration, or in the Suishenban (随申办) app: switch to 'International', then Other services, Accommodation registration.",
            "es": "En Shanghái puedes registrarte en línea a través del Self-help Declaration System for Overseas Personnel's Accommodation Registration (sistema de autodeclaración del registro de alojamiento de extranjeros), o en la app Suishenban (随申办): cambia a «International» y luego ve a Other services y Accommodation registration.",
            "fr": "À Shanghai, vous pouvez vous déclarer en ligne via le Self-help Declaration System for Overseas Personnel's Accommodation Registration (système d'auto-déclaration de l'hébergement des personnes étrangères), ou dans l'application Suishenban (随申办) : passez en mode « International », puis Autres services, Déclaration d'hébergement.",
            "de": "In Shanghai können Sie sich online über das Self-help Declaration System for Overseas Personnel's Accommodation Registration oder in der App Suishenban (随申办) anmelden: Wechseln Sie zu „International“, dann Other services, Accommodation registration.",
            "ja": "上海では、「境外人員住宿登記自助申報システム」（Self-help Declaration System for Overseas Personnel's Accommodation Registration）または随申办（Suishenban）アプリでオンライン登録できます。アプリでは「International」に切り替え、「Other services」から「Accommodation registration」へ進みます。",
            "ko": "상하이에서는 '해외 인원 숙박 등록 셀프 신고 시스템(Self-help Declaration System for Overseas Personnel's Accommodation Registration)'이나 随申办(쑤이선반) 앱에서 온라인으로 등록할 수 있습니다. 'International'로 전환한 뒤 기타 서비스(Other services), 숙박 등록(Accommodation registration)을 선택하십시오."
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
            "en": "To register at a Shanghai police station, bring the required ID (your passport, or a local host's ID and household booklet) and fill in a form. Police verify it and keep a copy.",
            "es": "Para registrarte en una comisaría de Shanghái, lleva la identificación necesaria (tu pasaporte, o el documento de identidad y el libro de registro familiar de un anfitrión local) y rellena un formulario. La policía lo verifica y guarda una copia.",
            "fr": "Pour vous déclarer dans un poste de police de Shanghai, apportez les pièces requises (votre passeport, ou la pièce d'identité et le livret d'enregistrement du foyer de votre hôte local) et remplissez un formulaire. La police les vérifie et en conserve une copie.",
            "de": "Für die Anmeldung bei einer Shanghaier Polizeidienststelle bringen Sie die erforderlichen Ausweise mit (Ihren Reisepass bzw. Ausweis und Haushaltsbuch eines örtlichen Gastgebers) und füllen ein Formular aus. Die Polizei prüft die Angaben und behält eine Kopie.",
            "ja": "上海の派出所で登録する場合は、必要な身分証（あなたのパスポート、または現地の受け入れ先の身分証と戸籍簿）を持参し、用紙に記入してください。警察が確認し、写しを保管します。",
            "ko": "상하이 파출소에서 등록하려면 필요한 신분증(본인 여권, 또는 현지 집주인의 신분증과 호구부)을 가지고 가서 양식을 작성하십시오. 공안이 확인한 뒤 사본을 보관합니다."
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
