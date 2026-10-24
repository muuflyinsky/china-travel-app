// Privacy policy and support page text (App Store requires both URLs). Describes what the code
// actually does — keep it in step with lib/track.ts, app/api/go, app/api/t, lib/dish-cache.ts
// and docs/SPEC.md §8 when data handling changes, and bump UPDATED.
export const UPDATED = "2026-10-25";
export const SUPPORT_EMAIL = "support@haodego.com";

type Section = { h: string; items: string[] };
type Privacy = { title: string; updated: string; intro: string; sections: Section[]; contact: string };
type Support = { title: string; contactH: string; contactBody: string; faqH: string; faq: { q: string; a: string }[]; privacy: string };

const PRIVACY: Record<string, Privacy> = {
  en: {
    title: "Privacy policy",
    updated: "Last updated {date}",
    intro: "Haodego (China Travel Buddy) helps visitors to mainland China read menus, get around, pay and book. There is no account and no advertising. We don’t sell data, and we don’t track you across other apps or websites.",
    sections: [
      { h: "What stays on your phone", items: [
        "Your passport country, language, currency, trip dates and cities, allergies and diet, saved hotel and settings are stored only on your device.",
        "Your allergies are never sent to us: dishes are checked against them on your phone.",
        "Delete everything at any time in Settings → Clear all data, or by deleting the app.",
      ] },
      { h: "What is sent when you use a feature", items: [
        "Menu photos and dish names you type, with your language and city, go to an AI service (Alibaba Cloud Model Studio, Qwen) to be read. Photos are discarded after reading and never stored.",
        "Text you translate and hotel booking screenshots you add go to the same AI service and are not stored.",
        "Your location, only if you allow it, and the places you search for go to Amap (高德地图) to find your city, places and routes. We don’t store your location.",
      ] },
      { h: "What we keep", items: [
        "General facts about dishes (names, usual ingredients, allergens), so the next lookup is faster. They are never linked to you.",
        "Anonymous usage events, such as “menu scanned” and how long it took, with a random id that changes every session. No name, location, allergies or dates.",
        "Feedback you send on content (helpful, outdated or wrong), without anything about you.",
        "Booking link clicks: when you tap a partner link (Trip.com, eSIM providers) we record the time, partner, page, city and any travel dates in the link, and your device type (iPhone app, phone or computer), to match commissions. The partner’s own privacy policy then applies.",
        "Our hosting provider keeps standard server logs, including IP addresses, for a short time for security and troubleshooting.",
      ] },
      { h: "Service providers", items: [
        "Vercel (hosting, Hong Kong), Alibaba Cloud Model Studio (AI), Amap (maps and places) and Supabase (database for dish facts and anonymous events). They process data only to provide this service.",
      ] },
      { h: "Children", items: ["The app is not directed at children under 13."] },
      { h: "Your rights and changes", items: [
        "We keep no personal data tied to you, so there is usually nothing to look up or delete on our side. Write to us with any question or request.",
        "If this policy changes, we update this page and the date above.",
      ] },
    ],
    contact: "Contact: {email}",
  },
  es: {
    title: "Política de privacidad",
    updated: "Última actualización: {date}",
    intro: "Haodego (China Travel Buddy) ayuda a quienes visitan China continental a leer cartas, moverse, pagar y reservar. No hay cuenta ni publicidad. No vendemos datos ni te rastreamos en otras apps o webs.",
    sections: [
      { h: "Lo que se queda en tu teléfono", items: [
        "Tu país de pasaporte, idioma, moneda, fechas y ciudades del viaje, alergias y dieta, hotel guardado y ajustes se guardan solo en tu dispositivo.",
        "Tus alergias nunca se nos envían: los platos se comprueban en tu teléfono.",
        "Puedes borrarlo todo cuando quieras en Ajustes → Borrar todos los datos, o eliminando la app.",
      ] },
      { h: "Lo que se envía al usar una función", items: [
        "Las fotos de cartas y los nombres de platos que escribes, con tu idioma y ciudad, se envían a un servicio de IA (Alibaba Cloud Model Studio, Qwen) para leerlos. Las fotos se descartan tras leerlas y nunca se guardan.",
        "El texto que traduces y las capturas de reservas de hotel que añades van al mismo servicio de IA y no se guardan.",
        "Tu ubicación, solo si lo permites, y los lugares que buscas se envían a Amap (高德地图) para encontrar tu ciudad, lugares y rutas. No guardamos tu ubicación.",
      ] },
      { h: "Lo que guardamos", items: [
        "Datos generales sobre platos (nombres, ingredientes habituales, alérgenos) para responder más rápido la próxima vez. Nunca se vinculan contigo.",
        "Eventos de uso anónimos, como «carta escaneada» y cuánto tardó, con un identificador aleatorio que cambia en cada sesión. Sin nombre, ubicación, alergias ni fechas.",
        "Las valoraciones que envías sobre el contenido (útil, desactualizado o incorrecto), sin nada sobre ti.",
        "Clics en enlaces de reserva: al tocar un enlace de un socio (Trip.com, proveedores de eSIM) registramos la hora, el socio, la página, la ciudad, las fechas del enlace y el tipo de dispositivo, para cuadrar comisiones. Después se aplica la política de privacidad del socio.",
        "Nuestro proveedor de alojamiento guarda registros estándar del servidor, incluidas direcciones IP, durante poco tiempo por seguridad y para resolver problemas.",
      ] },
      { h: "Proveedores de servicios", items: [
        "Vercel (alojamiento, Hong Kong), Alibaba Cloud Model Studio (IA), Amap (mapas y lugares) y Supabase (base de datos de platos y eventos anónimos). Solo tratan datos para prestar este servicio.",
      ] },
      { h: "Menores", items: ["La app no está dirigida a menores de 13 años."] },
      { h: "Tus derechos y cambios", items: [
        "No guardamos datos personales vinculados a ti, así que normalmente no hay nada que consultar o borrar por nuestra parte. Escríbenos con cualquier pregunta o solicitud.",
        "Si esta política cambia, actualizaremos esta página y la fecha de arriba.",
      ] },
    ],
    contact: "Contacto: {email}",
  },
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : {date}",
    intro: "Haodego (China Travel Buddy) aide les visiteurs en Chine continentale à lire les menus, se déplacer, payer et réserver. Pas de compte, pas de publicité. Nous ne vendons pas de données et ne vous suivons pas sur d’autres applis ou sites.",
    sections: [
      { h: "Ce qui reste sur votre téléphone", items: [
        "Votre pays de passeport, langue, devise, dates et villes du voyage, allergies et régime, hôtel enregistré et réglages sont stockés uniquement sur votre appareil.",
        "Vos allergies ne nous sont jamais envoyées : les plats sont vérifiés sur votre téléphone.",
        "Supprimez tout à tout moment dans Réglages → Effacer toutes les données, ou en supprimant l’appli.",
      ] },
      { h: "Ce qui est envoyé quand vous utilisez une fonction", items: [
        "Les photos de menus et les noms de plats que vous saisissez, avec votre langue et votre ville, sont envoyés à un service d’IA (Alibaba Cloud Model Studio, Qwen) pour être lus. Les photos sont supprimées après lecture et jamais conservées.",
        "Le texte que vous traduisez et les captures de réservation d’hôtel que vous ajoutez passent par le même service d’IA et ne sont pas conservés.",
        "Votre position, seulement si vous l’autorisez, et les lieux que vous cherchez sont envoyés à Amap (高德地图) pour trouver votre ville, des lieux et des itinéraires. Nous ne conservons pas votre position.",
      ] },
      { h: "Ce que nous conservons", items: [
        "Des informations générales sur les plats (noms, ingrédients habituels, allergènes), pour répondre plus vite la fois suivante. Elles ne sont jamais liées à vous.",
        "Des événements d’utilisation anonymes, comme « menu scanné » et sa durée, avec un identifiant aléatoire qui change à chaque session. Ni nom, ni position, ni allergies, ni dates.",
        "Vos avis sur le contenu (utile, obsolète ou faux), sans rien vous concernant.",
        "Les clics sur les liens de réservation : quand vous touchez un lien partenaire (Trip.com, fournisseurs d’eSIM), nous enregistrons l’heure, le partenaire, la page, la ville, les dates éventuelles du lien et le type d’appareil, pour rapprocher les commissions. La politique de confidentialité du partenaire s’applique ensuite.",
        "Notre hébergeur conserve brièvement des journaux serveur standard, adresses IP comprises, pour la sécurité et le dépannage.",
      ] },
      { h: "Prestataires", items: [
        "Vercel (hébergement, Hong Kong), Alibaba Cloud Model Studio (IA), Amap (cartes et lieux) et Supabase (base de données des plats et des événements anonymes). Ils ne traitent les données que pour fournir ce service.",
      ] },
      { h: "Enfants", items: ["L’appli ne s’adresse pas aux enfants de moins de 13 ans."] },
      { h: "Vos droits et modifications", items: [
        "Nous ne conservons aucune donnée personnelle liée à vous ; il n’y a donc en général rien à consulter ou supprimer de notre côté. Écrivez-nous pour toute question ou demande.",
        "Si cette politique change, nous mettrons à jour cette page et la date ci-dessus.",
      ] },
    ],
    contact: "Contact : {email}",
  },
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: {date}",
    intro: "Haodego (China Travel Buddy) hilft Reisenden in Festlandchina, Speisekarten zu lesen, sich zurechtzufinden, zu bezahlen und zu buchen. Es gibt kein Konto und keine Werbung. Wir verkaufen keine Daten und verfolgen dich nicht über andere Apps oder Websites.",
    sections: [
      { h: "Was auf deinem Telefon bleibt", items: [
        "Passland, Sprache, Währung, Reisedaten und Städte, Allergien und Ernährung, gespeichertes Hotel und Einstellungen werden nur auf deinem Gerät gespeichert.",
        "Deine Allergien werden nie an uns gesendet: Gerichte werden auf deinem Telefon geprüft.",
        "Lösche alles jederzeit unter Einstellungen → Alle Daten löschen oder indem du die App löschst.",
      ] },
      { h: "Was gesendet wird, wenn du eine Funktion nutzt", items: [
        "Fotos von Speisekarten und eingegebene Gerichtnamen werden mit deiner Sprache und Stadt an einen KI-Dienst (Alibaba Cloud Model Studio, Qwen) gesendet und gelesen. Fotos werden danach verworfen und nie gespeichert.",
        "Text, den du übersetzt, und Screenshots von Hotelbuchungen gehen an denselben KI-Dienst und werden nicht gespeichert.",
        "Dein Standort, nur wenn du ihn erlaubst, und Orte, nach denen du suchst, gehen an Amap (高德地图), um Stadt, Orte und Routen zu finden. Wir speichern deinen Standort nicht.",
      ] },
      { h: "Was wir speichern", items: [
        "Allgemeine Angaben zu Gerichten (Namen, übliche Zutaten, Allergene), damit die nächste Abfrage schneller geht. Sie sind nie mit dir verknüpft.",
        "Anonyme Nutzungsereignisse wie „Speisekarte gescannt“ und die Dauer, mit einer zufälligen ID, die sich jede Sitzung ändert. Kein Name, kein Standort, keine Allergien, keine Daten.",
        "Rückmeldungen zu Inhalten (hilfreich, veraltet oder falsch), ohne Angaben zu dir.",
        "Klicks auf Buchungslinks: Wenn du einen Partnerlink (Trip.com, eSIM-Anbieter) antippst, speichern wir Zeit, Partner, Seite, Stadt, eventuelle Reisedaten im Link und den Gerätetyp, um Provisionen abzugleichen. Danach gilt die Datenschutzerklärung des Partners.",
        "Unser Hosting-Anbieter speichert übliche Serverprotokolle einschließlich IP-Adressen für kurze Zeit für Sicherheit und Fehlersuche.",
      ] },
      { h: "Dienstleister", items: [
        "Vercel (Hosting, Hongkong), Alibaba Cloud Model Studio (KI), Amap (Karten und Orte) und Supabase (Datenbank für Gerichte und anonyme Ereignisse). Sie verarbeiten Daten nur, um diesen Dienst zu erbringen.",
      ] },
      { h: "Kinder", items: ["Die App richtet sich nicht an Kinder unter 13 Jahren."] },
      { h: "Deine Rechte und Änderungen", items: [
        "Wir speichern keine personenbezogenen Daten, die mit dir verknüpft sind; bei uns gibt es daher meist nichts nachzuschlagen oder zu löschen. Schreib uns bei Fragen oder Anliegen.",
        "Ändert sich diese Erklärung, aktualisieren wir diese Seite und das Datum oben.",
      ] },
    ],
    contact: "Kontakt: {email}",
  },
  ja: {
    title: "プライバシーポリシー",
    updated: "最終更新日：{date}",
    intro: "Haodego（China Travel Buddy）は、中国本土を訪れる方がメニューを読み、移動し、支払い、予約するためのアプリです。アカウントも広告もありません。データを販売せず、他のアプリやサイトをまたいだ追跡も行いません。",
    sections: [
      { h: "スマートフォンに残るもの", items: [
        "パスポートの国、言語、通貨、旅行の日程と都市、アレルギーと食事制限、保存したホテル、設定は、お使いの端末にのみ保存されます。",
        "アレルギー情報が当社に送られることはありません。料理のチェックは端末上で行います。",
        "設定 →「すべてのデータを消去」、またはアプリの削除で、いつでもすべて削除できます。",
      ] },
      { h: "機能を使うときに送信されるもの", items: [
        "メニューの写真や入力した料理名は、言語と都市とともにAIサービス（Alibaba Cloud Model Studio、Qwen）に送られ、読み取られます。写真は読み取り後に破棄され、保存されません。",
        "翻訳するテキストや、追加したホテル予約のスクリーンショットも同じAIサービスに送られ、保存されません。",
        "位置情報（許可した場合のみ）と検索した場所は、都市・場所・ルートを調べるためにAmap（高德地图）に送られます。位置情報は保存しません。",
      ] },
      { h: "当社が保存するもの", items: [
        "次回すばやく答えるための、料理に関する一般的な情報（名前、通常の材料、アレルゲン）。あなたと結びつけられることはありません。",
        "「メニューを読み取った」とその所要時間などの匿名の利用イベント。セッションごとに変わるランダムなIDのみで、名前・位置・アレルギー・日付は含みません。",
        "コンテンツへのフィードバック（役に立った・古い・間違い）。あなたに関する情報は含みません。",
        "予約リンクのクリック：提携先のリンク（Trip.com、eSIM事業者）をタップすると、手数料の照合のため、日時・提携先・ページ・都市・リンク内の日程・端末の種類を記録します。その後は提携先のプライバシーポリシーが適用されます。",
        "ホスティング事業者は、セキュリティと障害対応のため、IPアドレスを含む標準的なサーバーログを短期間保存します。",
      ] },
      { h: "委託先", items: [
        "Vercel（ホスティング、香港）、Alibaba Cloud Model Studio（AI）、Amap（地図・場所）、Supabase（料理情報と匿名イベントのデータベース）。いずれも本サービスの提供のためにのみデータを処理します。",
      ] },
      { h: "お子さまについて", items: ["本アプリは13歳未満のお子さまを対象としていません。"] },
      { h: "あなたの権利と変更", items: [
        "あなたに結びつく個人データは保存していないため、通常、当社側で確認・削除するものはありません。ご質問やご要望はご連絡ください。",
        "本ポリシーを変更する場合は、このページと上記の日付を更新します。",
      ] },
    ],
    contact: "お問い合わせ：{email}",
  },
  ko: {
    title: "개인정보 처리방침",
    updated: "최종 업데이트: {date}",
    intro: "Haodego(China Travel Buddy)는 중국 본토를 여행하는 분이 메뉴를 읽고, 이동하고, 결제하고, 예약하도록 돕는 앱입니다. 계정도 광고도 없습니다. 데이터를 판매하지 않으며, 다른 앱이나 웹사이트에 걸쳐 추적하지 않습니다.",
    sections: [
      { h: "휴대폰에만 남는 정보", items: [
        "여권 국가, 언어, 통화, 여행 날짜와 도시, 알레르기와 식단, 저장한 호텔, 설정은 기기에만 저장됩니다.",
        "알레르기 정보는 저희에게 전송되지 않습니다. 요리는 휴대폰에서 확인합니다.",
        "설정 → 모든 데이터 삭제 또는 앱 삭제로 언제든 모두 지울 수 있습니다.",
      ] },
      { h: "기능을 쓸 때 전송되는 정보", items: [
        "메뉴 사진과 입력한 요리 이름은 언어·도시와 함께 AI 서비스(Alibaba Cloud Model Studio, Qwen)로 보내져 읽힙니다. 사진은 읽은 뒤 폐기되며 저장되지 않습니다.",
        "번역하는 텍스트와 추가한 호텔 예약 스크린샷도 같은 AI 서비스로 보내지며 저장되지 않습니다.",
        "위치(허용한 경우에만)와 검색한 장소는 도시·장소·경로를 찾기 위해 Amap(高德地图)으로 보내집니다. 위치는 저장하지 않습니다.",
      ] },
      { h: "저희가 보관하는 정보", items: [
        "다음 조회를 빠르게 하기 위한 요리에 관한 일반 정보(이름, 보통 들어가는 재료, 알레르기 유발 성분). 사용자와 연결되지 않습니다.",
        "'메뉴 스캔'과 걸린 시간 같은 익명 사용 이벤트. 세션마다 바뀌는 무작위 ID만 있고 이름·위치·알레르기·날짜는 없습니다.",
        "콘텐츠에 대한 피드백(도움 됨, 오래됨, 틀림). 사용자에 관한 정보는 없습니다.",
        "예약 링크 클릭: 제휴 링크(Trip.com, eSIM 업체)를 누르면 수수료 정산을 위해 시간·제휴사·페이지·도시·링크의 여행 날짜·기기 종류를 기록합니다. 이후에는 제휴사의 개인정보 처리방침이 적용됩니다.",
        "호스팅 업체는 보안과 문제 해결을 위해 IP 주소를 포함한 일반 서버 로그를 짧은 기간 보관합니다.",
      ] },
      { h: "서비스 제공업체", items: [
        "Vercel(호스팅, 홍콩), Alibaba Cloud Model Studio(AI), Amap(지도·장소), Supabase(요리 정보와 익명 이벤트 데이터베이스). 이 서비스 제공을 위해서만 데이터를 처리합니다.",
      ] },
      { h: "아동", items: ["이 앱은 13세 미만 아동을 대상으로 하지 않습니다."] },
      { h: "권리와 변경", items: [
        "사용자와 연결된 개인정보를 보관하지 않으므로, 보통 저희 쪽에서 조회하거나 삭제할 것이 없습니다. 질문이나 요청은 연락 주세요.",
        "이 방침이 바뀌면 이 페이지와 위 날짜를 업데이트합니다.",
      ] },
    ],
    contact: "문의: {email}",
  },
};

