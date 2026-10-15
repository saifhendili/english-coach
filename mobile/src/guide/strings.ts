import type { T } from './content';

const t = (en: string, fr: string, ar: string): T => ({ en, fr, ar });

// The text of the guide screen itself (the sections are in content.ts).
export const UI = {
  title: t('Guide', 'Guide', 'الدليل'),
  intro: t(
    'Everything you need, step by step. Read it slowly. You can come back at any time.',
    'Tout ce qu’il faut savoir, pas à pas. Lisez-le tranquillement. Vous pouvez y revenir à tout moment.',
    'كل ما تحتاجه خطوة بخطوة. اقرأه بهدوء. ويمكنك العودة إليه في أي وقت.',
  ),
  language: t('Language of the guide', 'Langue du guide', 'لغة الدليل'),
  coachAsk: t('Do you want the coach to explain your mistakes in this language?', 'Voulez-vous que le coach explique vos erreurs dans cette langue ?', 'هل تريد أن يشرح لك المدرّب أخطاءك بهذه اللغة؟'),
  coachYes: t('Yes, use it', 'Oui, utiliser cette langue', 'نعم، استخدمها'),
  coachSaved: t('Done. The coach now explains in this language.', 'C’est fait. Le coach explique maintenant dans cette langue.', 'تم. صار المدرّب يشرح بهذه اللغة.'),
  coachFailed: t('It did not work. Try again in Settings.', 'Ça n’a pas marché. Réessayez dans Settings.', 'لم ينجح الأمر. حاول مرة أخرى في Settings.'),
  sectionsCount: t('sections', 'sections', 'أقسام'),
  yourLevel: t('Choose your level', 'Choisissez votre niveau', 'اختر مستواك'),
  atThisLevel: t('At this level', 'À ce niveau', 'في هذا المستوى'),
  focus: t('Focus', 'Priorité', 'التركيز'),
  aGoodDay: t('A good day', 'Une bonne journée', 'يوم جيد'),
  minutes: t('min', 'min', 'د'),
  total: t('Total', 'Total', 'المجموع'),
  goal: t('Goal', 'Objectif', 'الهدف'),
  inTheApp: t('In the app', 'Dans l’appli', 'في التطبيق'),
  footer: t(
    'You can open this guide again from Settings, or with the ? button at the top of each screen.',
    'Vous pouvez rouvrir ce guide depuis Settings, ou avec le bouton ? en haut de chaque écran.',
    'يمكنك فتح هذا الدليل مرة أخرى من Settings أو بزر ؟ أعلى كل شاشة.',
  ),
  step: t('Step', 'Étape', 'الخطوة'),
};

// The card on Home (and the link on the sign-in screen) is shown in all three languages at once, so a beginner can find it.
export const HOME_CARD = {
  title: t('New here? Read the guide', 'Nouveau ici ? Lisez le guide', 'جديد هنا؟ اقرأ الدليل'),
  text: t('2 minutes, step by step', '2 minutes, pas à pas', 'دقيقتان، خطوة بخطوة'),
  open: t('Open the guide', 'Ouvrir le guide', 'افتح الدليل'),
  later: t('Not now', 'Plus tard', 'ليس الآن'),
};
export const LOGIN_LINK = t('How does it work?', 'Comment ça marche ?', 'كيف يعمل؟');
