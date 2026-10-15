import type { IconName } from '@/components/ui/Icon';

// The in-app guide: what every part of English Coach does and how to use it, for a learner who knows no English at all up to an
// advanced one. Every text is written three times (simple English, French, Arabic): the app itself is in English, so a
// beginner reads the guide in their own language. A test checks that nothing is missing in any language.

export type Lang = 'en' | 'fr' | 'ar';
export type T = Record<Lang, string>;

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية' },
];

export type SectionId =
  | 'welcome'
  | 'setup'
  | 'key'
  | 'level'
  | 'interests'
  | 'chat'
  | 'voice'
  | 'grammar'
  | 'phrases'
  | 'review'
  | 'topics'
  | 'progress'
  | 'settings'
  | 'plan'
  | 'words'
  | 'help';

export type Block =
  | { type: 'p'; text: T }
  | { type: 'steps'; title?: T; items: T[] }
  | { type: 'bullets'; title?: T; items: T[] }
  | { type: 'tip'; text: T }
  | { type: 'warn'; text: T }
  | { type: 'link'; label: T; url: string }
  | { type: 'levels' }
  | { type: 'plan' }
  | { type: 'glossary' }
  | { type: 'faq'; items: { q: T; a: T }[] };

/** Where the "Open" button of a section goes. `tab` screens are tabs of the main screen; the others are separate screens. */
export type Go = { label: T; href: '/chat' | '/grammar' | '/phrases' | '/review' | '/topics' | '/settings' | '/placement' | '/interests' | '/progress'; tab: boolean };

export type Section = { id: SectionId; icon: IconName; title: T; summary: T; blocks: Block[]; go?: Go };

const t = (en: string, fr: string, ar: string): T => ({ en, fr, ar });

// ---------------------------------------------------------------------------------------------------------------------
// The six levels, in plain words
// ---------------------------------------------------------------------------------------------------------------------

