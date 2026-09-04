/** Minimal i18n: `t(lang, key, vars)` over a static translation table for the bot's
 * static texts. Commands, @usernames, "Stars"/"Pro" and links are kept as-is inside
 * each translation; only prose is localized. Never interpolate user content into a
 * Markdown-parsed string here — `start` and `help` are the only Markdown texts below
 * and neither carries a user-provided field (`{link}` is built from a numeric id). */

export type Lang = "en" | "ru" | "es" | "pt" | "id" | "de" | "tr" | "uk" | "fa" | "ar" | "hi";
const LANGS: Lang[] = ["en", "ru", "es", "pt", "id", "de", "tr", "uk", "fa", "ar", "hi"];
type Vars = Record<string, string | number>;

/** Telegram's `language_code` is a free-form BCP-47 tag ("en", "pt-BR", ...); we only
 * key on the first two letters and fall back to English for anything unsupported. */
export function langOf(code: string | undefined | null): Lang {
  const two = (code ?? "").slice(0, 2).toLowerCase();
  return (LANGS as string[]).includes(two) ? (two as Lang) : "en";
}

const TABLE: Record<Lang, Record<string, string>> = {
  en: {
    prompts: "💬 Ask me anything\n🎧 Roast my playlist\n📸 Rate my last photo\n🔥 Tell me something you'd never say to my face\n🎬 What show should I watch next?",
    guestPitch: "📮 Anonymous messages, right inside Telegram — anyone can write to you, you never see who. Open me to get your own link.",
    guestGroupPitch: "📮 AnonInbox — anyone in this group can get their own anonymous inbox. Messages go straight to your private chat, senders stay hidden. Open me to get your link.",
    start: "📮 Your anonymous inbox is live.\nPut this link in your bio or story — anyone can write to you, you never see who.\n`{link}`\nMessages land right here.",
    help: "📮 *AnonInbox — commands*\n/start (or /link) — get your anonymous inbox link\n/story — a ready-to-paste line for your bio or story\n/prompts — icebreaker questions to post next to your link\n/pro — sender hints + unlimited replies, one-time {proStars} ⭐\n/more — more free tools by the same maker",
    writeMessagePrompt: "✍️ Write your anonymous message to {name}. They will not see who you are.",
    rateLimited: "Slow down: {n} anonymous messages per hour.",
    replyLimited: "Free plan: {n} replies a day. Pro replies without limits.",
    tooLong: "Too long: {len}/{max} characters.",
    proThanks: "✅ Pro unlocked: sender hints and unlimited replies. Thank you.\n\n/more — more free tools",
    btn_openAnonPrivate: "Open AnonInbox in private",
    btn_shareMyLink: "📤 Share my link",
    btn_shareBot: "📣 Share this bot",
    btn_unlockPro: "Unlock Pro",
    btn_unlockProStars: "Unlock Pro, {stars} ⭐",
  },
  ru: {
    prompts: "💬 Спроси меня о чём угодно\n🎧 Раскритикуй мой плейлист\n📸 Оцени моё последнее фото\n🔥 Скажи то, что никогда бы не сказал(а) мне в лицо\n🎬 Какой сериал мне посмотреть дальше?",
    guestPitch: "📮 Анонимные сообщения прямо в Telegram — любой может написать вам, а вы не увидите, кто это. Откройте меня, чтобы получить свою ссылку.",
    guestGroupPitch: "📮 AnonInbox — любой в этой группе может завести свой анонимный чат. Сообщения приходят прямо вам в личку, отправитель остаётся скрытым. Откройте меня, чтобы получить свою ссылку.",
    start: "📮 Ваш анонимный чат уже работает.\nВставьте эту ссылку в био или историю — любой сможет написать вам, а вы не увидите, кто это.\n`{link}`\nСообщения приходят прямо сюда.",
    help: "📮 *AnonInbox — команды*\n/start (или /link) — получить свою ссылку\n/story — короткая готовая подпись для био или истории\n/prompts — вопросы для затравки рядом со ссылкой\n/pro — подсказки об отправителе и ответы без ограничений, разовый платёж {proStars} ⭐\n/more — другие бесплатные инструменты",
    writeMessagePrompt: "✍️ Напишите анонимное сообщение для {name}. Он(а) не узнает, кто вы.",
    rateLimited: "Не так быстро: {n} анонимных сообщений в час.",
    replyLimited: "Бесплатный план: {n} ответов в день. С Pro — без ограничений.",
    tooLong: "Слишком длинно: {len}/{max} символов.",
    proThanks: "✅ Pro активирован: подсказки об отправителе и ответы без ограничений. Спасибо.\n\n/more — другие бесплатные инструменты",
    btn_openAnonPrivate: "Открыть AnonInbox в личке",
    btn_shareMyLink: "📤 Поделиться ссылкой",
    btn_shareBot: "📣 Поделиться ботом",
    btn_unlockPro: "Открыть Pro",
    btn_unlockProStars: "Открыть Pro, {stars} ⭐",
  },
  es: {
    prompts: "💬 Pregúntame lo que sea\n🎧 Critica mi playlist\n📸 Califica mi última foto\n🔥 Dime algo que nunca me dirías a la cara\n🎬 ¿Qué serie debería ver ahora?",
    guestPitch: "📮 Mensajes anónimos, dentro de Telegram — cualquiera puede escribirte, tú nunca sabrás quién es. Ábreme para conseguir tu propio enlace.",
    guestGroupPitch: "📮 AnonInbox — cualquiera en este grupo puede tener su propia bandeja anónima. Los mensajes llegan directo a tu chat privado, el remitente queda oculto. Ábreme para conseguir tu enlace.",
    start: "📮 Tu bandeja anónima ya está activa.\nPon este enlace en tu bio o historia — cualquiera puede escribirte, tú nunca sabrás quién es.\n`{link}`\nLos mensajes llegan justo aquí.",
    help: "📮 *AnonInbox — comandos*\n/start (o /link) — obtén tu enlace\n/story — una línea lista para pegar en tu bio o historia\n/prompts — preguntas para romper el hielo junto a tu enlace\n/pro — pistas del remitente y respuestas sin límite, pago único de {proStars} ⭐\n/more — más herramientas gratis",
    writeMessagePrompt: "✍️ Escribe tu mensaje anónimo para {name}. No sabrá quién eres.",
    rateLimited: "Más despacio: {n} mensajes anónimos por hora.",
    replyLimited: "Plan gratis: {n} respuestas al día. Con Pro, sin límites.",
    tooLong: "Demasiado largo: {len}/{max} caracteres.",
    proThanks: "✅ Pro activado: pistas sobre el remitente y respuestas sin límite. Gracias.\n\n/more — más herramientas gratis",
    btn_openAnonPrivate: "Abrir AnonInbox en privado",
    btn_shareMyLink: "📤 Compartir mi enlace",
    btn_shareBot: "📣 Compartir este bot",
    btn_unlockPro: "Desbloquear Pro",
    btn_unlockProStars: "Desbloquear Pro, {stars} ⭐",
  },
  pt: {
    prompts: "💬 Me pergunte qualquer coisa\n🎧 Detone minha playlist\n📸 Avalie minha última foto\n🔥 Me diga algo que nunca diria na minha cara\n🎬 Que série eu deveria assistir agora?",
    guestPitch: "📮 Mensagens anônimas, direto no Telegram — qualquer um pode te escrever, e você nunca vê quem é. Me abra para conseguir seu próprio link.",
    guestGroupPitch: "📮 AnonInbox — qualquer um neste grupo pode ter sua própria caixa anônima. As mensagens chegam direto no seu chat privado, o remetente fica oculto. Me abra para conseguir seu link.",
    start: "📮 Sua caixa anônima já está ativa.\nColoque este link na sua bio ou story — qualquer um pode te escrever, e você nunca vê quem é.\n`{link}`\nAs mensagens chegam bem aqui.",
    help: "📮 *AnonInbox — comandos*\n/start (ou /link) — pegue seu link\n/story — uma linha pronta para colar na bio ou story\n/prompts — perguntas para puxar assunto ao lado do seu link\n/pro — dicas do remetente e respostas ilimitadas, pagamento único de {proStars} ⭐\n/more — mais ferramentas grátis",
    writeMessagePrompt: "✍️ Escreva sua mensagem anônima para {name}. Ele(a) não vai saber quem você é.",
    rateLimited: "Devagar: {n} mensagens anônimas por hora.",
    replyLimited: "Plano grátis: {n} respostas por dia. Com Pro, sem limites.",
    tooLong: "Muito longo: {len}/{max} caracteres.",
    proThanks: "✅ Pro ativado: dicas sobre o remetente e respostas ilimitadas. Obrigado.\n\n/more — mais ferramentas grátis",
    btn_openAnonPrivate: "Abrir AnonInbox no privado",
    btn_shareMyLink: "📤 Compartilhar meu link",
    btn_shareBot: "📣 Compartilhar este bot",
    btn_unlockPro: "Desbloquear Pro",
    btn_unlockProStars: "Desbloquear Pro, {stars} ⭐",
  },
  id: {
    prompts: "💬 Tanyakan apa saja\n🎧 Kritik playlist aku\n📸 Nilai foto terakhirku\n🔥 Katakan sesuatu yang tidak akan kamu ucapkan langsung ke aku\n🎬 Serial apa yang harus kutonton berikutnya?",
    guestPitch: "📮 Pesan anonim, langsung di Telegram — siapa pun bisa menulis kepadamu, kamu tidak akan tahu siapa dia. Buka aku untuk dapat linkmu sendiri.",
    guestGroupPitch: "📮 AnonInbox — siapa pun di grup ini bisa punya kotak masuk anonim sendiri. Pesan langsung masuk ke chat pribadimu, pengirim tetap tersembunyi. Buka aku untuk dapat linkmu.",
    start: "📮 Kotak masuk anonim kamu sudah aktif.\nTaruh link ini di bio atau story — siapa saja bisa menulis ke kamu, kamu tidak akan tahu siapa dia.\n`{link}`\nPesan akan langsung masuk ke sini.",
    help: "📮 *AnonInbox — perintah*\n/start (atau /link) — dapatkan link kamu\n/story — kalimat siap pakai untuk bio atau story\n/prompts — pertanyaan pembuka untuk dipasang di samping link kamu\n/pro — petunjuk pengirim + balasan tanpa batas, bayar sekali {proStars} ⭐\n/more — alat gratis lainnya",
    writeMessagePrompt: "✍️ Tulis pesan anonim kamu untuk {name}. Mereka tidak akan tahu siapa kamu.",
    rateLimited: "Pelan-pelan: {n} pesan anonim per jam.",
    replyLimited: "Paket gratis: {n} balasan per hari. Pro tanpa batas.",
    tooLong: "Terlalu panjang: {len}/{max} karakter.",
    proThanks: "✅ Pro aktif: petunjuk pengirim dan balasan tanpa batas. Terima kasih.\n\n/more — alat gratis lainnya",
    btn_openAnonPrivate: "Buka AnonInbox secara pribadi",
    btn_shareMyLink: "📤 Bagikan link saya",
    btn_shareBot: "📣 Bagikan bot ini",
    btn_unlockPro: "Buka Pro",
    btn_unlockProStars: "Buka Pro, {stars} ⭐",
  },
  de: {
    prompts: "💬 Frag mich alles\n🎧 Verreiß meine Playlist\n📸 Bewerte mein letztes Foto\n🔥 Sag mir etwas, das du mir nie ins Gesicht sagen würdest\n🎬 Welche Serie soll ich als Nächstes schauen?",
    guestPitch: "📮 Anonyme Nachrichten, direkt in Telegram — jeder kann dir schreiben, du siehst nie, wer es ist. Öffne mich für deinen eigenen Link.",
    guestGroupPitch: "📮 AnonInbox — jeder in dieser Gruppe kann sein eigenes anonymes Postfach bekommen. Nachrichten landen direkt in deinem privaten Chat, der Absender bleibt verborgen. Öffne mich für deinen Link.",
    start: "📮 Dein anonymer Posteingang ist aktiv.\nSetz diesen Link in deine Bio oder Story — jeder kann dir schreiben, du siehst nie, wer es war.\n`{link}`\nNachrichten landen direkt hier.",
    help: "📮 *AnonInbox — Befehle*\n/start (oder /link) — deinen Link abrufen\n/story — eine fertige Zeile für Bio oder Story\n/prompts — Eisbrecher-Fragen für neben deinen Link\n/pro — Absender-Hinweise + unbegrenzte Antworten, einmalig {proStars} ⭐\n/more — weitere kostenlose Tools",
    writeMessagePrompt: "✍️ Schreib deine anonyme Nachricht an {name}. Er/sie erfährt nicht, wer du bist.",
    rateLimited: "Langsamer: {n} anonyme Nachrichten pro Stunde.",
    replyLimited: "Kostenlos: {n} Antworten pro Tag. Mit Pro unbegrenzt.",
    tooLong: "Zu lang: {len}/{max} Zeichen.",
    proThanks: "✅ Pro freigeschaltet: Absender-Hinweise und unbegrenzte Antworten. Danke.\n\n/more — weitere kostenlose Tools",
    btn_openAnonPrivate: "AnonInbox privat öffnen",
    btn_shareMyLink: "📤 Meinen Link teilen",
    btn_shareBot: "📣 Diesen Bot teilen",
    btn_unlockPro: "Pro freischalten",
    btn_unlockProStars: "Pro freischalten, {stars} ⭐",
  },
  tr: {
    prompts: "💬 Bana istediğini sor\n🎧 Çalma listemi eleştir\n📸 Son fotoğrafımı değerlendir\n🔥 Yüzüme asla söylemeyeceğin bir şey söyle\n🎬 Sırada hangi diziyi izlemeliyim?",
    guestPitch: "📮 Anonim mesajlar, doğrudan Telegram içinde — herkes sana yazabilir, kimden geldiğini asla göremezsin. Kendi linkini almak için beni aç.",
    guestGroupPitch: "📮 AnonInbox — bu gruptaki herkes kendi anonim gelen kutusunu alabilir. Mesajlar doğrudan senin özel sohbetine gelir, gönderen gizli kalır. Linkini almak için beni aç.",
    start: "📮 Anonim gelen kutun artık aktif.\nBu bağlantıyı bio veya story'ne koy — herkes sana yazabilir, sen kim olduğunu asla göremezsin.\n`{link}`\nMesajlar tam buraya düşer.",
    help: "📮 *AnonInbox — komutlar*\n/start (veya /link) — bağlantını al\n/story — bio veya story'ne yapıştırmaya hazır tek satır\n/prompts — bağlantının yanına eklenecek buz kırıcı sorular\n/pro — gönderen ipuçları + sınırsız yanıt, tek seferlik {proStars} ⭐\n/more — daha fazla ücretsiz araç",
    writeMessagePrompt: "✍️ {name} için anonim mesajını yaz. Kim olduğunu göremeyecek.",
    rateLimited: "Yavaş ol: saatte {n} anonim mesaj.",
    replyLimited: "Ücretsiz plan: günde {n} yanıt. Pro ile sınırsız.",
    tooLong: "Çok uzun: {len}/{max} karakter.",
    proThanks: "✅ Pro açıldı: gönderen ipuçları ve sınırsız yanıt. Teşekkürler.\n\n/more — daha fazla ücretsiz araç",
    btn_openAnonPrivate: "AnonInbox'u özelden aç",
    btn_shareMyLink: "📤 Bağlantımı paylaş",
    btn_shareBot: "📣 Bu botu paylaş",
    btn_unlockPro: "Pro'yu aç",
    btn_unlockProStars: "Pro'yu aç, {stars} ⭐",
  },
  uk: {
    prompts: "💬 Запитай мене про що завгодно\n🎧 Розкритикуй мій плейлист\n📸 Оціни моє останнє фото\n🔥 Скажи те, що ніколи б не сказав(-ла) мені в очі\n🎬 Який серіал мені подивитися далі?",
    guestPitch: "📮 Анонімні повідомлення прямо в Telegram — будь-хто може написати вам, а ви не побачите, хто це. Відкрийте мене, щоб отримати власне посилання.",
    guestGroupPitch: "📮 AnonInbox — будь-хто в цій групі може отримати власний анонімний чат. Повідомлення надходять прямо у ваш особистий чат, відправник лишається прихованим. Відкрийте мене, щоб отримати посилання.",
    start: "📮 Твоя анонімна скринька вже працює.\nВстав це посилання в біо чи історію — будь-хто зможе написати тобі, а ти ніколи не побачиш, хто це.\n`{link}`\nПовідомлення приходять прямо сюди.",
    help: "📮 *AnonInbox — команди*\n/start (або /link) — отримати своє посилання\n/story — короткий готовий підпис для біо чи історії\n/prompts — питання для розмови поруч із посиланням\n/pro — підказки про відправника й відповіді без обмежень, разовий платіж {proStars} ⭐\n/more — інші безкоштовні інструменти",
    writeMessagePrompt: "✍️ Напиши анонімне повідомлення для {name}. Він(вона) не дізнається, хто ти.",
    rateLimited: "Повільніше: {n} анонімних повідомлень на годину.",
    replyLimited: "Безкоштовний план: {n} відповідей на день. З Pro — без обмежень.",
    tooLong: "Задовго: {len}/{max} символів.",
    proThanks: "✅ Pro активовано: підказки про відправника й відповіді без обмежень. Дякуємо.\n\n/more — інші безкоштовні інструменти",
    btn_openAnonPrivate: "Відкрити AnonInbox у приваті",
    btn_shareMyLink: "📤 Поділитися посиланням",
    btn_shareBot: "📣 Поділитися ботом",
    btn_unlockPro: "Відкрити Pro",
    btn_unlockProStars: "Відкрити Pro, {stars} ⭐",
  },
  fa: {
    prompts: "💬 هر چیزی می‌خواهی از من بپرس\n🎧 پلی‌لیستم را نقد کن\n📸 آخرین عکسم را نمره بده\n🔥 چیزی بگو که هرگز روبه‌رو به من نمی‌گفتی\n🎬 کدام سریال را بعدی ببینم؟",
    guestPitch: "📮 پیام‌های ناشناس، درست داخل تلگرام — هرکسی می‌تواند برایتان بنویسد، بدون اینکه بدانید چه کسی است. مرا باز کنید تا لینک خودتان را بگیرید.",
    guestGroupPitch: "📮 AnonInbox — هرکسی در این گروه می‌تواند صندوق ناشناس خودش را داشته باشد. پیام‌ها مستقیم به چت خصوصی شما می‌رسند و فرستنده پنهان می‌ماند. مرا باز کنید تا لینک خودتان را بگیرید.",
    start: "📮 صندوق پیام ناشناس شما فعال است.\nاین لینک را در بیو یا استوری‌تان بگذارید — هرکسی می‌تواند برایتان بنویسد و شما هرگز نمی‌بینید کیست.\n`{link}`\nپیام‌ها درست همین‌جا می‌رسند.",
    help: "📮 *AnonInbox — دستورها*\n/start (یا /link) — لینک خود را بگیرید\n/story — یک خط آماده برای بیو یا استوری\n/prompts — سؤال‌های یخ‌شکن برای کنار لینک شما\n/pro — نشانه‌های فرستنده + پاسخ نامحدود، پرداخت یک‌باره {proStars} ⭐\n/more — ابزارهای رایگان بیشتر",
    writeMessagePrompt: "✍️ پیام ناشناس خود را برای {name} بنویسید. او نمی‌فهمد شما چه کسی هستید.",
    rateLimited: "آرام‌تر: {n} پیام ناشناس در ساعت.",
    replyLimited: "طرح رایگان: {n} پاسخ در روز. با Pro بدون محدودیت.",
    tooLong: "خیلی طولانی: {len}/{max} نویسه.",
    proThanks: "✅ Pro فعال شد: نشانه‌های فرستنده و پاسخ نامحدود. متشکریم.\n\n/more — ابزارهای رایگان بیشتر",
    btn_openAnonPrivate: "باز کردن AnonInbox در خصوصی",
    btn_shareMyLink: "📤 اشتراک‌گذاری لینکم",
    btn_shareBot: "📣 اشتراک‌گذاری این ربات",
    btn_unlockPro: "فعال‌سازی Pro",
    btn_unlockProStars: "فعال‌سازی Pro، {stars} ⭐",
  },
  ar: {
    prompts: "💬 اسألني أي شيء\n🎧 انتقد قائمة تشغيلي\n📸 قيّم آخر صورة لي\n🔥 قل لي شيئًا لن تقوله لي في وجهي أبدًا\n🎬 أي مسلسل يجب أن أشاهده بعد ذلك؟",
    guestPitch: "📮 رسائل مجهولة، مباشرة داخل تيليجرام — يمكن لأي شخص أن يكتب لك، ولن ترى من هو. افتحني للحصول على رابطك الخاص.",
    guestGroupPitch: "📮 AnonInbox — يمكن لأي شخص في هذه المجموعة الحصول على صندوق رسائل مجهول خاص به. تصل الرسائل مباشرة إلى محادثتك الخاصة، ويبقى المرسل مجهولاً. افتحني للحصول على رابطك.",
    start: "📮 صندوق رسائلك المجهولة جاهز.\nضع هذا الرابط في البايو أو القصة — يمكن لأي شخص مراسلتك، ولن ترى من هو أبدًا.\n`{link}`\nتصلك الرسائل هنا مباشرة.",
    help: "📮 *AnonInbox — الأوامر*\n/start (أو /link) — احصل على رابطك\n/story — سطر جاهز للصق في البايو أو القصة\n/prompts — أسئلة لكسر الجليد بجانب رابطك\n/pro — تلميحات المرسل + ردود بلا حدود، دفعة واحدة {proStars} ⭐\n/more — أدوات مجانية أخرى",
    writeMessagePrompt: "✍️ اكتب رسالتك المجهولة إلى {name}. لن يعرف من أنت.",
    rateLimited: "تمهّل: {n} رسالة مجهولة في الساعة.",
    replyLimited: "الخطة المجانية: {n} ردود يوميًا. مع Pro بلا حدود.",
    tooLong: "طويل جدًا: {len}/{max} حرفًا.",
    proThanks: "✅ تم تفعيل Pro: تلميحات عن المرسل وردود بلا حدود. شكرًا لك.\n\n/more — أدوات مجانية أخرى",
    btn_openAnonPrivate: "فتح AnonInbox في الخاص",
    btn_shareMyLink: "📤 مشاركة رابطي",
    btn_shareBot: "📣 مشاركة هذا البوت",
    btn_unlockPro: "تفعيل Pro",
    btn_unlockProStars: "تفعيل Pro، {stars} ⭐",
  },
  hi: {
    prompts: "💬 मुझसे कुछ भी पूछें\n🎧 मेरी प्लेलिस्ट की खिंचाई करें\n📸 मेरी आखिरी फोटो को रेट करें\n🔥 मुझे कुछ ऐसा बताएं जो आप मेरे सामने कभी नहीं कहेंगे\n🎬 मुझे आगे कौन सा शो देखना चाहिए?",
    guestPitch: "📮 गुमनाम संदेश, सीधे टेलीग्राम में — कोई भी आपको लिख सकता है, आप कभी नहीं देखेंगे कौन है। अपना खुद का लिंक पाने के लिए मुझे खोलें।",
    guestGroupPitch: "📮 AnonInbox — इस ग्रुप में कोई भी अपना खुद का गुमनाम इनबॉक्स पा सकता है। संदेश सीधे आपकी निजी चैट में आते हैं, भेजने वाला छिपा रहता है। अपना लिंक पाने के लिए मुझे खोलें।",
    start: "📮 आपका अनाम इनबॉक्स चालू है।\nयह लिंक अपनी बायो या स्टोरी में डालें — कोई भी आपको लिख सकता है, आपको कभी पता नहीं चलेगा कि वह कौन है।\n`{link}`\nसंदेश सीधे यहीं आएंगे।",
    help: "📮 *AnonInbox — कमांड*\n/start (या /link) — अपना लिंक पाएं\n/story — बायो या स्टोरी के लिए तैयार लाइन\n/prompts — अपने लिंक के पास लगाने के लिए आइसब्रेकर सवाल\n/pro — भेजने वाले के संकेत + असीमित जवाब, एकमुश्त {proStars} ⭐\n/more — और मुफ़्त टूल",
    writeMessagePrompt: "✍️ {name} के लिए अपना अनाम संदेश लिखें। उन्हें पता नहीं चलेगा कि आप कौन हैं।",
    rateLimited: "धीरे: प्रति घंटा {n} अनाम संदेश।",
    replyLimited: "फ्री प्लान: रोज़ाना {n} जवाब। Pro में कोई सीमा नहीं।",
    tooLong: "बहुत लंबा: {len}/{max} अक्षर।",
    proThanks: "✅ Pro सक्रिय: भेजने वाले के संकेत और असीमित जवाब। धन्यवाद।\n\n/more — और मुफ़्त टूल",
    btn_openAnonPrivate: "AnonInbox निजी में खोलें",
    btn_shareMyLink: "📤 अपना लिंक शेयर करें",
    btn_shareBot: "📣 यह बॉट शेयर करें",
    btn_unlockPro: "Pro अनलॉक करें",
    btn_unlockProStars: "Pro अनलॉक करें, {stars} ⭐",
  },
};

function sub(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Look up `key` for `lang`, falling back to English for an unknown language or a
 * key missing from that language's table, then substitute `{var}` placeholders. */
export function t(lang: string | undefined | null, key: string, vars?: Vars): string {
  const l = langOf(lang);
  const raw = TABLE[l][key] ?? TABLE.en[key] ?? key;
  return sub(raw, vars);
}