const SUPPORT: Record<string, Support> = {
  en: {
    title: "Help & support",
    contactH: "Contact us",
    contactBody: "Questions, problems or a dish we got wrong: write to {email}. We read every message.",
    faqH: "Common questions",
    faq: [
      { q: "The menu reader got a dish wrong", a: "Open the dish and tap “This dish info is wrong”; we check it again. Ingredients are inferred from the usual recipe, so with an allergy always show your allergy card and confirm with staff." },
      { q: "Alipay or WeChat doesn’t open", a: "Install the app and finish its phone-number verification before you travel. If it’s installed and nothing happens, open it yourself and use the steps shown in Haodego." },
      { q: "My location isn’t found", a: "Allow location for Haodego in iPhone Settings → Privacy & Security → Location Services. Search and the taxi card work without it." },
      { q: "How do I delete my data?", a: "Settings → Clear all data, or delete the app. Everything about your trip is stored only on your phone." },
    ],
    privacy: "Privacy policy",
  },
  es: {
    title: "Ayuda y soporte",
    contactH: "Contacto",
    contactBody: "Preguntas, problemas o un plato que hayamos leído mal: escribe a {email}. Leemos todos los mensajes.",
    faqH: "Preguntas frecuentes",
    faq: [
      { q: "El lector de cartas se equivocó con un plato", a: "Abre el plato y pulsa «La información de este plato es incorrecta»; lo revisaremos. Los ingredientes se deducen de la receta habitual, así que con una alergia muestra siempre tu tarjeta de alergias y confírmalo con el personal." },
      { q: "Alipay o WeChat no se abren", a: "Instala la app y completa la verificación del número de teléfono antes de viajar. Si está instalada y no pasa nada, ábrela tú y sigue los pasos que muestra Haodego." },
      { q: "No encuentra mi ubicación", a: "Permite la ubicación para Haodego en Ajustes del iPhone → Privacidad y seguridad → Localización. La búsqueda y la tarjeta para el taxista funcionan sin ella." },
      { q: "¿Cómo borro mis datos?", a: "Ajustes → Borrar todos los datos, o elimina la app. Todo lo de tu viaje se guarda solo en tu teléfono." },
    ],
    privacy: "Política de privacidad",
  },
  fr: {
    title: "Aide et assistance",
    contactH: "Nous contacter",
    contactBody: "Questions, problèmes ou plat mal lu : écrivez à {email}. Nous lisons chaque message.",
    faqH: "Questions fréquentes",
    faq: [
      { q: "Le lecteur de menus s’est trompé sur un plat", a: "Ouvrez le plat et touchez « Les infos sur ce plat sont fausses » ; nous le revérifions. Les ingrédients sont déduits de la recette habituelle : en cas d’allergie, montrez toujours votre carte d’allergies et confirmez auprès du personnel." },
      { q: "Alipay ou WeChat ne s’ouvre pas", a: "Installez l’appli et terminez la vérification du numéro de téléphone avant le voyage. Si elle est installée et que rien ne se passe, ouvrez-la vous-même et suivez les étapes affichées dans Haodego." },
      { q: "Ma position n’est pas trouvée", a: "Autorisez la localisation pour Haodego dans Réglages de l’iPhone → Confidentialité et sécurité → Service de localisation. La recherche et la carte taxi fonctionnent sans." },
      { q: "Comment supprimer mes données ?", a: "Réglages → Effacer toutes les données, ou supprimez l’appli. Tout ce qui concerne votre voyage est stocké uniquement sur votre téléphone." },
    ],
    privacy: "Politique de confidentialité",
  },
  de: {
    title: "Hilfe und Support",
    contactH: "Kontakt",
    contactBody: "Fragen, Probleme oder ein falsch gelesenes Gericht: schreib an {email}. Wir lesen jede Nachricht.",
    faqH: "Häufige Fragen",
    faq: [
      { q: "Ein Gericht wurde falsch erkannt", a: "Öffne das Gericht und tippe auf „Die Angaben zu diesem Gericht stimmen nicht“; wir prüfen es erneut. Zutaten werden aus dem üblichen Rezept abgeleitet: Zeig bei Allergien immer deine Allergiekarte und frag beim Personal nach." },
      { q: "Alipay oder WeChat öffnet sich nicht", a: "Installiere die App und schließe die Telefonnummer-Bestätigung vor der Reise ab. Ist sie installiert und nichts passiert, öffne sie selbst und folge den Schritten in Haodego." },
      { q: "Mein Standort wird nicht gefunden", a: "Erlaube Haodego den Standort unter iPhone-Einstellungen → Datenschutz & Sicherheit → Ortungsdienste. Suche und Taxikarte funktionieren auch ohne." },
      { q: "Wie lösche ich meine Daten?", a: "Einstellungen → Alle Daten löschen, oder die App löschen. Alles zu deiner Reise ist nur auf deinem Telefon gespeichert." },
    ],
    privacy: "Datenschutzerklärung",
  },
  ja: {
    title: "ヘルプとサポート",
    contactH: "お問い合わせ",
    contactBody: "ご質問、不具合、料理の読み違いなどは {email} までご連絡ください。すべてのメッセージに目を通します。",
    faqH: "よくある質問",
    faq: [
      { q: "料理の読み取りが間違っていた", a: "料理を開いて「この料理の情報が間違っている」をタップしてください。再確認します。材料は一般的なレシピからの推定なので、アレルギーがある場合は必ずアレルギーカードを見せて店員に確認してください。" },
      { q: "AlipayやWeChatが開かない", a: "出発前にアプリをインストールし、電話番号の認証を済ませてください。インストール済みで何も起きない場合は、アプリを自分で開き、Haodegoに表示される手順に従ってください。" },
      { q: "現在地が見つからない", a: "iPhoneの設定 → プライバシーとセキュリティ → 位置情報サービスで、Haodegoに位置情報を許可してください。検索とタクシーカードは位置情報なしでも使えます。" },
      { q: "データを削除するには？", a: "設定 →「すべてのデータを消去」、またはアプリを削除してください。旅行に関する情報はすべて端末にのみ保存されています。" },
    ],
    privacy: "プライバシーポリシー",
  },
  ko: {
    title: "도움말 및 지원",
    contactH: "문의하기",
    contactBody: "질문, 문제, 잘못 읽은 요리가 있으면 {email}로 연락 주세요. 모든 메시지를 읽습니다.",
    faqH: "자주 묻는 질문",
    faq: [
      { q: "메뉴 읽기에서 요리를 잘못 알려 줬어요", a: "요리를 열고 '이 요리 정보가 틀렸어요'를 누르면 다시 확인합니다. 재료는 일반적인 조리법에서 추정한 것이므로, 알레르기가 있으면 항상 알레르기 카드를 보여 주고 직원에게 확인하세요." },
      { q: "Alipay나 WeChat이 열리지 않아요", a: "여행 전에 앱을 설치하고 전화번호 인증을 마치세요. 설치되어 있는데 아무 일도 없으면 직접 앱을 열고 Haodego에 나온 순서를 따르세요." },
      { q: "내 위치를 찾지 못해요", a: "iPhone 설정 → 개인정보 보호 및 보안 → 위치 서비스에서 Haodego의 위치 접근을 허용하세요. 검색과 택시 카드는 위치 없이도 쓸 수 있어요." },
      { q: "데이터는 어떻게 지우나요?", a: "설정 → 모든 데이터 삭제, 또는 앱을 삭제하세요. 여행 정보는 모두 휴대폰에만 저장됩니다." },
    ],
    privacy: "개인정보 처리방침",
  },
};

export const privacyText = (lang: string) => PRIVACY[lang] ?? PRIVACY.en;
export const supportText = (lang: string) => SUPPORT[lang] ?? SUPPORT.en;