export const LEVEL_IDS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export const LEVELS_INFO: Record<LevelId, { name: T; canDo: T }> = {
  A1: {
    name: t('Beginner', 'Débutant', 'مبتدئ'),
    canDo: t(
      'You know a few words and very simple sentences: “Hello”, “My name is…”, “I like…”.',
      'Vous connaissez quelques mots et des phrases très simples : « Hello », « My name is… », « I like… ».',
      'تعرف بعض الكلمات وجملًا بسيطة جدًا: «Hello» و«My name is…» و«I like…».',
    ),
  },
  A2: {
    name: t('Elementary', 'Élémentaire', 'أساسي'),
    canDo: t(
      'You can talk about daily life in simple sentences: family, shopping, work, yesterday, tomorrow.',
      'Vous parlez de la vie de tous les jours avec des phrases simples : famille, courses, travail, hier, demain.',
      'تستطيع الحديث عن الحياة اليومية بجمل بسيطة: العائلة والتسوّق والعمل وأمس وغدًا.',
    ),
  },
  B1: {
    name: t('Intermediate', 'Intermédiaire', 'متوسط'),
    canDo: t(
      'You can manage most situations when you travel, and talk about experiences, plans and opinions.',
      'Vous vous débrouillez dans la plupart des situations en voyage et vous parlez d’expériences, de projets et d’opinions.',
      'تتدبّر أمرك في معظم مواقف السفر، وتتحدث عن التجارب والخطط والآراء.',
    ),
  },
  B2: {
    name: t('Upper-intermediate', 'Intermédiaire supérieur', 'فوق المتوسط'),
    canDo: t(
      'You talk with native speakers quite easily and explain your ideas clearly.',
      'Vous discutez assez facilement avec des anglophones et vous expliquez clairement vos idées.',
      'تتحدث مع الناطقين بالإنجليزية بسهولة نسبيًا وتشرح أفكارك بوضوح.',
    ),
  },
  C1: {
    name: t('Advanced', 'Avancé', 'متقدّم'),
    canDo: t(
      'You use English in a flexible way for work and study, with few mistakes.',
      'Vous utilisez l’anglais avec souplesse pour le travail et les études, avec peu d’erreurs.',
      'تستخدم الإنجليزية بمرونة في العمل والدراسة وبأخطاء قليلة.',
    ),
  },
  C2: {
    name: t('Proficient', 'Maîtrise', 'إتقان'),
    canDo: t(
      'You understand almost everything and express yourself very precisely, with fine shades of meaning.',
      'Vous comprenez presque tout et vous vous exprimez avec une grande précision et beaucoup de nuances.',
      'تفهم تقريبًا كل شيء وتعبّر عن نفسك بدقة كبيرة وبفروق دقيقة في المعنى.',
    ),
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// A plan for each level
// ---------------------------------------------------------------------------------------------------------------------

export type Plan = { focus: T; daily: { minutes: number; text: T }[]; goal: T };

export const PLANS: Record<LevelId, Plan> = {
  A1: {
    focus: t('Learn your first words and short sentences. Understand simple English.', 'Apprendre vos premiers mots et des phrases courtes. Comprendre un anglais simple.', 'تعلّم أولى الكلمات والجمل القصيرة، وافهم الإنجليزية البسيطة.'),
    daily: [
      {
        minutes: 4,
        text: t(
          'Phrases: open one situation (for example “Starting your answer”). Listen with the speaker, say each phrase out loud, and save 3.',
          'Expressions : ouvrez une situation (par exemple « Starting your answer »). Écoutez avec le haut-parleur, répétez chaque expression à voix haute et enregistrez-en 3.',
          'العبارات: افتح موقفًا واحدًا (مثل «Starting your answer»). استمع بزر السماعة، وكرّر كل عبارة بصوت عالٍ، واحفظ 3 منها.',
        ),
      },
      {
        minutes: 5,
        text: t(
          'Grammar: read “Present simple”, then practise 10 questions.',
          'Grammaire : lisez « Present simple », puis faites 10 questions.',
          'القواعد: اقرأ درس «Present simple» ثم تدرّب على 10 أسئلة.',
        ),
      },
      {
        minutes: 5,
        text: t(
          'Chat: write 3 to 5 very short sentences (“I like football.”). Tap the words you do not know.',
          'Discussion : écrivez 3 à 5 phrases très courtes (« I like football. »). Touchez les mots que vous ne connaissez pas.',
          'المحادثة: اكتب من 3 إلى 5 جمل قصيرة جدًا (مثل «I like football.»). اضغط على الكلمات التي لا تعرفها.',
        ),
      },
      {
        minutes: 2,
        text: t(
          'Review: do your cards (they appear after you save words and phrases).',
          'Révision : faites vos cartes (elles apparaissent quand vous enregistrez des mots et des expressions).',
          'المراجعة: أنهِ بطاقاتك (تظهر بعد أن تحفظ كلمات وعبارات).',
        ),
      },
    ],
    goal: t(
      'Finish Present simple, Present continuous and Past simple. Chat for 10 messages without stopping.',
      'Terminer Present simple, Present continuous et Past simple. Discuter pendant 10 messages sans vous arrêter.',
      'أنهِ دروس Present simple وPresent continuous وPast simple. وتحدّث 10 رسائل دون توقف.',
    ),
  },
  A2: {
    focus: t('Talk about daily life, the past and your plans, in simple sentences.', 'Parler de la vie quotidienne, du passé et de vos projets avec des phrases simples.', 'تحدّث عن الحياة اليومية والماضي وخططك بجمل بسيطة.'),
    daily: [
      {
        minutes: 3,
        text: t(
          'Phrases: learn 3 new ones from “Agreeing politely” or “Connecting ideas”, and use them in your chat.',
          'Expressions : apprenez-en 3 nouvelles dans « Agreeing politely » ou « Connecting ideas » et utilisez-les dans votre discussion.',
          'العبارات: تعلّم 3 عبارات جديدة من «Agreeing politely» أو «Connecting ideas» واستخدمها في محادثتك.',
        ),
      },
      {
        minutes: 5,
        text: t(
          'Grammar: Past simple, Past continuous, then the two futures (“will” and “going to”).',
          'Grammaire : Past simple, Past continuous, puis les deux futurs (« will » et « going to »).',
          'القواعد: Past simple وPast continuous ثم المستقبلان («will» و«going to»).',
        ),
      },
      {
        minutes: 8,
        text: t(
          'Chat about a topic: Topics → “Talk”. Aim for 5 messages of 8 to 10 words.',
          'Discutez d’un sujet : Topics → « Talk ». Visez 5 messages de 8 à 10 mots.',
          'تحدّث عن موضوع: Topics ← «Talk». اكتب 5 رسائل من 8 إلى 10 كلمات.',
        ),
      },
      {
        minutes: 3,
        text: t('Review: do your cards.', 'Révision : faites vos cartes.', 'المراجعة: أنهِ بطاقاتك.'),
      },
    ],
    goal: t(
      'Tell a short story in the past and talk about your plans. Then retake the level test and aim for B1.',
      'Raconter une courte histoire au passé et parler de vos projets. Puis refaire le test de niveau et viser B1.',
      'احكِ قصة قصيرة في الماضي وتحدّث عن خططك. ثم أعد اختبار المستوى وانتقل إلى B1.',
    ),
  },
  B1: {
    focus: t('Give opinions, tell stories, and fix the tenses you mix up.', 'Donner votre avis, raconter des histoires et corriger les temps que vous confondez.', 'عبّر عن رأيك واحكِ القصص وصحّح الأزمنة التي تخلط بينها.'),
    daily: [
      {
        minutes: 5,
        text: t(
          'Grammar: “Present perfect” against “Past simple”, then “Mixed practice”.',
          'Grammaire : « Present perfect » contre « Past simple », puis « Mixed practice ».',
          'القواعد: قارن بين «Present perfect» و«Past simple» ثم افتح «Mixed practice».',
        ),
      },
      {
        minutes: 10,
        text: t(
          'Chat: a topic or a role-play. Write 2 or 3 sentences each time.',
          'Discussion : un sujet ou un jeu de rôle. Écrivez 2 ou 3 phrases à chaque fois.',
          'المحادثة: موضوع أو لعب أدوار. اكتب جملتين أو ثلاثًا في كل مرة.',
        ),
      },
      {
        minutes: 3,
        text: t(
          'Speak: answer 3 messages with the microphone instead of typing.',
          'Parlez : répondez à 3 messages avec le micro au lieu d’écrire.',
          'تكلّم: أجب عن 3 رسائل بالميكروفون بدل الكتابة.',
        ),
      },
      {
        minutes: 3,
        text: t(
          'Phrases: “Giving opinions” and “Sounding sure”. Review your cards.',
          'Expressions : « Giving opinions » et « Sounding sure ». Révisez vos cartes.',
          'العبارات: «Giving opinions» و«Sounding sure». ثم راجع بطاقاتك.',
        ),
      },
    ],
    goal: t(
      'Have a 10-message chat where half of your answers are spoken.',
      'Avoir une discussion de 10 messages dont la moitié de vos réponses est dite à voix haute.',
      'أجرِ محادثة من 10 رسائل يكون نصف إجاباتك فيها بالصوت.',
    ),
  },
  B2: {
    focus: t('Be precise and natural. Use the complex tenses and more advanced phrases.', 'Être précis et naturel. Utiliser les temps complexes et des expressions plus avancées.', 'كن دقيقًا وطبيعيًا. استخدم الأزمنة المركبة وعبارات أكثر تقدمًا.'),
    daily: [
      {
        minutes: 5,
        text: t(
          'Grammar: Past perfect, Future perfect and the “perfect continuous” tenses. Try “New with AI” for fresh exercises.',
          'Grammaire : Past perfect, Future perfect et les temps « perfect continuous ». Essayez « New with AI » pour de nouveaux exercices.',
          'القواعد: Past perfect وFuture perfect وأزمنة «perfect continuous». جرّب «New with AI» لتمارين جديدة.',
        ),
      },
      {
        minutes: 12,
        text: t(
          'Chat: debate and role-play topics. In Settings, set Strictness to “Strict”.',
          'Discussion : sujets de débat et jeux de rôle. Dans Settings, réglez Strictness sur « Strict ».',
          'المحادثة: مواضيع النقاش ولعب الأدوار. في Settings اجعل Strictness على «Strict».',
        ),
      },
      {
        minutes: 4,
        text: t(
          'Speak: answer by voice, then read the “Sound more natural” cards.',
          'Parlez : répondez à voix haute, puis lisez les cartes « Sound more natural ».',
          'تكلّم: أجب بالصوت ثم اقرأ بطاقات «Sound more natural».',
        ),
      },
      {
        minutes: 3,
        text: t(
          'Phrases: “Storytelling” and “Explaining”. Review your cards.',
          'Expressions : « Storytelling » et « Explaining ». Révisez vos cartes.',
          'العبارات: «Storytelling» و«Explaining». ثم راجع بطاقاتك.',
        ),
      },
    ],
    goal: t(
      'Keep a 15-message conversation with almost no tense mistakes. Then retake the level test and aim for C1.',
      'Tenir une conversation de 15 messages avec presque aucune erreur de temps. Puis refaire le test de niveau et viser C1.',
      'حافظ على محادثة من 15 رسالة بلا أخطاء تقريبًا في الأزمنة. ثم أعد اختبار المستوى وانتقل إلى C1.',
    ),
  },
  C1: {
    focus: t('Sound natural and precise: word choice, formal and informal style, word pairs.', 'Paraître naturel et précis : choix des mots, style formel et familier, associations de mots.', 'كن طبيعيًا ودقيقًا: اختيار الكلمات والأسلوب الرسمي وغير الرسمي وتراكيب الكلمات.'),
    daily: [
      {
        minutes: 15,
        text: t(
          'Chat: long conversations with the voice. Use “Strict” and ask the coach: “Let’s role-play a job interview.”',
          'Discussion : longues conversations à la voix. Utilisez « Strict » et demandez au coach : « Let’s role-play a job interview. »',
          'المحادثة: محادثات طويلة بالصوت. استخدم «Strict» واطلب من المدرّب: «Let’s role-play a job interview.»',
        ),
      },
      {
        minutes: 4,
        text: t(
          'Phrases: “Natural word pairs”. Use each new phrase in your next chat.',
          'Expressions : « Natural word pairs ». Utilisez chaque nouvelle expression dans votre prochaine discussion.',
          'العبارات: «Natural word pairs». استخدم كل عبارة جديدة في محادثتك التالية.',
        ),
      },
      {
        minutes: 3,
        text: t('Grammar: “Mixed practice” to keep the tenses sharp.', 'Grammaire : « Mixed practice » pour garder les temps bien en tête.', 'القواعد: «Mixed practice» لإبقاء الأزمنة حاضرة.'),
      },
      {
        minutes: 3,
        text: t('Review: do your cards.', 'Révision : faites vos cartes.', 'المراجعة: أنهِ بطاقاتك.'),
      },
    ],
    goal: t(
      'Use at least 3 new natural phrases in every chat.',
      'Utiliser au moins 3 nouvelles expressions naturelles dans chaque discussion.',
      'استخدم 3 عبارات طبيعية جديدة على الأقل في كل محادثة.',
    ),
  },
  C2: {
    focus: t('Keep your level and polish style, idioms and fine shades of meaning.', 'Garder votre niveau et peaufiner le style, les expressions idiomatiques et les nuances.', 'حافظ على مستواك وصقل الأسلوب والتعابير الاصطلاحية وفروق المعنى الدقيقة.'),
    daily: [
      {
        minutes: 15,
        text: t(
          'Chat: long, free conversations about difficult topics. Ask the coach for idioms, and for a more formal and a more casual way to say things.',
          'Discussion : longues conversations libres sur des sujets difficiles. Demandez au coach des expressions idiomatiques, et une façon plus formelle et plus familière de dire les choses.',
          'المحادثة: محادثات طويلة وحرة عن مواضيع صعبة. اطلب من المدرّب تعابير اصطلاحية، وطريقة أكثر رسمية وأخرى أكثر عفوية للتعبير.',
        ),
      },
      {
        minutes: 3,
        text: t('Phrases and Review: keep the “Sound more natural” ideas you like.', 'Expressions et Révision : gardez les idées « Sound more natural » qui vous plaisent.', 'العبارات والمراجعة: احتفظ بأفكار «Sound more natural» التي تعجبك.'),
      },
      {
        minutes: 2,
        text: t('Grammar: a short “Mixed practice” round.', 'Grammaire : un court tour de « Mixed practice ».', 'القواعد: جولة قصيرة من «Mixed practice».'),
      },
    ],
    goal: t(
      'Retake the level test once a month and look at Progress for weak spots.',
      'Refaire le test de niveau une fois par mois et regarder Progress pour repérer les points faibles.',
      'أعد اختبار المستوى مرة في الشهر وراجع صفحة Progress لتعرف نقاط ضعفك.',
    ),
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// The words of the app
// ---------------------------------------------------------------------------------------------------------------------

export const GLOSSARY: { en: string; fr: string; ar: string }[] = [
  { en: 'Home', fr: 'Accueil', ar: 'الرئيسية' },
  { en: 'Topics', fr: 'Sujets', ar: 'المواضيع' },
  { en: 'Chat', fr: 'Discussion', ar: 'المحادثة' },
  { en: 'Grammar', fr: 'Grammaire', ar: 'القواعد' },
  { en: 'Phrases', fr: 'Expressions', ar: 'العبارات' },
  { en: 'Review', fr: 'Révision', ar: 'المراجعة' },
  { en: 'Progress', fr: 'Progrès', ar: 'التقدّم' },
  { en: 'Settings', fr: 'Réglages', ar: 'الإعدادات' },
  { en: 'Sign in', fr: 'Se connecter', ar: 'تسجيل الدخول' },
  { en: 'Sign out', fr: 'Se déconnecter', ar: 'تسجيل الخروج' },
  { en: 'Create account', fr: 'Créer un compte', ar: 'إنشاء حساب' },
  { en: 'Email', fr: 'E-mail', ar: 'البريد الإلكتروني' },
  { en: 'Password', fr: 'Mot de passe', ar: 'كلمة المرور' },
  { en: 'Server', fr: 'Serveur', ar: 'الخادم' },
  { en: 'Start', fr: 'Commencer', ar: 'ابدأ' },
  { en: 'Next', fr: 'Suivant', ar: 'التالي' },
  { en: 'Continue', fr: 'Continuer', ar: 'متابعة' },
  { en: 'Check', fr: 'Vérifier', ar: 'تحقّق' },
  { en: 'Show answer', fr: 'Voir la réponse', ar: 'أظهر الإجابة' },
  { en: 'I don’t know', fr: 'Je ne sais pas', ar: 'لا أعرف' },
  { en: 'Finish', fr: 'Terminer', ar: 'إنهاء' },
  { en: 'End', fr: 'Fin (terminer la discussion)', ar: 'إنهاء المحادثة' },
  { en: 'Save', fr: 'Enregistrer', ar: 'حفظ' },
  { en: 'Saved', fr: 'Enregistré', ar: 'محفوظ' },
  { en: 'Practise', fr: 'S’entraîner', ar: 'تدرّب' },
  { en: 'Listen', fr: 'Écouter', ar: 'استمع' },
  { en: 'Correct!', fr: 'Correct !', ar: 'صحيح!' },
  { en: 'Not quite', fr: 'Pas tout à fait', ar: 'ليس تمامًا' },
  { en: 'Second try', fr: 'Deuxième essai', ar: 'محاولة ثانية' },
  { en: 'Again', fr: 'Encore', ar: 'مرة أخرى' },
  { en: 'Hard', fr: 'Difficile', ar: 'صعب' },
  { en: 'Good', fr: 'Bien', ar: 'جيد' },
  { en: 'Easy', fr: 'Facile', ar: 'سهل' },
  { en: 'Level', fr: 'Niveau', ar: 'المستوى' },
  { en: 'Streak', fr: 'Série de jours', ar: 'سلسلة الأيام' },
  { en: 'Mistake', fr: 'Erreur', ar: 'خطأ' },
  { en: 'Lesson', fr: 'Leçon', ar: 'درس' },
  { en: 'Question', fr: 'Question', ar: 'سؤال' },
  { en: 'Tense', fr: 'Temps (du verbe)', ar: 'زمن الفعل' },
  { en: 'Past', fr: 'Passé', ar: 'الماضي' },
  { en: 'Present', fr: 'Présent', ar: 'الحاضر' },
  { en: 'Future', fr: 'Futur', ar: 'المستقبل' },
  { en: 'Corrections', fr: 'Corrections', ar: 'التصحيحات' },
  { en: 'Sound more natural', fr: 'Parler plus naturellement', ar: 'لتبدو أكثر طبيعية' },
];

// ---------------------------------------------------------------------------------------------------------------------
// The sections
// ---------------------------------------------------------------------------------------------------------------------

export const SECTIONS: Section[] = [
  {
    id: 'welcome',
    icon: 'hand-right',
    title: t('Welcome! Start here', 'Bienvenue ! Commencez ici', 'مرحبًا! ابدأ من هنا'),
    summary: t('What this app does, in one minute.', 'Ce que fait cette appli, en une minute.', 'ما الذي يفعله هذا التطبيق، في دقيقة واحدة.'),
    blocks: [
      {
        type: 'p',
        text: t(
          'English Coach helps you learn English by talking. You write or speak in English. An AI coach answers you, fixes your mistakes in a kind way, and explains them in your language.',
          'English Coach vous aide à apprendre l’anglais en parlant. Vous écrivez ou vous parlez en anglais. Un coach IA vous répond, corrige vos erreurs avec gentillesse et les explique dans votre langue.',
          'يساعدك English Coach على تعلّم الإنجليزية بالمحادثة. تكتب أو تتكلم بالإنجليزية، فيردّ عليك مدرّب ذكاء اصطناعي، ويصحّح أخطاءك بلطف، ويشرحها بلغتك.',
        ),
      },
      {
        type: 'p',
        text: t(
          'It is for every level. If you know no English, that is OK: the coach starts with very short, easy sentences and goes up with you.',
          'C’est pour tous les niveaux. Si vous ne connaissez pas du tout l’anglais, ce n’est pas grave : le coach commence par des phrases très courtes et faciles, puis monte avec vous.',
          'التطبيق لكل المستويات. إذا كنت لا تعرف أي شيء من الإنجليزية فلا مشكلة: يبدأ المدرّب بجمل قصيرة وسهلة جدًا ثم يرتفع معك.',
        ),
      },
      {
        type: 'steps',
        title: t('The path, in 5 steps', 'Le chemin en 5 étapes', 'الطريق في 5 خطوات'),
        items: [
          t('Create an account and choose your language.', 'Créez un compte et choisissez votre langue.', 'أنشئ حسابًا واختر لغتك.'),
          t('Add your free Gemini key (the brain of the coach).', 'Ajoutez votre clé Gemini gratuite (le cerveau du coach).', 'أضف مفتاح Gemini المجاني (عقل المدرّب).'),
          t('Take the level test (about 10 minutes).', 'Passez le test de niveau (environ 10 minutes).', 'قم باختبار المستوى (نحو 10 دقائق).'),
          t('Choose your interests.', 'Choisissez vos centres d’intérêt.', 'اختر اهتماماتك.'),
          t('Practise every day: chat, grammar, phrases, review. 10 to 15 minutes a day is enough.', 'Entraînez-vous chaque jour : discussion, grammaire, expressions, révision. 10 à 15 minutes par jour suffisent.', 'تدرّب كل يوم: محادثة وقواعد وعبارات ومراجعة. تكفي 10 إلى 15 دقيقة يوميًا.'),
        ],
      },
      {
        type: 'tip',
        text: t(
          'Mistakes are good. Every mistake the coach finds is a free lesson.',
          'Les erreurs sont utiles. Chaque erreur repérée par le coach est une leçon gratuite.',
          'الأخطاء مفيدة. كل خطأ يجده المدرّب هو درس مجاني لك.',
        ),
      },
    ],
  },
  {
    id: 'setup',
    icon: 'construct',
    title: t('Set up in 3 steps', 'Installation en 3 étapes', 'الإعداد في 3 خطوات'),
    summary: t('Account, your language, your key.', 'Compte, votre langue, votre clé.', 'الحساب ولغتك والمفتاح.'),
    go: { label: t('Open Settings', 'Ouvrir Settings', 'افتح الإعدادات'), href: '/settings', tab: false },
    blocks: [
      {
        type: 'steps',
        items: [
          t(
            'On the sign-in screen, tap “No account yet? Create one”. Write your email and a password with 8 letters or more. Tap “Create account”.',
            'Sur l’écran de connexion, touchez « No account yet? Create one ». Écrivez votre e-mail et un mot de passe de 8 caractères ou plus. Touchez « Create account ».',
            'في شاشة الدخول اضغط «No account yet? Create one». اكتب بريدك الإلكتروني وكلمة مرور من 8 أحرف أو أكثر. ثم اضغط «Create account».',
          ),
          t(
            'Open Settings (the gear icon at the top right). Under “Explain corrections in”, choose your language: Français or العربية. Tap “Save changes”.',
            'Ouvrez Settings (l’icône d’engrenage en haut à droite). Sous « Explain corrections in », choisissez votre langue : Français ou العربية. Touchez « Save changes ».',
            'افتح Settings (أيقونة الترس أعلى اليمين). تحت «Explain corrections in» اختر لغتك: Français أو العربية. ثم اضغط «Save changes».',
          ),
          t(
            'Add your Gemini key. The next part shows how, step by step.',
            'Ajoutez votre clé Gemini. La partie suivante explique comment, pas à pas.',
            'أضف مفتاح Gemini. يشرح القسم التالي كيف، خطوة بخطوة.',
          ),
        ],
      },
      {
        type: 'warn',
        text: t(
          'Until you choose a language in Settings, the coach explains your mistakes in French.',
          'Tant que vous n’avez pas choisi de langue dans Settings, le coach explique vos erreurs en français.',
          'إلى أن تختار لغة في Settings سيشرح لك المدرّب أخطاءك بالفرنسية.',
        ),
      },
    ],
  },
  {
    id: 'key',
    icon: 'key',
    title: t('Get your free Gemini key', 'Obtenir votre clé Gemini gratuite', 'احصل على مفتاح Gemini المجاني'),
    summary: t('The only slightly hard step. Follow it slowly.', 'La seule étape un peu difficile. Suivez-la lentement.', 'الخطوة الوحيدة الصعبة قليلًا. اتبعها ببطء.'),
    go: { label: t('Open Settings', 'Ouvrir Settings', 'افتح الإعدادات'), href: '/settings', tab: false },
    blocks: [
      {
        type: 'p',
        text: t(
          'Gemini is the AI from Google that powers the coach. You use your own key. It is free for normal use. Do not add a payment method.',
          'Gemini est l’IA de Google qui fait fonctionner le coach. Vous utilisez votre propre clé. C’est gratuit pour un usage normal. N’ajoutez pas de moyen de paiement.',
          'Gemini هو الذكاء الاصطناعي من Google الذي يشغّل المدرّب. تستخدم مفتاحك الخاص. وهو مجاني للاستخدام العادي. لا تُضِف وسيلة دفع.',
        ),
      },
      {
        type: 'steps',
        items: [
          t('Tap the button below (or open aistudio.google.com/apikey in a browser).', 'Touchez le bouton ci-dessous (ou ouvrez aistudio.google.com/apikey dans un navigateur).', 'اضغط الزر أدناه (أو افتح aistudio.google.com/apikey في المتصفح).'),
          t('Sign in with your Google account.', 'Connectez-vous avec votre compte Google.', 'سجّل الدخول بحساب Google.'),
          t('Tap “Create API key”. If it asks for a project, choose “Create API key in new project”.', 'Touchez « Create API key ». S’il demande un projet, choisissez « Create API key in new project ».', 'اضغط «Create API key». إذا طلب مشروعًا فاختر «Create API key in new project».'),
          t('Copy the key. It starts with “AIza”.', 'Copiez la clé. Elle commence par « AIza ».', 'انسخ المفتاح. يبدأ بـ «AIza».'),
          t('Come back to English Coach. Open Settings → “Gemini API key” and paste the key.', 'Revenez dans English Coach. Ouvrez Settings → « Gemini API key » et collez la clé.', 'عد إلى English Coach. افتح Settings ← «Gemini API key» والصق المفتاح.'),
          t('Tap “Test key”. You should see “Valid”. Then tap “Save key”.', 'Touchez « Test key ». Vous devez voir « Valid ». Puis touchez « Save key ».', 'اضغط «Test key». يجب أن ترى «Valid». ثم اضغط «Save key».'),
        ],
      },
      { type: 'link', label: t('Open Google AI Studio', 'Ouvrir Google AI Studio', 'افتح Google AI Studio'), url: 'https://aistudio.google.com/apikey' },
      {
        type: 'tip',
        text: t(
          'Your key is private. It is stored encrypted and never shown in full again. Do not share it.',
          'Votre clé est privée. Elle est stockée chiffrée et n’est plus jamais affichée en entier. Ne la partagez pas.',
          'مفتاحك خاص. يُخزَّن مشفّرًا ولا يُعرض كاملًا بعد ذلك. لا تشاركه مع أحد.',
        ),
      },
      {
        type: 'warn',
        text: t(
          'Free keys have limits. If the app says “daily limit”, wait until tomorrow or choose another model in Settings.',
          'Les clés gratuites ont des limites. Si l’appli indique « daily limit », attendez demain ou choisissez un autre modèle dans Settings.',
          'للمفاتيح المجانية حدود. إذا ظهر «daily limit» فانتظر حتى الغد أو اختر نموذجًا آخر في Settings.',
        ),
      },
    ],
  },
  {
    id: 'level',
    icon: 'trophy',
    title: t('Step 1 — Find your level', 'Étape 1 — Trouver votre niveau', 'الخطوة 1 — اعرف مستواك'),
    summary: t('A short test. It gives you A1 to C2.', 'Un court test. Il vous donne un niveau de A1 à C2.', 'اختبار قصير يعطيك مستوى من A1 إلى C2.'),
    go: { label: t('Start the level test', 'Commencer le test de niveau', 'ابدأ اختبار المستوى'), href: '/placement', tab: false },
    blocks: [
      {
        type: 'p',
        text: t(
          'The test has up to 15 questions. It becomes easier or harder after each answer. After about 10 minutes it tells you your level.',
          'Le test compte jusqu’à 15 questions. Il devient plus facile ou plus difficile après chaque réponse. Après environ 10 minutes, il vous donne votre niveau.',
          'يضم الاختبار حتى 15 سؤالًا. يصبح أسهل أو أصعب بعد كل إجابة. وبعد نحو 10 دقائق يخبرك بمستواك.',
        ),
      },
      {
        type: 'steps',
        items: [
          t('On Home, tap “Start the level test”.', 'Sur Home, touchez « Start the level test ».', 'في الرئيسية اضغط «Start the level test».'),
          t('Read the question. Tap your answer (A, B, C or D), then tap “Continue”.', 'Lisez la question. Touchez votre réponse (A, B, C ou D), puis « Continue ».', 'اقرأ السؤال. اضغط إجابتك (A أو B أو C أو D) ثم «Continue».'),
          t('Some questions ask you to write or to speak. Write a short answer. To speak: tap the microphone, talk, tap the square to stop, check the text.', 'Certaines questions demandent d’écrire ou de parler. Écrivez une courte réponse. Pour parler : touchez le micro, parlez, touchez le carré pour arrêter, vérifiez le texte.', 'بعض الأسئلة تطلب الكتابة أو الكلام. اكتب إجابة قصيرة. للكلام: اضغط الميكروفون وتكلّم ثم اضغط المربع للإيقاف وراجع النص.'),
          t('If you do not know, tap “I don’t know”. This is better than guessing.', 'Si vous ne savez pas, touchez « I don’t know ». C’est mieux que de deviner.', 'إذا كنت لا تعرف فاضغط «I don’t know». هذا أفضل من التخمين.'),
          t('At the end you see your level, your strong and weak skills, and a short report.', 'À la fin, vous voyez votre niveau, vos points forts et faibles, et un court rapport.', 'في النهاية ترى مستواك ومهاراتك القوية والضعيفة وتقريرًا قصيرًا.'),
        ],
      },
      {
        type: 'tip',
        text: t(
          'You know almost no English? Tap “I don’t know” again and again. That is OK. The result will be A1, and A1 is the right place to start.',
          'Vous ne connaissez presque pas l’anglais ? Touchez « I don’t know » encore et encore. Ce n’est pas grave. Le résultat sera A1, et A1 est le bon point de départ.',
          'لا تعرف الإنجليزية تقريبًا؟ اضغط «I don’t know» مرارًا. لا بأس. ستكون النتيجة A1 وهي نقطة البداية المناسبة.',
        ),
      },
      {
        type: 'p',
        text: t(
          'You can stop and come back: the test continues where you stopped. You can retake it any time (Settings → “Retake the level test”).',
          'Vous pouvez vous arrêter et revenir : le test reprend là où vous vous êtes arrêté. Vous pouvez le repasser à tout moment (Settings → « Retake the level test »).',
          'يمكنك التوقف والعودة: يكمل الاختبار من حيث توقفت. ويمكنك إعادته في أي وقت (Settings ← «Retake the level test»).',
        ),
      },
      { type: 'levels' },
    ],
  },
  {
    id: 'interests',
    icon: 'sparkles',
    title: t('Step 2 — Choose your interests', 'Étape 2 — Choisir vos centres d’intérêt', 'الخطوة 2 — اختر اهتماماتك'),
    summary: t('So every topic is about things you like.', 'Pour que chaque sujet parle de ce que vous aimez.', 'لتكون كل المواضيع عمّا تحب.'),
    go: { label: t('Pick your interests', 'Choisir mes intérêts', 'اختر اهتماماتي'), href: '/interests', tab: false },
    blocks: [
      {
        type: 'p',
        text: t(
          'Tell the app what you like (football, music, cooking, work…) and what you want to improve (grammar, speaking, words…). Then topics and exercises talk about your world.',
          'Dites à l’appli ce que vous aimez (football, musique, cuisine, travail…) et ce que vous voulez améliorer (grammaire, expression orale, vocabulaire…). Les sujets et les exercices parleront alors de votre univers.',
          'أخبر التطبيق بما تحب (كرة القدم والموسيقى والطبخ والعمل…) وبما تريد تحسينه (القواعد والتحدث والمفردات…). وبعدها ستدور المواضيع والتمارين حول عالمك.',
        ),
      },
      {
        type: 'steps',
        items: [
          t('On Home, tap “Pick your interests”.', 'Sur Home, touchez « Pick your interests ».', 'في الرئيسية اضغط «Pick your interests».'),
          t('Part 1: choose what you want to improve.', 'Partie 1 : choisissez ce que vous voulez améliorer.', 'الجزء 1: اختر ما تريد تحسينه.'),
          t('Part 2: choose what you like to talk about. You can add your own (“Add”).', 'Partie 2 : choisissez ce dont vous aimez parler. Vous pouvez ajouter les vôtres (« Add »).', 'الجزء 2: اختر ما تحب الحديث عنه. ويمكنك إضافة اهتماماتك (زر «Add»).'),
          t('Tap “Save & see topics”.', 'Touchez « Save & see topics ».', 'اضغط «Save & see topics».'),
        ],
      },
      { type: 'tip', text: t('You can change your interests at any time.', 'Vous pouvez changer vos centres d’intérêt à tout moment.', 'يمكنك تغيير اهتماماتك في أي وقت.') },
    ],
  },
  {
    id: 'chat',
    icon: 'chatbubbles',
    title: t('Chat with your coach', 'Discuter avec votre coach', 'تحدّث مع مدرّبك'),
    summary: t('The heart of the app.', 'Le cœur de l’appli.', 'قلب التطبيق.'),
    go: { label: t('Open Chat', 'Ouvrir Chat', 'افتح المحادثة'), href: '/chat', tab: true },
    blocks: [
      {
        type: 'steps',
        items: [
          t('Tap the Chat tab, then “Start a free chat”. (Or start from a topic.)', 'Touchez l’onglet Chat, puis « Start a free chat ». (Ou commencez depuis un sujet.)', 'اضغط تبويب Chat ثم «Start a free chat». (أو ابدأ من موضوع.)'),
          t('Write in English in the box at the bottom and tap the arrow. Short sentences are perfect.', 'Écrivez en anglais dans la zone en bas et touchez la flèche. Les phrases courtes sont parfaites.', 'اكتب بالإنجليزية في الصندوق أسفل الشاشة واضغط السهم. الجمل القصيرة ممتازة.'),
          t('The coach answers. Tap any word in the answer to see what it means. Tap the speaker to hear the message.', 'Le coach répond. Touchez n’importe quel mot de la réponse pour voir sa signification. Touchez le haut-parleur pour écouter le message.', 'يردّ المدرّب. اضغط أي كلمة في الرد لترى معناها. واضغط السماعة لتسمع الرسالة.'),
          t('Under your message you may see a yellow card, “Corrections”. Red crossed words are mistakes. Green words are the right way. A short explanation is in your language.', 'Sous votre message, vous pouvez voir une carte jaune, « Corrections ». Les mots rouges barrés sont des erreurs. Les mots verts sont la bonne forme. Une courte explication est dans votre langue.', 'تحت رسالتك قد ترى بطاقة صفراء «Corrections». الكلمات الحمراء المشطوبة أخطاء، والخضراء هي الصواب. وتجد شرحًا قصيرًا بلغتك.'),
          t('A purple card, “Sound more natural”, shows a better way to say it. Tap “Save” to keep it.', 'Une carte violette, « Sound more natural », montre une façon plus naturelle de le dire. Touchez « Save » pour la garder.', 'بطاقة بنفسجية «Sound more natural» تعرض طريقة أفضل للقول. اضغط «Save» لتحتفظ بها.'),
          t('When you finish, tap “End”. You get a score, what went well, what to improve, and an idea for your next chat.', 'Quand vous avez fini, touchez « End ». Vous recevez une note, ce qui va bien, ce qu’il faut améliorer et une idée pour la prochaine discussion.', 'عندما تنتهي اضغط «End». تحصل على درجة وما أجدته وما يجب تحسينه وفكرة للمحادثة القادمة.'),
        ],
      },
      {
        type: 'bullets',
        title: t('The buttons at the top of a chat', 'Les boutons en haut d’une discussion', 'الأزرار أعلى المحادثة'),
        items: [
          t('Speed icon: the coach reads slowly.', 'Icône de vitesse : le coach lit lentement.', 'أيقونة السرعة: يقرأ المدرّب ببطء.'),
          t('Eye icon: hides the coach’s text so you only listen. Great listening practice. Tap “Listen first, tap to read” to see it.', 'Icône d’œil : cache le texte du coach pour que vous écoutiez seulement. Très bon pour l’écoute. Touchez « Listen first, tap to read » pour le voir.', 'أيقونة العين: تُخفي نص المدرّب لتسمع فقط. تمرين ممتاز للاستماع. اضغط «Listen first, tap to read» لتراه.'),
          t('End: finishes the chat and gives your report.', 'End : termine la discussion et donne votre rapport.', 'End: تُنهي المحادثة وتعطيك تقريرك.'),
        ],
      },
      {
        type: 'tip',
        text: t(
          'Beginner? Write very short: “Hello”, “I like football”, “I am from Morocco”. Not sure how to say something? Ask: “How do you say pomme in English?”',
          'Débutant ? Écrivez très court : « Hello », « I like football », « I am from Morocco ». Vous ne savez pas comment dire quelque chose ? Demandez : « How do you say pomme in English? »',
          'مبتدئ؟ اكتب جملًا قصيرة جدًا: «Hello» و«I like football» و«I am from Morocco». لا تعرف كيف تقول شيئًا؟ اسأل: «How do you say تفاحة in English?»',
        ),
      },
      {
        type: 'tip',
        text: t(
          'Advanced? Try role-play topics, and set Strictness to “Strict” in Settings.',
          'Avancé ? Essayez les jeux de rôle et réglez Strictness sur « Strict » dans Settings.',
          'متقدّم؟ جرّب مواضيع لعب الأدوار واجعل Strictness على «Strict» في Settings.',
        ),
      },
    ],
  },
  {
    id: 'voice',
    icon: 'mic',
    title: t('Speak instead of typing', 'Parler au lieu d’écrire', 'تكلّم بدل الكتابة'),
    summary: t('Use the microphone.', 'Utilisez le micro.', 'استخدم الميكروفون.'),
    go: { label: t('Open Chat', 'Ouvrir Chat', 'افتح المحادثة'), href: '/chat', tab: true },
    blocks: [
      {
        type: 'steps',
        items: [
          t('In a chat, tap the microphone button. The first time, allow the microphone.', 'Dans une discussion, touchez le bouton micro. La première fois, autorisez le micro.', 'في المحادثة اضغط زر الميكروفون. في المرة الأولى اسمح باستخدامه.'),
          t('Speak in English. You can speak for up to 1 minute.', 'Parlez en anglais. Vous pouvez parler jusqu’à 1 minute.', 'تكلّم بالإنجليزية. يمكنك التحدث حتى دقيقة واحدة.'),
          t('Tap the red square to stop.', 'Touchez le carré rouge pour arrêter.', 'اضغط المربع الأحمر للإيقاف.'),
          t('Your words appear in the box. Read them, fix them if you want, then tap the arrow to send.', 'Vos mots apparaissent dans la zone de texte. Lisez-les, corrigez-les si vous voulez, puis touchez la flèche pour envoyer.', 'تظهر كلماتك في الصندوق. اقرأها وصحّحها إن شئت ثم اضغط السهم للإرسال.'),
        ],
      },
      {
        type: 'tip',
        text: t(
          'The app writes what you really said, with your mistakes. That is good: the coach can correct them.',
          'L’appli écrit ce que vous avez vraiment dit, avec vos erreurs. C’est bien : le coach peut les corriger.',
          'يكتب التطبيق ما قلته فعلًا بأخطائك. وهذا جيد: يستطيع المدرّب تصحيحها.',
        ),
      },
      {
        type: 'p',
        text: t(
          'No sound from the speaker? Turn up the volume. On iPhone, also check that the silent switch is off.',
          'Pas de son ? Montez le volume. Sur iPhone, vérifiez aussi que le mode silencieux est désactivé.',
          'لا صوت من السماعة؟ ارفع مستوى الصوت. وعلى آيفون تأكد أيضًا أن مفتاح الصامت مُغلق.',
        ),
      },
    ],
  },
  {
    id: 'grammar',
    icon: 'school',
    title: t('Grammar: verb tenses', 'Grammaire : les temps des verbes', 'القواعد: أزمنة الأفعال'),
    summary: t('Learn past, present and future, then practise.', 'Apprenez le passé, le présent et le futur, puis entraînez-vous.', 'تعلّم الماضي والحاضر والمستقبل ثم تدرّب.'),
    go: { label: t('Open Grammar', 'Ouvrir Grammar', 'افتح القواعد'), href: '/grammar', tab: true },
    blocks: [
      {
        type: 'p',
        text: t(
          'Tenses show when something happens: in the past, now, or in the future. Many mistakes come from tenses, so this tab teaches all 12 of them.',
          'Les temps montrent quand quelque chose se passe : dans le passé, maintenant ou dans le futur. Beaucoup d’erreurs viennent des temps, donc cet onglet vous apprend les 12.',
          'تُظهر الأزمنة متى يحدث الشيء: في الماضي أو الآن أو في المستقبل. كثير من الأخطاء سببها الأزمنة، لذلك يعلّمك هذا التبويب الأزمنة الاثني عشر.',
        ),
      },
      {
        type: 'steps',
        items: [
          t('Open the Grammar tab. The top card tells you where to start (or your weakest tense).', 'Ouvrez l’onglet Grammar. La carte du haut vous dit par où commencer (ou votre temps le plus faible).', 'افتح تبويب Grammar. تخبرك البطاقة العليا من أين تبدأ (أو أضعف زمن عندك).'),
          t('Tap a tense to read its lesson: a timeline picture, how to form it, when to use it, words that give it away, and typical mistakes.', 'Touchez un temps pour lire sa leçon : un schéma de la chronologie, comment le former, quand l’utiliser, les mots qui le trahissent et les erreurs typiques.', 'اضغط زمنًا لتقرأ درسه: رسم لخط الزمن، وكيف يتكوّن، ومتى يُستخدم، وكلمات تدل عليه، وأخطاء شائعة.'),
          t('Tap “Practise”. You get 10 questions: fill the blank, choose, fix the mistake, name the tense.', 'Touchez « Practise ». Vous avez 10 questions : compléter, choisir, corriger l’erreur, nommer le temps.', 'اضغط «Practise». ستحصل على 10 أسئلة: أكمل الفراغ، اختر، صحّح الخطأ، سمِّ الزمن.'),
          t('After each answer you see if it is right, and why. Tap the speaker to hear the sentence.', 'Après chaque réponse, vous voyez si elle est juste, et pourquoi. Touchez le haut-parleur pour écouter la phrase.', 'بعد كل إجابة ترى هل هي صحيحة ولماذا. اضغط السماعة لتسمع الجملة.'),
          t('A question you miss comes back once at the end (“Second try”).', 'Une question ratée revient une fois à la fin (« Second try »).', 'السؤال الذي تخطئ فيه يعود مرة واحدة في النهاية («Second try»).'),
        ],
      },
      {
        type: 'bullets',
        items: [
          t('“Mixed practice” mixes all tenses and chooses the ones you find hardest.', '« Mixed practice » mélange tous les temps et choisit ceux qui vous sont les plus difficiles.', '«Mixed practice» تخلط كل الأزمنة وتختار الأصعب عليك.'),
          t('“New with AI” writes new exercises about your interests.', '« New with AI » écrit de nouveaux exercices sur vos centres d’intérêt.', '«New with AI» تكتب تمارين جديدة عن اهتماماتك.'),
          t('“Irregular verbs”: learn go → went → gone and the other verbs you must remember.', '« Irregular verbs » : apprenez go → went → gone et les autres verbes à retenir.', '«Irregular verbs»: تعلّم go ← went ← gone وبقية الأفعال التي يجب حفظها.'),
        ],
      },
      {
        type: 'tip',
        text: t(
          'Beginner? Go in this order: Present simple, Present continuous, Past simple, then “Future with will” and “Future with going to”.',
          'Débutant ? Suivez cet ordre : Present simple, Present continuous, Past simple, puis « Future with will » et « Future with going to ».',
          'مبتدئ؟ اتبع هذا الترتيب: Present simple ثم Present continuous ثم Past simple ثم «Future with will» و«Future with going to».',
        ),
      },
    ],
  },
  {
    id: 'phrases',
    icon: 'chatbox-ellipses',
    title: t('Power phrases', 'Expressions utiles', 'العبارات القوية'),
    summary: t('Ready-made sentences native speakers use all the time.', 'Des phrases toutes faites que les anglophones utilisent tout le temps.', 'جمل جاهزة يستخدمها الناطقون بالإنجليزية طوال الوقت.'),
    go: { label: t('Open Phrases', 'Ouvrir Phrases', 'افتح العبارات'), href: '/phrases', tab: true },
    blocks: [
      {
        type: 'p',
        text: t(
          'A phrase is a group of words you learn together, like “To be honest, …”. Learning phrases is faster than learning single words.',
          'Une expression est un groupe de mots qu’on apprend ensemble, comme « To be honest, … ». Apprendre des expressions est plus rapide qu’apprendre des mots isolés.',
          'العبارة مجموعة كلمات تتعلّمها معًا مثل «To be honest, …». تعلّم العبارات أسرع من تعلّم الكلمات المفردة.',
        ),
      },
      {
        type: 'steps',
        items: [
          t('Open the Phrases tab and choose a situation (for example “Starting your answer”).', 'Ouvrez l’onglet Phrases et choisissez une situation (par exemple « Starting your answer »).', 'افتح تبويب Phrases واختر موقفًا (مثل «Starting your answer»).'),
          t('Tap the speaker to listen. Say the phrase out loud.', 'Touchez le haut-parleur pour écouter. Dites l’expression à voix haute.', 'اضغط السماعة لتسمع. ثم قل العبارة بصوت عالٍ.'),
          t('Tap “Save” to keep it in “Saved”.', 'Touchez « Save » pour la garder dans « Saved ».', 'اضغط «Save» لتحتفظ بها في «Saved».'),
          t('Tap “Practise”. You get a small situation. You answer with the phrase and the coach checks it.', 'Touchez « Practise ». Vous recevez une petite situation. Vous répondez avec l’expression et le coach la vérifie.', 'اضغط «Practise». ستحصل على موقف صغير. تجيب بالعبارة ويتحقق المدرّب منها.'),
        ],
      },
      { type: 'tip', text: t('Use each new phrase in your next chat.', 'Utilisez chaque nouvelle expression dans votre prochaine discussion.', 'استخدم كل عبارة جديدة في محادثتك التالية.') },
    ],
  },
  {
    id: 'review',
    icon: 'layers',
    title: t('Review: remember for ever', 'Révision : retenir pour toujours', 'المراجعة: تذكّر للأبد'),
    summary: t('Cards come back just before you forget.', 'Les cartes reviennent juste avant que vous n’oubliiez.', 'تعود البطاقات قبل أن تنسى بقليل.'),
    go: { label: t('Open Review', 'Ouvrir Review', 'افتح المراجعة'), href: '/review', tab: true },
    blocks: [
      {
        type: 'p',
        text: t(
          'Our brain forgets new things. The Review tab shows your saved words, saved phrases and your own mistakes again, just before you forget them.',
          'Notre cerveau oublie les choses nouvelles. L’onglet Review vous remontre vos mots enregistrés, vos expressions enregistrées et vos propres erreurs, juste avant que vous ne les oubliiez.',
          'ينسى دماغنا الأشياء الجديدة. يعرض لك تبويب Review كلماتك وعباراتك المحفوظة وأخطاءك من جديد قبل أن تنساها بقليل.',
        ),
      },
      {
        type: 'steps',
        items: [
          t('Open Review and tap “Start”.', 'Ouvrez Review et touchez « Start ».', 'افتح Review واضغط «Start».'),
          t('Read the card. Think of the answer. If you want, type it.', 'Lisez la carte. Pensez à la réponse. Si vous voulez, écrivez-la.', 'اقرأ البطاقة. فكّر في الإجابة. وإن شئت فاكتبها.'),
          t('Tap “Show answer”.', 'Touchez « Show answer ».', 'اضغط «Show answer».'),
          t('Tell the app how it went. The app shows when the card will come back.', 'Dites à l’appli comment ça s’est passé. L’appli indique quand la carte reviendra.', 'أخبر التطبيق كيف سارت الأمور. ويعرض متى ستعود البطاقة.'),
        ],
      },
      {
        type: 'bullets',
        title: t('The four buttons', 'Les quatre boutons', 'الأزرار الأربعة'),
        items: [
          t('Again: you forgot. The card comes back soon.', 'Again : vous avez oublié. La carte revient bientôt.', 'Again: نسيت. تعود البطاقة قريبًا.'),
          t('Hard: you remembered, with effort.', 'Hard : vous vous en êtes souvenu, avec effort.', 'Hard: تذكّرت بصعوبة.'),
          t('Good: you remembered.', 'Good : vous vous en êtes souvenu.', 'Good: تذكّرت.'),
          t('Easy: very easy. The card comes back much later.', 'Easy : très facile. La carte revient beaucoup plus tard.', 'Easy: سهل جدًا. تعود البطاقة بعد وقت أطول بكثير.'),
        ],
      },
      {
        type: 'tip',
        text: t(
          '5 minutes every day is better than 1 hour once a week. A red number on the Review tab means cards are waiting.',
          '5 minutes chaque jour valent mieux qu’une heure par semaine. Un nombre rouge sur l’onglet Review signifie que des cartes vous attendent.',
          '5 دقائق كل يوم أفضل من ساعة في الأسبوع. الرقم الأحمر على تبويب Review يعني أن هناك بطاقات تنتظرك.',
        ),
      },
    ],
  },
  {
    id: 'topics',
    icon: 'compass',
    title: t('Topics: ideas to talk about', 'Sujets : des idées de discussion', 'المواضيع: أفكار للحديث'),
    summary: t('Do not know what to say? Start here.', 'Vous ne savez pas quoi dire ? Commencez ici.', 'لا تعرف ماذا تقول؟ ابدأ من هنا.'),
    go: { label: t('Open Topics', 'Ouvrir Topics', 'افتح المواضيع'), href: '/topics', tab: true },
    blocks: [
      {
        type: 'steps',
        items: [
          t('Open the Topics tab. The app writes conversation ideas about your interests.', 'Ouvrez l’onglet Topics. L’appli écrit des idées de conversation sur vos centres d’intérêt.', 'افتح تبويب Topics. يكتب التطبيق أفكار محادثة عن اهتماماتك.'),
          t('Tap “Show details” to see starter questions, key words with translations, and a role-play scene.', 'Touchez « Show details » pour voir des questions de départ, des mots clés avec traductions et une scène de jeu de rôle.', 'اضغط «Show details» لترى أسئلة البداية وكلمات رئيسية مع ترجمتها ومشهد لعب أدوار.'),
          t('Tap “Talk” to chat about it, or “Play this scene” to role-play.', 'Touchez « Talk » pour en discuter, ou « Play this scene » pour jouer la scène.', 'اضغط «Talk» لتتحدث عنه أو «Play this scene» لتمثّل المشهد.'),
          t('Tap the heart to keep a favourite. “Surprise me” mixes two interests.', 'Touchez le cœur pour garder un favori. « Surprise me » mélange deux centres d’intérêt.', 'اضغط القلب لتحتفظ بمفضّلة. «Surprise me» تمزج بين اهتمامين.'),
        ],
      },
    ],
  },
  {
    id: 'progress',
    icon: 'trending-up',
    title: t('Progress and streak', 'Progrès et série de jours', 'التقدّم وسلسلة الأيام'),
    summary: t('See how much you practise and where to improve.', 'Voyez combien vous vous entraînez et où progresser.', 'شاهد كم تتدرّب وأين تتحسّن.'),
    go: { label: t('Open Progress', 'Ouvrir Progress', 'افتح التقدّم'), href: '/progress', tab: false },
    blocks: [
      {
        type: 'p',
        text: t(
          'On Home, scroll down to “Your progress”. You see your day streak, how much you practised in 30 days, your conversation scores, your mistakes by type, and your skills.',
          'Sur Home, descendez jusqu’à « Your progress ». Vous voyez votre série de jours, votre activité sur 30 jours, vos notes de discussion, vos erreurs par type et vos compétences.',
          'في الرئيسية انزل إلى «Your progress». ترى سلسلة أيامك ونشاطك خلال 30 يومًا ودرجات محادثاتك وأخطاءك حسب النوع ومهاراتك.',
        ),
      },
      {
        type: 'bullets',
        items: [
          t('Day streak: the number of days in a row you practised. Chat or review every day to keep it.', 'Série de jours : le nombre de jours d’affilée où vous vous êtes entraîné. Discutez ou révisez chaque jour pour la garder.', 'سلسلة الأيام: عدد الأيام المتتالية التي تدرّبت فيها. حادث أو راجع كل يوم لتحافظ عليها.'),
          t('Each chart has a “Table” button if you prefer numbers.', 'Chaque graphique a un bouton « Table » si vous préférez les chiffres.', 'لكل رسم بياني زر «Table» إن كنت تفضل الأرقام.'),
        ],
      },
    ],
  },
  {
    id: 'settings',
    icon: 'settings',
    title: t('Settings that help you', 'Les réglages qui vous aident', 'إعدادات تساعدك'),
    summary: t('Your language, how strict the coach is.', 'Votre langue, la sévérité du coach.', 'لغتك ومدى صرامة المدرّب.'),
    go: { label: t('Open Settings', 'Ouvrir Settings', 'افتح الإعدادات'), href: '/settings', tab: false },
    blocks: [
      {
        type: 'bullets',
        items: [
          t('Explain corrections in: English only, Français or العربية. Beginners: choose your own language.', 'Explain corrections in : English only, Français ou العربية. Débutants : choisissez votre langue.', 'Explain corrections in: English only أو Français أو العربية. للمبتدئين: اختر لغتك.'),
          t('Corrections: “After every message” (best for learning) or “At the end” (a smoother chat).', 'Corrections : « After every message » (le mieux pour apprendre) ou « At the end » (discussion plus fluide).', 'Corrections: «After every message» (الأفضل للتعلّم) أو «At the end» (محادثة أكثر انسيابية).'),
          t('Strictness: Gentle (only clear mistakes), Normal, Strict (also style and word choice).', 'Strictness : Gentle (seulement les erreurs claires), Normal, Strict (aussi le style et le choix des mots).', 'Strictness: Gentle (الأخطاء الواضحة فقط) أو Normal أو Strict (مع الأسلوب واختيار الكلمات).'),
          t('Models: the AI models the coach uses. The default is fine.', 'Models : les modèles d’IA utilisés par le coach. Le réglage par défaut convient.', 'Models: نماذج الذكاء الاصطناعي التي يستخدمها المدرّب. الإعداد الافتراضي مناسب.'),
          t('Also here: “Retake the level test”, “Sign out” and the “Server” address.', 'Ici aussi : « Retake the level test », « Sign out » et l’adresse du « Server ».', 'وهنا أيضًا: «Retake the level test» و«Sign out» وعنوان «Server».'),
        ],
      },
      {
        type: 'tip',
        text: t(
          'Change Strictness as you grow: Gentle for A1–A2, Normal for B1–B2, Strict for C1–C2.',
          'Changez Strictness en progressant : Gentle pour A1–A2, Normal pour B1–B2, Strict pour C1–C2.',
          'غيّر Strictness مع تقدّمك: Gentle لـ A1–A2 وNormal لـ B1–B2 وStrict لـ C1–C2.',
        ),
      },
    ],
  },
  {
    id: 'plan',
    icon: 'calendar',
    title: t('Your plan for every level', 'Votre plan pour chaque niveau', 'خطتك لكل مستوى'),
    summary: t('What to do each day, from A1 to C2.', 'Que faire chaque jour, de A1 à C2.', 'ماذا تفعل كل يوم، من A1 إلى C2.'),
    blocks: [{ type: 'plan' }],
  },
  {
    id: 'words',
    icon: 'language',
    title: t('Words you will see in the app', 'Les mots que vous verrez dans l’appli', 'كلمات سترونها في التطبيق'),
    summary: t('The buttons and titles, translated.', 'Les boutons et les titres, traduits.', 'الأزرار والعناوين مترجمة.'),
    blocks: [{ type: 'glossary' }],
  },
  {
    id: 'help',
    icon: 'help-buoy',
    title: t('Problems? Quick answers', 'Un problème ? Réponses rapides', 'مشكلة؟ إجابات سريعة'),
    summary: t('If something does not work.', 'Si quelque chose ne marche pas.', 'إذا لم يعمل شيء ما.'),
    blocks: [
      {
        type: 'faq',
        items: [
          {
            q: t('The app says it cannot connect.', 'L’appli dit qu’elle ne peut pas se connecter.', 'يقول التطبيق إنه لا يستطيع الاتصال.'),
            a: t(
              'Check your internet or Wi-Fi. If you use a private server, the server must be on and its address must be right: open “Server” on the sign-in screen (or in Settings) and check it.',
              'Vérifiez votre internet ou le Wi-Fi. Si vous utilisez un serveur privé, il doit être allumé et son adresse doit être juste : ouvrez « Server » sur l’écran de connexion (ou dans Settings) et vérifiez-la.',
              'تحقق من الإنترنت أو الواي فاي. إذا كنت تستخدم خادمًا خاصًا فيجب أن يكون يعمل وعنوانه صحيحًا: افتح «Server» في شاشة الدخول (أو في Settings) وراجعه.',
            ),
          },
          {
            q: t('It asks me to add a key.', 'Il me demande d’ajouter une clé.', 'يطلب مني إضافة مفتاح.'),
            a: t(
              'Go to Settings → “Gemini API key” and add your key. See “Get your free Gemini key”.',
              'Allez dans Settings → « Gemini API key » et ajoutez votre clé. Voir « Obtenir votre clé Gemini gratuite ».',
              'اذهب إلى Settings ← «Gemini API key» وأضف مفتاحك. راجع قسم «احصل على مفتاح Gemini المجاني».',
            ),
          },
          {
            q: t('“Too many requests” or “daily limit”.', '« Too many requests » ou « daily limit ».', '«Too many requests» أو «daily limit».'),
            a: t(
              'Free keys have limits. For “too many requests”, wait one minute. For the daily limit, wait until tomorrow or choose another model in Settings → Preferences.',
              'Les clés gratuites ont des limites. Pour « too many requests », attendez une minute. Pour la limite quotidienne, attendez demain ou choisissez un autre modèle dans Settings → Preferences.',
              'للمفاتيح المجانية حدود. عند «too many requests» انتظر دقيقة. وعند الحد اليومي انتظر حتى الغد أو اختر نموذجًا آخر في Settings ← Preferences.',
            ),
          },
          {
            q: t('The microphone does not work.', 'Le micro ne fonctionne pas.', 'الميكروفون لا يعمل.'),
            a: t(
              'Allow the microphone for English Coach in your phone settings. Speak for at least 2 seconds, near the phone.',
              'Autorisez le micro pour English Coach dans les réglages du téléphone. Parlez au moins 2 secondes, près du téléphone.',
              'اسمح للميكروفون لتطبيق English Coach في إعدادات هاتفك. تكلّم ثانيتين على الأقل وقريبًا من الهاتف.',
            ),
          },
          {
            q: t('I hear no sound.', 'Je n’entends aucun son.', 'لا أسمع أي صوت.'),
            a: t(
              'Turn up the volume. On iPhone, check that the silent switch is off.',
              'Montez le volume. Sur iPhone, vérifiez que le mode silencieux est désactivé.',
              'ارفع الصوت. وعلى آيفون تأكد أن مفتاح الصامت مُغلق.',
            ),
          },
          {
            q: t('The coach’s answer is too hard.', 'La réponse du coach est trop difficile.', 'رد المدرّب صعب جدًا.'),
            a: t(
              'Tap any word to see its meaning, turn on the slow speaker, and write: “Please use easy words.”',
              'Touchez un mot pour voir sa signification, activez le haut-parleur lent et écrivez : « Please use easy words. »',
              'اضغط أي كلمة لترى معناها وفعّل السماعة البطيئة واكتب: «Please use easy words.»',
            ),
          },
          {
            q: t('My level result looks wrong.', 'Mon niveau me semble faux.', 'نتيجة مستواي تبدو خاطئة.'),
            a: t(
              'Retake the test any time. Do not guess: tap “I don’t know” when you are not sure.',
              'Repassez le test à tout moment. Ne devinez pas : touchez « I don’t know » quand vous n’êtes pas sûr.',
              'أعد الاختبار في أي وقت. لا تخمّن: اضغط «I don’t know» حين لا تكون متأكدًا.',
            ),
          },
          {
            q: t('I forgot my password.', 'J’ai oublié mon mot de passe.', 'نسيت كلمة المرور.'),
            a: t(
              'There is no password reset yet. You can create a new account with another email.',
              'Il n’y a pas encore de réinitialisation du mot de passe. Vous pouvez créer un nouveau compte avec une autre adresse e-mail.',
              'لا توجد إعادة تعيين لكلمة المرور حتى الآن. يمكنك إنشاء حساب جديد ببريد إلكتروني آخر.',
            ),
          },
        ],
      },
    ],
  },
];

export const sectionById = (id: string): Section | undefined => SECTIONS.find((s) => s.id === id);
