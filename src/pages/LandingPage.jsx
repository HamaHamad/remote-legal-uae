import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { ThemeToggle } from '@/components/ThemeToggle'

// ─── WhatsApp number — change to real number ──────────────────────
const WA_NUMBER = '971501234567'
const WA_URL = `https://wa.me/${WA_NUMBER}?text=Hello%2C+I+need+help+with+a+UAE+case`

// ─── Language content ─────────────────────────────────────────────
const LANG_META = {
  en: { flag: '🇬🇧', label: 'EN', dir: 'ltr' },
  ar: { flag: '🇦🇪', label: 'عر', dir: 'rtl' },
  hi: { flag: '🇮🇳', label: 'हि', dir: 'ltr' },
  ur: { flag: '🇵🇰', label: 'ار', dir: 'rtl' },
  tl: { flag: '🇵🇭', label: 'TL', dir: 'ltr' },
}

const COPY = {
  en: {
    nav: { brand: 'ExpatUAE', login: 'Log In', start: 'Start Free' },
    hero: {
      badge: 'AI-assisted intake · Licensed UAE lawyers',
      headline: 'Clarity for expats facing UAE legal, financial, and immigration issues.',
      sub: 'An AI-assisted intake platform that helps you understand your situation, organises your documents, and connects you to licensed UAE lawyers and experts for the actual work. We are not a law firm — we help you start smart.',
      cta1: 'Start Free Assessment',
      cta2: 'See How It Works',
      trust: ['Free initial questionnaire', 'No card required', 'Takes about 5 minutes'],
      disclaimer:
        'Free initial questionnaire. No legal advice is provided by ExpatUAE. All legal work is handled by independent licensed UAE lawyers.',
    },
    selector: {
      title: 'What best describes your situation?',
      items: [
        { id: 'banking', icon: '🏦', label: 'Bank Debt', desc: 'Loans, frozen accounts, interest' },
        { id: 'car', icon: '🚗', label: 'Car Left Behind', desc: 'Fines, repossession, loans' },
        { id: 'legal', icon: '⚖️', label: 'Legal Issue', desc: 'Court cases, travel bans' },
        { id: 'employment', icon: '💼', label: 'Job Problem', desc: 'Unpaid salary, disputes' },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: 'Free initial assessment' },
        { icon: '✓', text: 'Confidential & encrypted' },
        { icon: '✓', text: '5-minute questionnaire' },
      ],
    },
    aiPreview: {
      title: 'We help you understand your case',
      sub: 'Based on your situation, our AI may identify:',
      bullets: [
        'The type of issue you appear to have',
        'What kind of professional typically handles it',
        'Documents you may need to gather',
        'Questions worth asking a lawyer',
      ],
      lockTitle: 'Get your detailed AI report',
      lockSub: 'A deeper written analysis with risk-area flagging and a clean handover document',
      lockCta: 'Start Free Assessment',
      blurItems: [
        'Summary of your situation and the issues identified…',
        'Suggested type of professional who handles this matter…',
        'Documents to gather before speaking with a lawyer…',
        'Questions to ask and potential risk areas to discuss…',
      ],
    },
    docAI: {
      badge: 'Document Intelligence',
      title: "We don't just store your documents — we understand them.",
      sub: 'Upload any contract, bank statement, or legal notice. AI extracts risks, obligations, and exact next steps in seconds.',
      items: [
        'Contracts & agreements',
        'Bank statements',
        'Legal documents & court notices',
        'Employment papers',
      ],
      cta: 'Upload & Analyze My Documents',
    },
    how: {
      title: 'How it works',
      subtitle: 'Nothing happens instantly — each step is honest about timing.',
      steps: [
        {
          num: '01',
          title: 'Tell us your situation',
          desc: 'Answer a structured questionnaire. Free, confidential, 5–10 minutes.',
        },
        {
          num: '02',
          title: 'Get an AI-assisted summary',
          desc: 'Our AI reviews your inputs and produces a structured summary. Informational only — not legal advice.',
        },
        {
          num: '03',
          title: 'Choose a paid report',
          desc: 'Optional: a deeper written analysis with risk flagging and a handover document.',
        },
        {
          num: '04',
          title: 'Connect with a professional',
          desc: 'If you choose, we introduce you to a licensed UAE law firm or expert. They work independently.',
        },
      ],
      callout:
        'You stay in control at every step. We help you start; a qualified professional handles the legal work.',
    },
    execution: {
      title: 'Connect with licensed professionals',
      sub: 'We match you with the right professional for your issue.',
      roles: [
        {
          icon: '⚖️',
          title: 'Licensed UAE Lawyers',
          desc: 'Court filings, legal disputes, negotiations',
        },
        { icon: '🏛️', title: 'Government PROs', desc: 'Ministry filings, official documentation' },
        {
          icon: '🤝',
          title: 'Debt Negotiators',
          desc: 'Bank settlements and payment restructuring',
        },
      ],
    },
    pricing: {
      badge: 'Pricing',
      title: 'Transparent, tiered pricing',
      subtitle:
        'Start free. Pay only when you want a deeper analysis. Lawyer fees are separate and set by the lawyer.',
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price: null,
          priceLabel: 'No card required',
          desc: "Start here if you're not sure what you need.",
          features: [
            'Structured intake questionnaire',
            'Short AI-generated summary',
            'Suggested professional type',
          ],
          cta: 'Start Free',
          highlighted: false,
        },
        {
          id: 'basic',
          name: 'Basic',
          price: 'AED 299',
          priceLabel: 'One-time payment',
          desc: 'AI analysis + summary report',
          features: [
            'Everything in Free',
            'Detailed written AI report',
            'Document intelligence on up to 3 files',
            'Clean handover PDF',
          ],
          cta: 'Get Basic Report',
          highlighted: false,
        },
        {
          id: 'standard',
          name: 'Standard',
          price: 'AED 499–599',
          priceLabel: 'One-time + intro call',
          desc: 'AI report + lawyer matching + intro call',
          features: [
            'Everything in Basic',
            'Matching to a licensed UAE law firm',
            'Intro call with matched professional (15–30 min)',
            'Document handover to the lawyer',
            'Lawyer confirms if they can take your case',
          ],
          cta: 'Get Standard',
          highlighted: true,
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 'AED 999+',
          priceLabel: 'One-time + priority support',
          desc: 'Higher-touch support for complex matters',
          features: [
            'Everything in Standard',
            'Priority matching',
            'File prep support',
            'Follow-up summary if situation changes',
            'Best for multi-issue matters',
          ],
          cta: 'Get Premium',
          highlighted: false,
        },
      ],
      popularLabel: 'Most Popular',
      monetizationTitle: 'How we make money',
      monetizationText:
        'We earn through assessment fees paid by users for paid reports. When you choose to engage a lawyer we introduce you to, we may also receive a referral fee from that law firm. This does not increase what you pay the lawyer and is disclosed before you commit to anything.',
      monetizationNote:
        'No hidden fees. You will always see the price before you pay. Lawyer fees are set by the lawyer and agreed directly between you and them.',
      disclaimer:
        'Paid reports are informational products, not legal advice. Lawyer fees are separate. ExpatUAE may receive a referral fee from partner firms; this is disclosed before you commit.',
    },
    lawyers: {
      badge: 'For Lawyers & Law Firms',
      title: 'Receive qualified, pre-screened leads',
      sub: 'ExpatUAE sends you cases that have already been through structured intake and AI-assisted summarisation. You spend less time on fact-finding calls and more time on actual legal work.',
      sendTitle: 'What we send you',
      sendItems: [
        'A clean intake summary covering issue type, parties, timeline, and documents',
        'Organised, indexed document bundle',
        "The user's preferred language and contact preferences",
        'Confirmation that the user has consented to share their file with you',
      ],
      dontTitle: "What we don't do",
      dontItems: [
        "We don't give the user legal advice on your behalf",
        "We don't represent users in court or in negotiations",
        "We don't set your fees, manage your caseload, or supervise your work",
        "We don't take a percentage of your professional fees — only an optional pre-agreed referral fee, disclosed to the user",
      ],
      complianceLabel: 'Compliance note',
      complianceText:
        'ExpatUAE does not practise law, employ lawyers, or split legal fees. Every partner firm operates independently under its own professional licence.',
      onboardingText:
        "If you're a licensed UAE law firm or a regulated professional, apply to join the network. We verify licence status with the UAE Ministry of Justice before listing any partner. Onboarding typically takes 5–10 business days.",
      applyCta: 'Apply to Join',
    },
    faq: {
      badge: 'FAQ',
      title: 'Frequently asked questions',
      items: [
        {
          q: 'Is ExpatUAE a law firm?',
          a: 'No. We are a technology platform that provides AI-assisted intake and connects users to independent licensed UAE lawyers and experts.',
        },
        {
          q: 'Will I get legal advice from ExpatUAE?',
          a: 'No. Our AI summaries are informational only. For legal advice, you need to speak with a licensed UAE lawyer — which we can help arrange.',
        },
        {
          q: 'Do you guarantee a specific outcome?',
          a: 'No. No one can guarantee the outcome of a legal matter. Anyone who promises you a result is not being honest.',
        },
        {
          q: 'How much does it cost?',
          a: 'The basic questionnaire is free. Paid AI reports start at AED 299. Lawyer fees are separate and are set by the lawyer.',
        },
        {
          q: 'Is my information confidential?',
          a: 'Yes. Your data is encrypted at rest and in transit, access is restricted, and we never sell your information. You can request deletion at any time.',
        },
        { q: 'Which languages do you support?', a: 'Arabic, English, Hindi, Urdu, and Tagalog.' },
        {
          q: 'Can I use my own lawyer?',
          a: 'Yes. The paid AI report includes a clean PDF you can share with any lawyer of your choosing.',
        },
      ],
    },
    whatsapp: {
      title: 'Need help right now?',
      sub: 'Talk to a real person in minutes',
      cta: 'Chat Now on WhatsApp',
      note: 'Available 7 days · English, Arabic, Hindi, Urdu, Filipino',
    },
    trust: {
      title: 'Your case is protected',
      items: [
        { icon: '🔒', text: 'Secure document handling' },
        { icon: '🕵️', text: 'Confidential process' },
        { icon: '✅', text: 'Verified professionals' },
        { icon: '🌍', text: 'UAE-law compliant' },
      ],
    },
    footer: {
      disclaimer:
        'ExpatUAE is a technology platform, not a law firm. We do not provide legal advice and do not guarantee any outcome. All legal work is performed by independent licensed UAE professionals. Using ExpatUAE does not create a lawyer–client relationship between you and ExpatUAE.',
      links: ['Privacy', 'Terms', 'Cookies', 'Contact'],
    },
    sticky: 'Start Free Assessment',
  },
  ar: {
    nav: { brand: 'ExpatUAE', login: 'تسجيل الدخول', start: 'ابدأ مجاناً' },
    hero: {
      badge: 'استيعاب بمساعدة الذكاء الاصطناعي · محامون مرخصون في الإمارات',
      headline: 'وضوح للمغتربين الذين يواجهون قضايا قانونية ومالية وهجرة في الإمارات.',
      sub: 'منصة استيعاب بمساعدة الذكاء الاصطناعي تساعدك على فهم وضعك، وتنظم مستنداتك، وتوصلك بمحامين وخبراء مرخصين في الإمارات للعمل الفعلي. نحن لسنا مكتب محاماة — نساعدك على البدء بذكاء.',
      cta1: 'ابدأ التقييم المجاني',
      cta2: 'شاهد كيف يعمل',
      trust: ['استبيان أولي مجاني', 'لا حاجة لبطاقة', 'يستغرق حوالي 5 دقائق'],
      disclaimer:
        'استبيان أولي مجاني. لا يتم تقديم استشارات قانونية من ExpatUAE. جميع الأعمال القانونية يقوم بها محامون مستقلون مرخصون في الإمارات.',
    },
    selector: {
      title: 'ما الذي يصف وضعك بشكل أفضل؟',
      items: [
        { id: 'banking', icon: '🏦', label: 'ديون بنكية', desc: 'قروض، حسابات مجمدة، فوائد' },
        { id: 'car', icon: '🚗', label: 'سيارة متروكة', desc: 'مخالفات، مصادرة، قروض' },
        { id: 'legal', icon: '⚖️', label: 'قضية قانونية', desc: 'قضايا محاكم، حظر سفر' },
        { id: 'employment', icon: '💼', label: 'مشكلة عمل', desc: 'رواتب غير مدفوعة، نزاعات' },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: 'تقييم أولي مجاني' },
        { icon: '✓', text: 'سرية ومشفرة' },
        { icon: '✓', text: 'استبيان 5 دقائق' },
      ],
    },
    aiPreview: {
      title: 'نساعدك على فهم قضيتك',
      sub: 'بناءً على وضعك، قد يحدد الذكاء الاصطناعي:',
      bullets: [
        'نوع المشكلة التي تبدو لديك',
        'نوع المحترف الذي يتولى عادةً مثل هذه القضايا',
        'المستندات التي قد تحتاج إلى جمعها',
        'أسئلة تستطرحها على المحامي',
      ],
      lockTitle: 'احصل على تقرير الذكاء الاصطناعي المفصل',
      lockSub: 'تحليل مكتوب أعمق مع تحديد مناطق الخطر ومستند تسليم نظيف',
      lockCta: 'ابدأ التقييم المجاني',
      blurItems: [
        'ملخص لوضعك والمشاكل المحددة…',
        'نوع المحترف المقترح الذي يتولى هذا الأمر…',
        'المستندات التي يجب جمعها قبل التحدث إلى محامٍ…',
        'أسئلة تطرحها ومناطق خطر محتملة لمناقشتها…',
      ],
    },
    docAI: {
      badge: 'ذكاء المستندات',
      title: 'نحن لا نخزن مستنداتك فقط — بل نفهمها.',
      sub: 'ارفع أي عقد أو كشف حساب أو إشعار قانوني. يستخرج الذكاء الاصطناعي المخاطر والالتزامات والخطوات الفعلية التالية في ثوانٍ.',
      items: [
        'العقود والاتفاقيات',
        'كشوف الحسابات البنكية',
        'المستندات القانونية وإشعارات المحاكم',
        'أوراق التوظيف',
      ],
      cta: 'ارفع مستنداتي وحللها',
    },
    how: {
      title: 'كيف يعمل',
      subtitle: 'لا شيء يحدث فوراً — كل خطوة صادقة حول التوقيت.',
      steps: [
        { num: '٠١', title: 'أخبرنا بوضعك', desc: 'أجب عن استبيان منظم. مجاني، سرية، 5-10 دقائق.' },
        {
          num: '٠٢',
          title: 'احصل على ملخص بمساعدة الذكاء الاصطناعي',
          desc: 'يراجع الذكاء الاصطناعي مدخلاتك وينتج ملخصاً منظماً. للمعلومات فقط — ليس استشارة قانونية.',
        },
        {
          num: '٠٣',
          title: 'اختر تقريراً مدفوعاً',
          desc: 'اختياري: تحليل مكتوب أعمق مع تحديد المخاطر ومستند تسليم.',
        },
        {
          num: '٠٤',
          title: 'تواصل مع محترف',
          desc: 'إذا اخترت، نقدمك إلى مكتب محاماة أو خبير مرخص في الإمارات. يعملون بشكل مستقل.',
        },
      ],
      callout: 'تبقى مسيطراً في كل خطوة. نساعدك على البدء؛ يتولى محترف مؤهل العمل القانوني.',
    },
    execution: {
      title: 'تواصل مع محترفين مرخصين',
      sub: 'نطابقك مع المحترف المناسب لقضيتك.',
      roles: [
        {
          icon: '⚖️',
          title: 'محامون إماراتيون مرخّصون',
          desc: 'رفع دعاوى، نزاعات قانونية، مفاوضات',
        },
        { icon: '🏛️', title: 'متخصصو العلاقات الحكومية', desc: 'معاملات وزارية، وثائق رسمية' },
        { icon: '🤝', title: 'مفاوضو الديون', desc: 'تسويات بنكية وإعادة هيكلة المدفوعات' },
      ],
    },
    pricing: {
      badge: 'التسعير',
      title: 'تسعير متدرج شفاف',
      subtitle:
        'ابدأ مجاناً. ادفع فقط عندما تريد تحليلاً أعمق. رسوم المحامي منفصلة ويحددها المحامي.',
      tiers: [
        {
          id: 'free',
          name: 'مجاني',
          price: null,
          priceLabel: 'لا حاجة لبطاقة',
          desc: 'ابدأ هنا إذا لم تكن متأكداً مما تحتاجه.',
          features: [
            'استبيان استيعاب منظم',
            'ملخص قصير من الذكاء الاصطناعي',
            'نوع المحترف المقترح',
          ],
          cta: 'ابدأ مجاناً',
          highlighted: false,
        },
        {
          id: 'basic',
          name: 'أساسي',
          price: 'AED 299',
          priceLabel: 'دفعة واحدة',
          desc: 'تحليل الذكاء الاصطناعي + تقرير ملخص',
          features: [
            'كل ما هو مجاني',
            'تقرير ذكاء اصطناعي مكتوب مفصل',
            'ذكاء المستندات على 3 ملفات',
            'ملف تسليم PDF نظيف',
          ],
          cta: 'احصل على تقرير أساسي',
          highlighted: false,
        },
        {
          id: 'standard',
          name: 'قياسي',
          price: 'AED 499–599',
          priceLabel: 'دفعة واحدة + مكالمة تعريفية',
          desc: 'تقرير الذكاء الاصطناعي + مطابقة المحامي + مكالمة تعريفية',
          features: [
            'كل ما هو أساسي',
            'المطابقة مع مكتب محاماة مرخص في الإمارات',
            'مكالمة تعريفية مع المحترف المطابق (15-30 دقيقة)',
            'تسليم المستندات للمحامي',
            'يؤكد المحامي ما إذا كان يمكنه تولي قضيتك',
          ],
          cta: 'احصل على قياسي',
          highlighted: true,
        },
        {
          id: 'premium',
          name: 'متميز',
          price: 'AED 999+',
          priceLabel: 'دفعة واحدة + دعم ذو أولوية',
          desc: 'دعم أعلى للمسائل المعقدة',
          features: [
            'كل ما هو قياسي',
            'مطابقة ذات أولوية',
            'دعم إعداد الملف',
            'ملخص متابعة إذا تغير وضعك',
            'الأفضل للمسائل متعددة القضايا',
          ],
          cta: 'احصل على متميز',
          highlighted: false,
        },
      ],
      popularLabel: 'الأكثر شيوعاً',
      monetizationTitle: 'كيف نكسب المال',
      monetizationText:
        'نكسب من رسوم التقييم التي يدفعها المستخدمون للتقارير المدفوعة. عندما تختار التعاقد مع محامٍ نقدمه لك، قد نتلقى أيضاً رسوم إحالة من مكتب المحاماة ذلك. هذا لا يزيد ما تدفعه للمحامي ويتم الإفصاح عنه قبل الالتزام بأي شيء.',
      monetizationNote:
        'لا رسوم خفية. سترى السعر دائماً قبل أن تدفع. رسوم المحامي يحددها المحامي وتتفق عليها مباشرة بينك وبينه.',
      disclaimer:
        'التقارير المدفوعة هي منتجات معلوماتية، وليست استشارة قانونية. رسوم المحامي منفصلة. قد تتلقى ExpatUAE رسوم إحالة من الشركات الشريكة؛ يتم الإفصاح عن ذلك قبل الالتزام.',
    },
    lawyers: {
      badge: 'للمحامين ومكاتب المحاماة',
      title: 'تلقى عملاء مؤهلين ومفحوصين مسبقاً',
      sub: 'يرسل لك ExpatUAE قضايا مرت بالفعل عبر استيعاب منظم وتلخيص بمساعدة الذكاء الاصطناعي. تقضي وقتاً أقل على مكالمات البحث عن الحقائق ووقتاً أكثر على العمل القانوني الفعلي.',
      sendTitle: 'ما نرسله لك',
      sendItems: [
        'ملخص استيعاب نظيف يغطي نوع القضية والأطراف والجدول الزمني والمستندات',
        'حزمة مستندات منظمة ومفهرسة',
        'اللغة المفضلة للمستخدم وتفضيلات الاتصال',
        'تأكيد أن المستخدم وافق على مشاركة ملفه معك',
      ],
      dontTitle: 'ما لا نفعله',
      dontItems: [
        'لا نعطي المستخدم استشارة قانونية نيابة عنك',
        'لا نمثل المستخدمين في المحكمة أو في المفاوضات',
        'لا نحدد رسومك أو ندير عبء عملك أو نشرف على عملك',
        'لا نأخذ نسبة من رسومك المهنية — فقط رسم إحالة اختياري متفق عليه مسبقاً',
      ],
      complianceLabel: 'ملاحظة الامتثال',
      complianceText:
        'ExpatUAE لا يمارس المحاماة أو يوظف محامين أو يقسم الرسوم القانونية. كل شركة شريكة تعمل بشكل مستقل تحت ترخيصها المهني الخاص.',
      onboardingText:
        'إذا كنت مكتب محاماة مرخص في الإمارات أو محترفاً منظماً، تقدم للانضمام إلى الشبكة. نتحقق من حالة الترخيص مع وزارة العدل الإماراتية قبل إدراج أي شريك. عادة ما يستغرق الإعداد من 5 إلى 10 أيام عمل.',
      applyCta: 'تقدم للانضمام',
    },
    faq: {
      badge: 'الأسئلة الشائعة',
      title: 'الأسئلة المتكررة',
      items: [
        {
          q: 'هل ExpatUAE مكتب محاماة؟',
          a: 'لا. نحن منصة تقنية توفر استيعاباً بمساعدة الذكاء الاصطناعي وتوصيل المستخدمين بمحامين وخبراء مستقلين مرخصين في الإمارات.',
        },
        {
          q: 'هل سأحصل على استشارة قانونية من ExpatUAE؟',
          a: 'لا. ملخصات الذكاء الاصطناعي لدينا للمعلومات فقط. للحصول على استشارة قانونية، تحتاج إلى التحدث مع محامٍ مرخص في الإمارات — وهو ما يمكننا المساعدة في ترتيبه.',
        },
        {
          q: 'هل تضمن نتيجة محددة؟',
          a: 'لا. لا أحد يمكنه ضمان نتيجة مسألة قانونية. أي شخص يعدك بنتيجة ليس صادقاً.',
        },
        {
          q: 'كم التكلفة؟',
          a: 'الاستبيان الأساسي مجاني. تبدأ تقارير الذكاء الاصطناعي المدفوعة من 299 درهم. رسوم المحامي منفصلة ويحددها المحامي.',
        },
        {
          q: 'هل معلوماتي سرية؟',
          a: 'نعم. بياناتك مشفرة في حالة السكون والعبور، والوصول مقيد، ونحن لا نبيع معلوماتك أبداً. يمكنك طلب الحذف في أي وقت.',
        },
        { q: 'ما اللغات التي تدعمها؟', a: 'العربية والإنجليزية والهندية والأردية والفلبينية.' },
        {
          q: 'هل يمكنني استخدام محامي الخاص؟',
          a: 'نعم. يتضمن تقرير الذكاء الاصطناعي المدفوع ملف PDF نظيف يمكنك مشاركته مع أي محامٍ تختاره.',
        },
      ],
    },
    whatsapp: {
      title: 'تحتاج مساعدة الآن؟',
      sub: 'تحدث مع شخص حقيقي في دقائق',
      cta: 'تحدث الآن على واتساب',
      note: 'متاح 7 أيام · عربي، إنجليزي، هندي، أردي، فلبيني',
    },
    trust: {
      title: 'قضيتك محمية',
      items: [
        { icon: '🔒', text: 'معالجة آمنة للمستندات' },
        { icon: '🕵️', text: 'عملية سرية' },
        { icon: '✅', text: 'متخصصون معتمدون' },
        { icon: '🌍', text: 'متوافق مع القانون الإماراتي' },
      ],
    },
    footer: {
      disclaimer:
        'ExpatUAE منصة تقنية، وليست مكتب محاماة. نحن لا نقدم استشارات قانونية ولا نضمن أي نتيجة. جميع الأعمال القانونية يقوم بها محترفون مستقلون مرخصون في الإمارات. استخدام ExpatUAE لا ينشئ علاقة محامٍ–موكل بينك وبين ExpatUAE.',
      links: ['الخصوصية', 'الشروط', 'ملفات تعريف الارتباط', 'اتصل بنا'],
    },
    sticky: 'ابدأ التقييم المجاني',
  },
  hi: {
    nav: { brand: 'ExpatUAE', login: 'लॉग इन', start: 'मुफ़्त शुरू करें' },
    hero: {
      badge: 'एआई-सहायता प्राप्त इनटेक · लाइसेंस प्राप्त यूएई वकील',
      headline:
        'यूएई कानूनी, वित्तीय और आव्रजन मुद्दों का सामना कर रहे प्रवासियों के लिए स्पष्टता।',
      sub: 'एक एआई-सहायता प्राप्त इनटेक प्लेटफ़ॉर्म जो आपको अपनी स्थिति समझने, अपने दस्तावेज़ व्यवस्थित करने, और वास्तविक कार्य के लिए लाइसेंस प्राप्त यूएई वकीलों और विशेषज्ञों से जोड़ने में मदद करता है। हम कोई वकील फर्म नहीं हैं — हम आपको समझदारी से शुरू करने में मदद करते हैं।',
      cta1: 'मुफ्त मूल्यांकन शुरू करें',
      cta2: 'देखें यह कैसे काम करता है',
      trust: ['मुफ्त प्रारंभिक प्रश्नावली', 'कार्ड की आवश्यकता नहीं', 'लगभग 5 मिनट लगते हैं'],
      disclaimer:
        'मुफ्त प्रारंभिक प्रश्नावली। ExpatUAE द्वारा कोई कानूनी सलाह नहीं दी जाती। सभी कानूनी कार्य स्वतंत्र लाइसेंस प्राप्त यूएई वकीलों द्वारा किए जाते हैं।',
    },
    selector: {
      title: 'आपकी स्थिति सबसे अच्छी तरह क्या बताती है?',
      items: [
        { id: 'banking', icon: '🏦', label: 'बैंक कर्ज', desc: 'लोन, जमे खाते, ब्याज' },
        { id: 'car', icon: '🚗', label: 'कार छोड़ी', desc: 'जुर्माने, जब्ती, लोन' },
        { id: 'legal', icon: '⚖️', label: 'कानूनी मामला', desc: 'अदालती मामले, ट्रैवल बैन' },
        { id: 'employment', icon: '💼', label: 'नौकरी समस्या', desc: 'अवैतनिक वेतन, विवाद' },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: 'मुफ्त प्रारंभिक मूल्यांकन' },
        { icon: '✓', text: 'गोपनीय और एन्क्रिप्टेड' },
        { icon: '✓', text: '5-मिनट का प्रश्नावली' },
      ],
    },
    aiPreview: {
      title: 'हम आपको अपना केस समझने में मदद करते हैं',
      sub: 'आपकी स्थिति के आधार पर, हमारा एआई पहचान सकता है:',
      bullets: [
        'आपके पास जो प्रकार की समस्या लगती है',
        'किस प्रकार का पेशेवर आमतौर पर इसे संभालता है',
        'आपको कौन से दस्तावेज़ इकट्ठा करने की आवश्यकता हो सकती है',
        'वकील से पूछने लायक प्रश्न',
      ],
      lockTitle: 'अपनी विस्तृत एआई रिपोर्ट पाएं',
      lockSub: 'जोखिम क्षेत्र चिह्नित करने वाला गहरा लिखित विश्लेषण और स्वच्छ हैंडओवर दस्तावेज़',
      lockCta: 'मुफ्त मूल्यांकन शुरू करें',
      blurItems: [
        'आपकी स्थिति और पहचानी गई समस्याओं का सारांश…',
        'इस मामले को संभालने वाले पेशेवर का सुझाया प्रकार…',
        'वकील से बात करने से पहले इकट्ठा करने योग्य दस्तावेज़…',
        'पूछने के प्रश्न और चर्चा करने योग्य जोखिम क्षेत्र…',
      ],
    },
    docAI: {
      badge: 'दस्तावेज़ बुद्धिमत्ता',
      title: 'हम आपके दस्तावेज़ केवल संग्रहीत नहीं करते — हम उन्हें समझते हैं।',
      sub: 'कोई भी अनुबंध, बैंक विवरण, या कानूनी नोटिस अपलोड करें। एआई सेकंडों में जोखिम, दायित्व और सटीक अगले कदम निकालता है।',
      items: [
        'अनुबंध और समझौते',
        'बैंक विवरण',
        'कानूनी दस्तावेज़ और न्यायालय नोटिस',
        'रोजगार पत्र',
      ],
      cta: 'अपने दस्तावेज़ अपलोड करें और विश्लेषण करें',
    },
    how: {
      title: 'कैसे काम करता है',
      subtitle: 'कुछ भी तुरंत नहीं होता — प्रत्येक चरण समय के बारे में ईमानदार है।',
      steps: [
        {
          num: '01',
          title: 'अपनी स्थिति बताएं',
          desc: 'एक संरचित प्रश्नावली का उत्तर दें। मुफ्त, गोपनीय, 5-10 मिनट।',
        },
        {
          num: '02',
          title: 'एआई-सहायता प्राप्त सारांश पाएं',
          desc: 'हमारा एआई आपके इनपुट की समीक्षा करता है और संरचित सारांश तैयार करता है। केवल सूचनात्मक — कानूनी सलाह नहीं।',
        },
        {
          num: '03',
          title: 'सशुल्क रिपोर्ट चुनें',
          desc: 'वैकल्पिक: जोखिम चिह्नित करने वाला गहरा लिखित विश्लेषण और हैंडओवर दस्तावेज़।',
        },
        {
          num: '04',
          title: 'पेशेवर से जुड़ें',
          desc: 'यदि आप चुनें, तो हम आपको लाइसेंस प्राप्त यूएई वकील फर्म या विशेषज्ञ से परिचित कराते हैं। वे स्वतंत्र रूप से काम करते हैं।',
        },
      ],
      callout:
        'आप हर चरण पर नियंत्रण में रहते हैं। हम आपको शुरू करने में मदद करते हैं; एक योग्य पेशेवर कानूनी कार्य संभालता है।',
    },
    execution: {
      title: 'लाइसेंस प्राप्त पेशेवरों से जुड़ें',
      sub: 'हम आपको आपकी समस्या के लिए सही पेशेवर से मिलाते हैं।',
      roles: [
        {
          icon: '⚖️',
          title: 'लाइसेंस प्राप्त यूएई वकील',
          desc: 'न्यायालय दाखिल, कानूनी विवाद, वार्ता',
        },
        { icon: '🏛️', title: 'सरकारी पीआरओ', desc: 'मंत्रालय दाखिल, आधिकारिक दस्तावेज़' },
        { icon: '🤝', title: 'ऋण वार्ताकार', desc: 'बैंक समझौते और भुगतान पुनर्संरचना' },
      ],
    },
    pricing: {
      badge: 'मूल्य निर्धारण',
      title: 'पारदर्शी, वर्गीकृत मूल्य निर्धारण',
      subtitle:
        'मुफ्त शुरू करें। केवल तब भुगतान करें जब आप गहरा विश्लेषण चाहते हैं। वकील शुल्क अलग हैं और वकील द्वारा निर्धारित किए जाते हैं।',
      tiers: [
        {
          id: 'free',
          name: 'मुफ्त',
          price: null,
          priceLabel: 'कार्ड की आवश्यकता नहीं',
          desc: 'यदि आप निश्चित नहीं हैं कि क्या चाहिए तो यहां से शुरू करें।',
          features: [
            'संरचित इनटेक प्रश्नावली',
            'एआई का संक्षिप्त सारांश',
            'सुझाया गया पेशेवर प्रकार',
          ],
          cta: 'मुफ्त शुरू करें',
          highlighted: false,
        },
        {
          id: 'basic',
          name: 'बुनियादी',
          price: 'AED 299',
          priceLabel: 'एकमुश्त भुगतान',
          desc: 'एआई विश्लेषण + सारांश रिपोर्ट',
          features: [
            'मुफ्त में सब कुछ',
            'विस्तृत लिखित एआई रिपोर्ट',
            '3 फ़ाइलों तक दस्तावेज़ बुद्धिमत्ता',
            'स्वच्छ हैंडओवर PDF',
          ],
          cta: 'बुनियादी रिपोर्ट पाएं',
          highlighted: false,
        },
        {
          id: 'standard',
          name: 'मानक',
          price: 'AED 499–599',
          priceLabel: 'एकमुश्त + परिचय कॉल',
          desc: 'एआई रिपोर्ट + वकील मिलान + परिचय कॉल',
          features: [
            'बुनियादी में सब कुछ',
            'लाइसेंस प्राप्त यूएई वकील फर्म से मिलान',
            'मिलान किए गए पेशेवर के साथ परिचय कॉल (15-30 मिनट)',
            'वकील को दस्तावेज़ हैंडओवर',
            'वकील पुष्टि करता है कि वे आपका केस ले सकते हैं',
          ],
          cta: 'मानक पाएं',
          highlighted: true,
        },
        {
          id: 'premium',
          name: 'प्रीमियम',
          price: 'AED 999+',
          priceLabel: 'एकमुश्त + प्राथमिकता समर्थन',
          desc: 'जटिल मामलों के लिए उच्च-स्पर्श समर्थन',
          features: [
            'मानक में सब कुछ',
            'प्राथमिकता मिलान',
            'फ़ाइल तैयारी समर्थन',
            'यदि स्थिति बदले तो फॉलो-अप सारांश',
            'बहु-मुद्दा मामलों के लिए सर्वोत्तम',
          ],
          cta: 'प्रीमियम पाएं',
          highlighted: false,
        },
      ],
      popularLabel: 'सबसे लोकप्रिय',
      monetizationTitle: 'हम कैसे पैसे कमाते हैं',
      monetizationText:
        'हम भुगतान की गई रिपोर्टों के लिए उपयोगकर्ताओं द्वारा भुगतान किए गए मूल्यांकन शुल्क से कमाते हैं। जब आप हमारे द्वारा परिचित वकील को काम पर रखने का विकल्प चुनते हैं, तो हम उस वकील फर्म से रेफरल शुल्क भी प्राप्त कर सकते हैं। यह आपके द्वारा वकील को भुगतान की गई राशि को बढ़ाता नहीं है और आपके कुछ भी प्रतिबद्ध होने से पहले खुलासा किया जाता है।',
      monetizationNote:
        'कोई छिपी हुई फीस नहीं। आप हमेशा भुगतान से पहले कीमत देखेंगे। वकील शुल्क वकील द्वारा निर्धारित किए जाते हैं और आपके और उनके बीच सीधे तौर पर सहमत होते हैं।',
      disclaimer:
        'सशुल्क रिपोर्टें सूचनात्मक उत्पाद हैं, कानूनी सलाह नहीं। वकील शुल्क अलग हैं। ExpatUAE भागीदार फर्मों से रेफरल शुल्क प्राप्त कर सकता है; यह आपके प्रतिबद्ध होने से पहले खुलासा किया जाता है।',
    },
    lawyers: {
      badge: 'वकीलों और वकील फर्मों के लिए',
      title: 'योग्य, पूर्व-जांचे गए लीड प्राप्त करें',
      sub: 'ExpatUAE आपको वे केस भेजता है जो पहले ही संरचित इनटेक और एआई-सहायता प्राप्त सारांश से गुज़र चुके हैं। आप तथ्य-खोज कॉल पर कम समय और वास्तविक कानूनी कार्य पर अधिक समय बिताते हैं।',
      sendTitle: 'हम आपको क्या भेजते हैं',
      sendItems: [
        'मुद्दा प्रकार, पक्ष, समयरेखा और दस्तावेज़ों को कवर करने वाला स्वच्छ इनटेक सारांश',
        'व्यवस्थित, अनुक्रमित दस्तावेज़ बंडल',
        'उपयोगकर्ता की पसंदीदा भाषा और संपर्क प्राथमिकताएं',
        'पुष्टि कि उपयोगकर्ता ने अपनी फ़ाइल आपके साथ साझा करने के लिए सहमति दी है',
      ],
      dontTitle: 'हम क्या नहीं करते',
      dontItems: [
        'हम उपयोगकर्ता को आपकी ओर से कानूनी सलाह नहीं देते',
        'हम न्यायालय या वार्ता में उपयोगकर्ताओं का प्रतिनिधित्व नहीं करते',
        'हम आपकी फीस निर्धारित नहीं करते, आपके केसलोड को प्रबंधित नहीं करते, या आपके काम पर निगरानी नहीं करते',
        'हम आपकी पेशेवर फीस का प्रतिशत नहीं लेते — केवल एक वैकल्पिक पूर्व-सहमत रेफरल शुल्क',
      ],
      complianceLabel: 'अनुपालन नोट',
      complianceText:
        'ExpatUAE कानून का अभ्यास नहीं करता, वकीलों को नियुक्त नहीं करता, या कानूनी शुल्क विभाजित नहीं करता। प्रत्येक भागीदार फर्म अपने स्वयं के पेशेवर लाइसेंस के तहत स्वतंत्र रूप से काम करती है।',
      onboardingText:
        'यदि आप एक लाइसेंस प्राप्त यूएई वकील फर्म या एक विनियमित पेशेवर हैं, तो नेटवर्क में शामिल होने के लिए आवेदन करें। हम किसी भी भागीदार को सूचीबद्ध करने से पहले यूएई न्याय मंत्रालय के साथ लाइसेंस स्थिति सत्यापित करते हैं। ऑनबोर्डिंग में आमतौर पर 5-10 कार्य दिवस लगते हैं।',
      applyCta: 'शामिल होने के लिए आवेदन करें',
    },
    faq: {
      badge: 'अक्सर पूछे जाने वाले प्रश्न',
      title: 'अक्सर पूछे जाने वाले प्रश्न',
      items: [
        {
          q: 'क्या ExpatUAE एक वकील फर्म है?',
          a: 'नहीं। हम एक तकनीकी प्लेटफ़ॉर्म हैं जो एआई-सहायता प्राप्त इनटेक प्रदान करता है और उपयोगकर्ताओं को स्वतंत्र लाइसेंस प्राप्त यूएई वकीलों और विशेषज्ञों से जोड़ता है।',
        },
        {
          q: 'क्या मुझे ExpatUAE से कानूनी सलाह मिलेगी?',
          a: 'नहीं। हमारे एआई सारांश केवल सूचनात्मक हैं। कानूनी सलाह के लिए, आपको एक लाइसेंस प्राप्त यूएई वकील से बात करनी होगी — जिसकी व्यवस्था करने में हम मदद कर सकते हैं।',
        },
        {
          q: 'क्या आप किसी विशिष्ट परिणाम की गारंटी देते हैं?',
          a: 'नहीं। कोई भी कानूनी मामले के परिणाम की गारंटी नहीं दे सकता। जो कोई भी आपको परिणाम का वादा करता है वह ईमानदार नहीं है।',
        },
        {
          q: 'लागत कितनी है?',
          a: 'बुनियादी प्रश्नावली मुफ्त है। सशुल्क एआई रिपोर्ट 299 दिरहम से शुरू होती है। वकील शुल्क अलग हैं और वकील द्वारा निर्धारित किए जाते हैं।',
        },
        {
          q: 'क्या मेरी जानकारी गोपनीय है?',
          a: 'हाँ। आपका डेटा एन्क्रिप्टेड है, पहुँच प्रतिबंधित है, और हम कभी भी आपकी जानकारी नहीं बेचते। आप किसी भी समय हटाने का अनुरोध कर सकते हैं।',
        },
        { q: 'आप कौन सी भाषाएं समर्थन करते हैं?', a: 'अरबी, अंग्रेज़ी, हिंदी, उर्दू और तागालोग।' },
        {
          q: 'क्या मैं अपना खुद का वकील उपयोग कर सकता है?',
          a: 'हाँ। सशुल्क एआई रिपोर्ट में एक स्वच्छ PDF शामिल है जिसे आप अपनी पसंद के किसी भी वकील के साथ साझा कर सकते हैं।',
        },
      ],
    },
    whatsapp: {
      title: 'अभी मदद चाहिए?',
      sub: 'मिनटों में एक वास्तविक व्यक्ति से बात करें',
      cta: 'अभी व्हाट्सएप पर चैट करें',
      note: '7 दिन उपलब्ध · अंग्रेज़ी, अरबी, हिंदी, उर्दू, फिलिपिनो',
    },
    trust: {
      title: 'आपका केस सुरक्षित है',
      items: [
        { icon: '🔒', text: 'सुरक्षित दस्तावेज़ प्रबंधन' },
        { icon: '🕵️', text: 'गोपनीय प्रक्रिया' },
        { icon: '✅', text: 'सत्यापित पेशेवर' },
        { icon: '🌍', text: 'यूएई कानून के अनुरूप' },
      ],
    },
    footer: {
      disclaimer:
        'ExpatUAE एक तकनीकी प्लेटफ़ॉर्म है, वकील फर्म नहीं। हम कानूनी सलाह नहीं देते और किसी भी परिणाम की गारंटी नहीं देते। सभी कानूनी कार्य स्वतंत्र लाइसेंस प्राप्त यूएई पेशेवरों द्वारा किए जाते हैं। ExpatUAE का उपयोग करने से आपके और ExpatUAE के बीच वकील-ग्राहक संबंध नहीं बनता है।',
      links: ['गोपनीयता', 'शर्तें', 'कुकीज़', 'संपर्क'],
    },
    sticky: 'मुफ्त मूल्यांकन शुरू करें',
  },
  ur: {
    nav: { brand: 'ExpatUAE', login: 'لاگ ان', start: 'مفت شروع کریں' },
    hero: {
      badge: 'اے آئی مدد سے انٹیک · لائسنس یافتہ یو اے ای وکلا',
      headline:
        'یو اے ای کے قانونی، مالیاتی اور امیگریشن مسائل کا سامنا کرنے والے تارکین وطن کے لیے وضوح۔',
      sub: 'ایک اے آئی مدد سے انٹیک پلیٹ فارم جو آپ کو اپنی صورتحال سمجھنے، اپنے دستاویزات کو منظم کرنے، اور实际 کام کے لیے لائسنس یافتہ یو اے ای وکلا اور ماہرین سے جوڑنے میں مدد کرتا ہے۔ ہم ایک وکیل فرم نہیں ہیں — ہم آپ کو سمجھداری سے شروع کرنے میں مدد کرتے ہیں۔',
      cta1: 'مفت جائزہ شروع کریں',
      cta2: 'دیکھیں یہ کیسے کام کرتا ہے',
      trust: ['مفت ابتدائی سوالنامہ', 'کارڈ کی ضرورت نہیں', 'تقریباً 5 منٹ لگتے ہیں'],
      disclaimer:
        'مفت ابتدائی سوالنامہ۔ ExpatUAE کی طرف سے کوئی قانونی مشورہ نہیں دیا جاتا۔ تمام قانونی کام آزاد لائسنس یافتہ یو اے ای وکلا کرتے ہیں۔',
    },
    selector: {
      title: 'آپ کی صورتحال کو کیا بہترین طور پر بیان کرتا ہے؟',
      items: [
        { id: 'banking', icon: '🏦', label: 'بینک قرض', desc: 'قرضے، جمے ہوئے اکاؤنٹس، سود' },
        { id: 'car', icon: '🚗', label: 'کار چھوڑی', desc: 'جرمانے، ضبطی، قرضے' },
        { id: 'legal', icon: '⚖️', label: 'قانونی مسئلہ', desc: 'عدالتی مقدمات، سفر پر پابندی' },
        {
          id: 'employment',
          icon: '💼',
          label: 'ملازمت کا مسئلہ',
          desc: 'بلا معاوضہ تنخواہ، تنازعات',
        },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: 'مفت ابتدائی جائزہ' },
        { icon: '✓', text: 'خفیہ اور انکرپٹڈ' },
        { icon: '✓', text: '5 منٹ کا سوالنامہ' },
      ],
    },
    aiPreview: {
      title: 'ہم آپ کو اپنا کیس سمجھنے میں مدد کرتے ہیں',
      sub: 'آپ کی صورتحال کی بنیاد پر، ہمارا اے آئی شناخت کر سکتا ہے:',
      bullets: [
        'آپ کے پاس جو مسئلہ لگتا ہے اس کی قسم',
        'کون سا پیشہ ور عام طور پر اسے سنبھالتا ہے',
        'آپ کو کون سی دستاویزات اکٹھی کرنے کی ضرورت ہو سکتی ہے',
        'وکیل سے پوچھنے کے سوالات',
      ],
      lockTitle: 'اپنی تفصیلی اے آئی رپورٹ حاصل کریں',
      lockSub: 'خطرے کے علاقوں کی نشاندہی کے ساتھ گہرا تحریری تجزیہ اور صاف دستاویز',
      lockCta: 'مفت جائزہ شروع کریں',
      blurItems: [
        'آپ کی صورتحال اور شناخت شدہ مسائل کا خلاصہ…',
        'اس معاملے کو سنبھالنے والے پیشہ ور کی تجویز کردہ قسم…',
        'وکیل سے بات کرنے سے پہلے اکٹھا کرنے کے قابل دستاویزات…',
        'پوچھنے کے سوالات اور بحث کے لیے ممکنہ خطرے کے علاقے…',
      ],
    },
    docAI: {
      badge: 'دستاویز ذہانت',
      title: 'ہم آپ کی دستاویزات صرف محفوظ نہیں کرتے — ہم انہیں سمجھتے ہیں۔',
      sub: 'کوئی بھی معاہدہ، بینک بیان، یا قانونی نوٹس اپ لوڈ کریں۔ اے آئی سیکنڈوں میں خطرات، ذمہ داریوں اور درست اگلے اقدامات نکالتا ہے۔',
      items: [
        'معاہدے اور اتفاقیات',
        'بینک بیانات',
        'قانونی دستاویزات اور عدالتی نوٹسز',
        'ملازمت کے کاغذات',
      ],
      cta: 'اپنی دستاویزات اپ لوڈ کریں اور تجزیہ کریں',
    },
    how: {
      title: 'یہ کیسے کام کرتا ہے',
      subtitle: 'کچھ بھی فوراً نہیں ہوتا — ہر مرحلہ وقت کے بارے میں ایماندار ہے۔',
      steps: [
        {
          num: '01',
          title: 'ہمیں اپنی صورتحال بتائیں',
          desc: 'ایک منظم سوالنامے کے جواب دیں۔ مفت، خفیہ، 5-10 منٹ۔',
        },
        {
          num: '02',
          title: 'اے آئی مدد سے خلاصہ حاصل کریں',
          desc: 'ہمارا اے آئی آپ کے ان پٹ کا جائزہ لیتا ہے اور منظم خلاصہ تیار کرتا ہے۔ صرف معلوماتی — قانونی مشورہ نہیں۔',
        },
        {
          num: '03',
          title: 'ادائیگی رپورٹ منتخب کریں',
          desc: 'اختیاری: خطرے کی نشاندہی کے ساتھ گہرا تحریری تجزیہ اور دستاویز۔',
        },
        {
          num: '04',
          title: 'پیشہ ور سے جڑیں',
          desc: 'اگر آپ منتخب کریں، تو ہم آپ کو لائسنس یافتہ یو اے ای وکیل فرم یا ماہر سے متعارف کراتے ہیں۔ وہ آزادانہ طور پر کام کرتے ہیں۔',
        },
      ],
      callout:
        'آپ ہر مرحلے پر کنٹرول میں رہتے ہیں۔ ہم آپ کو شروع کرنے میں مدد کرتے ہیں؛ ایک قابل پیشہ ور قانونی کام سنبھالتا ہے۔',
    },
    execution: {
      title: 'لائسنس یافتہ پیشہ ور سے جڑیں',
      sub: 'ہم آپ کو آپ کے مسئلے کے لیے درست پیشہ ور سے ملاتے ہیں۔',
      roles: [
        {
          icon: '⚖️',
          title: 'لائسنس یافتہ یو اے ای وکلا',
          desc: 'عدالتی دعوے، قانونی تنازعات، مذاکرات',
        },
        { icon: '🏛️', title: 'حکومتی پرو', desc: 'وزارتی دعوے، سرکاری دستاویزات' },
        { icon: '🤝', title: 'قرض مذاکرہ کار', desc: 'بینک تصفیے اور ادائیگی کی بازتعمیر' },
      ],
    },
    pricing: {
      badge: 'قیمت',
      title: 'شفاف، درجہ بند قیمت',
      subtitle:
        'مفت شروع کریں۔ صرف اس وقت ادائیگی کریں جب آپ گہرا تجزیہ چاہیں۔ وکیل فیس الگ ہیں اور وکیل کی طرف سے مقرر ہوتی ہیں۔',
      tiers: [
        {
          id: 'free',
          name: 'مفت',
          price: null,
          priceLabel: 'کارڈ کی ضرورت نہیں',
          desc: 'اگر آپ کو یقین نہیں کہ آپ کو کیا چاہیے تو یہاں سے شروع کریں۔',
          features: ['منظم انٹیک سوالنامہ', 'اے آئی کا مختصر خلاصہ', 'تجویز کردہ پیشہ ور قسم'],
          cta: 'مفت شروع کریں',
          highlighted: false,
        },
        {
          id: 'basic',
          name: 'بنیادی',
          price: 'AED 299',
          priceLabel: 'یکمشت ادائیگی',
          desc: 'اے آئی تجزیہ + خلاصہ رپورٹ',
          features: [
            'مفت میں سب کچھ',
            'تفصیلی تحریری اے آئی رپورٹ',
            '3 فائلوں تک دستاویز ذہانت',
            'صاف PDF دستاویز',
          ],
          cta: 'بنیادی رپورٹ حاصل کریں',
          highlighted: false,
        },
        {
          id: 'standard',
          name: 'معیاری',
          price: 'AED 499–599',
          priceLabel: 'یکمشت + تعارف کال',
          desc: 'اے آئی رپورٹ + وکیل میچنگ + تعارف کال',
          features: [
            'بنیادی میں سب کچھ',
            'لائسنس یافتہ یو اے ای وکیل فرم سے میچنگ',
            'میچ کردہ پیشہ ور کے ساتھ تعارفی کال (15-30 منٹ)',
            'وکیل کو دستاویزات کی منتقلی',
            'وکیل تصدیق کرتا ہے کہ کیا وہ آپ کا کیس لے سکتے ہیں',
          ],
          cta: 'معیاری حاصل کریں',
          highlighted: true,
        },
        {
          id: 'premium',
          name: 'پریمیم',
          price: 'AED 999+',
          priceLabel: 'یکمشت + ترجیحی سپورٹ',
          desc: 'پیچیدہ مسائل کے لیے اعلیٰ سپورٹ',
          features: [
            'معیاری میں سب کچھ',
            'ترجیحی میچنگ',
            'فائل تیاری سپورٹ',
            'اگر صورتحال بدل جائے تو فالو اپ خلاصہ',
            'کثیر مسئلہ مسائل کے لیے بہترین',
          ],
          cta: 'پریمیم حاصل کریں',
          highlighted: false,
        },
      ],
      popularLabel: 'سب سے مقبول',
      monetizationTitle: 'ہم کیسے پیسہ کماتے ہیں',
      monetizationText:
        'ہم ادائیگی رپورٹس کے لیے صارفین کی طرف سے ادا کردہ جائزہ فیس سے کماتے ہیں۔ جب آپ ہمارے متعارف کردہ وکیل کو کام پر رکھنے کا انتخاب کرتے ہیں، تو ہم اس وکیل فرم سے ریفرل فیس بھی حاصل کر سکتے ہیں۔ یہ آپ کے وکیل کو ادا کی گئی رقم کو بڑھاتا نہیں ہے اور آپ کے کچھ بھی پابند ہونے سے پہلے ظاہر کیا جاتا ہے۔',
      monetizationNote:
        'کوئی پوشیدہ فیس نہیں۔ آپ ہمیشہ ادائیگی سے پہلے قیمت دیکھیں گے۔ وکیل فیس وکیل کی طرف سے مقرر کی جاتی ہے اور آپ کے اور ان کے درمیان براہ راست طے پاتی ہے۔',
      disclaimer:
        'ادائیگی رپورٹس معلوماتی مصنوعات ہیں، قانونی مشورہ نہیں۔ وکیل فیس الگ ہیں۔ ExpatUAE پارٹنر فرمز سے ریفرل فیس حاصل کر سکتا ہے؛ یہ آپ کے پابند ہونے سے پہلے ظاہر کیا جاتا ہے۔',
    },
    lawyers: {
      badge: 'وکلا اور وکیل فرمز کے لیے',
      title: 'قابل، پہلے سے جانچے گئے لیڈز وصول کریں',
      sub: 'ExpatUAE آپ کو وہ کیسز بھیجتا ہے جو پہلے ہی منظم انٹیک اور اے آئی مدد سے خلاصے سے گزر چکے ہیں۔ آپ حقائق تلاش کرنے کی کالز پر کم وقت اور قانونی کام پر زیادہ وقت صرف کرتے ہیں۔',
      sendTitle: 'ہم آپ کو کیا بھیجتے ہیں',
      sendItems: [
        'مسئلے کی قسم، فریقین، ٹائم لائن اور دستاویزات کو احاطہ کرنے والا صاف انٹیک خلاصہ',
        'منظم، اشاری شدہ دستاویز بنڈل',
        'صارف کی پسندیدہ زبان اور رابطے کی ترجیحات',
        'تصدیق کہ صارف نے اپنی فائل آپ کے ساتھ شیئر کرنے کی رضامندی دی ہے',
      ],
      dontTitle: 'ہم کیا نہیں کرتے',
      dontItems: [
        'ہم صارف کو آپ کی طرف سے قانونی مشورہ نہیں دیتے',
        'ہم عدالت میں یا مذاکرات میں صارفین کی نمائندگی نہیں کرتے',
        'ہم آپ کی فیس مقرر نہیں کرتے، آپ کے کیس لوڈ کا انتظام نہیں کرتے، یا آپ کے کام کی نگرانی نہیں کرتے',
        'ہم آپ کی پیشہ ورانہ فیس کا فیصد نہیں لیتے — صرف ایک اختیاری پہلے سے طے شدہ ریفرل فیس',
      ],
      complianceLabel: 'تعمیل نوٹ',
      complianceText:
        'ExpatUAE قانون کی مشق نہیں کرتا، وکلا کو ملازم نہیں رکھتا، یا قانونی فیس تقسیم نہیں کرتا۔ ہر پارٹنر فرم اپنے پیشہ ورانہ لائسنس کے تحت آزادانہ طور پر کام کرتی ہے۔',
      onboardingText:
        'اگر آپ ایک لائسنس یافتہ یو اے ای وکیل فرم یا ایک ریگولیٹڈ پیشہ ور ہیں، تو نیٹ ورک میں شامل ہونے کے لیے درخواست دیں۔ ہم کسی بھی پارٹنر کو درج کرنے سے پہلے یو اے ای وزارت انصاف کے ساتھ لائسنس کی حیثیت کی تصدیق کرتے ہیں۔ آن بورڈنگ میں عام طور پر 5-10 کاروباری دن لگتے ہیں۔',
      applyCta: 'شامل ہونے کے لیے درخواست دیں',
    },
    faq: {
      badge: 'اکثر پوچھے جانے والے سوالات',
      title: 'اکثر پوچھے جانے والے سوالات',
      items: [
        {
          q: 'کیا ExpatUAE ایک وکیل فرم ہے؟',
          a: 'نہیں۔ ہم ایک ٹیکنالوجی پلیٹ فارم ہیں جو اے آئی مدد سے انٹیک فراہم کرتا ہے اور صارفین کو آزاد لائسنس یافتہ یو اے ای وکلا اور ماہرین سے جوڑتا ہے۔',
        },
        {
          q: 'کیا مجھے ExpatUAE سے قانونی مشورہ ملے گا؟',
          a: 'نہیں۔ ہمارے اے آئی خلاصے صرف معلوماتی ہیں۔ قانونی مشورے کے لیے، آپ کو ایک لائسنس یافتہ یو اے ای وکیل سے بات کرنے کی ضرورت ہے — جس کا انتظام ہم کرنے میں مدد کر سکتے ہیں۔',
        },
        {
          q: 'کیا آپ کوئی مخصوص نتیجہ گارنٹی دیتے ہیں؟',
          a: 'نہیں۔ کوئی بھی قانونی معاملے کے نتیجے کی ضمانت نہیں دے سکتا۔ جو کوئی آپ کو نتیجے کا وعدہ کرتا ہے وہ ایماندار نہیں ہے۔',
        },
        {
          q: 'کتنا خرچ ہے؟',
          a: 'بنیادی سوالنامہ مفت ہے۔ ادائیگی اے آئی رپورٹس 299 درہم سے شروع ہوتی ہیں۔ وکیل فیس الگ ہیں اور وکیل کی طرف سے مقرر ہوتی ہیں۔',
        },
        {
          q: 'کیا میری معلومات خفیہ ہیں؟',
          a: 'ہاں۔ آپ کا ڈیٹا انکرپٹڈ ہے، رسائی محدود ہے، اور ہم کبھی آپ کی معلومات فروخت نہیں کرتے۔ آپ کسی بھی وقت حذف کرنے کی درخواست کر سکتے ہیں۔',
        },
        { q: 'آپ کون سی زبانیں سپورٹ کرتے ہیں؟', a: 'عربی، انگریزی، ہندی، اردو، اور تاگالوگ۔' },
        {
          q: 'کیا میں اپنا وکیل استعمال کر سکتا ہوں؟',
          a: 'ہاں۔ ادائیگی اے آئی رپورٹ میں ایک صاف PDF شامل ہے جسے آپ اپنی پسند کے کسی بھی وکیل کے ساتھ شیئر کر سکتے ہیں۔',
        },
      ],
    },
    whatsapp: {
      title: 'ابھی مدد چاہیے؟',
      sub: 'منٹوں میں ایک حقیقی شخص سے بات کریں',
      cta: 'ابھی واٹس ایپ پر چیٹ کریں',
      note: '7 دن دستیاب · انگریزی، عربی، ہندی، اردو، فلپائنو',
    },
    trust: {
      title: 'آپ کا کیس محفوظ ہے',
      items: [
        { icon: '🔒', text: 'محفوظ دستاویز انتظام' },
        { icon: '🕵️', text: 'خفیہ عمل' },
        { icon: '✅', text: 'تصدیق شدہ پیشہ ور' },
        { icon: '🌍', text: 'یو اے ای قانون کے مطابق' },
      ],
    },
    footer: {
      disclaimer:
        'ExpatUAE ایک ٹیکنالوجی پلیٹ فارم ہے، وکیل فرم نہیں۔ ہم قانونی مشورہ نہیں دیتے اور کسی بھی نتیجے کی ضمانت نہیں دیتے۔ تمام قانونی کام آزاد لائسنس یافتہ یو اے ای پیشہ ور کرتے ہیں۔ ExpatUAE استعمال کرنے سے آپ اور ExpatUAE کے درمیان وکیل-مؤکل کا تعلق نہیں بنتا۔',
      links: ['رازداری', 'شرائط', 'کوکیز', 'رابطہ'],
    },
    sticky: 'مفت جائزہ شروع کریں',
  },
  tl: {
    nav: { brand: 'ExpatUAE', login: 'Mag-log In', start: 'Magsimula ng Libre' },
    hero: {
      badge: 'AI-assisted na intake · Lisensyadong UAE lawyers',
      headline:
        'Kalinawan para sa mga expat na nakaharap sa UAE legal, pinansyal, at immigration issues.',
      sub: 'Isang AI-assisted na intake platform na tumutulong sa iyo na maunawaan ang iyong sitwasyon, ayusin ang iyong mga dokumento, at ikonekta sa mga lisensyadong UAE lawyer at eksperto para sa aktwal na trabaho. Hindi kami isang law firm — tinutulungan ka naming magsimula nang tama.',
      cta1: 'Magsimula ng Libreng Assessment',
      cta2: 'Tingnan Paano Ito Gumagana',
      trust: [
        'Libreng paunang questionnaire',
        'Walang card na kailangan',
        'Tumatagal ng halos 5 minuto',
      ],
      disclaimer:
        'Libreng paunang questionnaire. Walang legal na payo ang ibinibigay ng ExpatUAE. Lahat ng legal na trabaho ay ginagawa ng mga independenteng lisensyadong UAE lawyer.',
    },
    selector: {
      title: 'Ano ang pinakamahusay na naglalarawan sa iyong sitwasyon?',
      items: [
        {
          id: 'banking',
          icon: '🏦',
          label: 'Utang sa Bangko',
          desc: 'Mga pautang, frozen na account, interes',
        },
        { id: 'car', icon: '🚗', label: 'Naiwang Kotse', desc: 'Multa, pagkumpiska, pautang' },
        { id: 'legal', icon: '⚖️', label: 'Legal na Isyu', desc: 'Kaso sa hukuman, travel ban' },
        {
          id: 'employment',
          icon: '💼',
          label: 'Problema sa Trabaho',
          desc: 'Hindi nabayarang sahod, alitan',
        },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: 'Libreng paunang assessment' },
        { icon: '✓', text: 'Kompidensiyal at naka-encrypt' },
        { icon: '✓', text: '5-minutong questionnaire' },
      ],
    },
    aiPreview: {
      title: 'Tinutulungan ka naming maunawaan ang iyong kaso',
      sub: 'Batay sa iyong sitwasyon, maaaring tukuyin ng aming AI:',
      bullets: [
        'Ang uri ng isyu na lumalabas na mayroon ka',
        'Anong uri ng propesyonal ang karaniwang humahawak nito',
        'Mga dokumento na maaaring kailanganin mong kalapin',
        'Mga tanong na nararapat itanong sa abogado',
      ],
      lockTitle: 'Kunin ang iyong detalyadong AI report',
      lockSub:
        'Isang mas malalim na written analysis na may risk-area flagging at malinis na handover document',
      lockCta: 'Magsimula ng Libreng Assessment',
      blurItems: [
        'Buod ng iyong sitwasyon at mga natukoy na isyu…',
        'Iminumungkahing uri ng propesyonal na humahawag sa bagay na ito…',
        'Mga dokumentong dapat kalapin bago makipag-usap sa abogado…',
        'Mga tanong na itatanong at posibleng risk areas na talakayin…',
      ],
    },
    docAI: {
      badge: 'Document Intelligence',
      title: 'Hindi lang namin iniimbak ang iyong mga dokumento — naiintindihan namin ang mga ito.',
      sub: 'I-upload anumang kontrata, bank statement, o legal na abiso. Tinatanggal ng AI ang mga panganib, obligasyon, at eksaktong susunod na hakbang sa loob ng ilang segundo.',
      items: [
        'Mga kontrata at kasunduan',
        'Mga bank statement',
        'Mga legal na dokumento at abiso ng hukuman',
        'Mga papeles sa empleo',
      ],
      cta: 'I-upload at Suriin ang Aking Mga Dokumento',
    },
    how: {
      title: 'Paano Ito Gumagana',
      subtitle: 'Walang nagaganap agad — bawat hakbang ay tapat tungkol sa oras.',
      steps: [
        {
          num: '01',
          title: 'Sabihin sa amin ang iyong sitwasyon',
          desc: 'Sagutin ang structured na questionnaire. Libre, kompidensiyal, 5-10 minuto.',
        },
        {
          num: '02',
          title: 'Kumuha ng AI-assisted na buod',
          desc: 'Sinusuri ng aming AI ang iyong mga input at gumagawa ng structured na buod. Impormasyon lamang — hindi legal na payo.',
        },
        {
          num: '03',
          title: 'Pumili ng bayad na ulat',
          desc: 'Opsyonal: isang mas malalim na written analysis na may risk flagging at handover document.',
        },
        {
          num: '04',
          title: 'Kumonekta sa isang propesyonal',
          desc: 'Kung pipiliin mo, ipapakilala ka namin sa isang lisensyadong UAE law firm o eksperto. Sila ay independently nagtatrabaho.',
        },
      ],
      callout:
        'Mananatili kang may kontrol sa bawat hakbang. Tinutulungan ka naming magsimula; isang kwalipikadong propesyonal ang humahawak ng legal na trabaho.',
    },
    execution: {
      title: 'Kumonekta sa mga lisensyadong propesyonal',
      sub: 'Ini-match ka namin sa tamang propesyonal para sa iyong isyu.',
      roles: [
        {
          icon: '⚖️',
          title: 'Lisensyadong UAE Lawyers',
          desc: 'Mga paghaharap sa hukuman, legal na alitan, negosasyon',
        },
        {
          icon: '🏛️',
          title: 'Government PROs',
          desc: 'Mga filing sa ministry, opisyal na dokumentasyon',
        },
        {
          icon: '🤝',
          title: 'Debt Negotiators',
          desc: 'Mga settlement sa bangko at pagbabago ng istraktura ng pagbabayad',
        },
      ],
    },
    pricing: {
      badge: 'Presyo',
      title: 'Transparent, tiered na presyo',
      subtitle:
        'Magsimula ng libre. Magbayad lamang kapag gusto mo ng mas malalim na pagsusuri. Ang bayad sa abogado ay hiwalay at itinakda ng abogado.',
      tiers: [
        {
          id: 'free',
          name: 'Libre',
          price: null,
          priceLabel: 'Walang card na kailangan',
          desc: 'Magsimula dito kung hindi ka sigurado kung anong kailangan mo.',
          features: [
            'Structured na intake questionnaire',
            'Maikling AI-generated na buod',
            'Iminumungkahing uri ng propesyonal',
          ],
          cta: 'Magsimula ng Libre',
          highlighted: false,
        },
        {
          id: 'basic',
          name: 'Basic',
          price: 'AED 299',
          priceLabel: 'Isang beses na bayad',
          desc: 'AI analysis + summary report',
          features: [
            'Lahat sa Libre',
            'Detalyadong written AI report',
            'Document intelligence sa hanggang 3 files',
            'Malinis na handover PDF',
          ],
          cta: 'Kumuha ng Basic Report',
          highlighted: false,
        },
        {
          id: 'standard',
          name: 'Standard',
          price: 'AED 499–599',
          priceLabel: 'Isang beses + intro call',
          desc: 'AI report + lawyer matching + intro call',
          features: [
            'Lahat sa Basic',
            'Matching sa lisensyadong UAE law firm',
            'Introductory call sa matched propesyonal (15-30 min)',
            'Document handover sa abogado',
            'Tinitiyak ng abogado kung kaya nilang kunin ang iyong kaso',
          ],
          cta: 'Kumuha ng Standard',
          highlighted: true,
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 'AED 999+',
          priceLabel: 'Isang beses + priority support',
          desc: 'Mas malalim na support para sa complex na mga bagay',
          features: [
            'Lahat sa Standard',
            'Priority matching',
            'File prep support',
            'Follow-up na buod kung magbago ang sitwasyon',
            'Pinakamahusay para sa multi-issue na mga bagay',
          ],
          cta: 'Kumuha ng Premium',
          highlighted: false,
        },
      ],
      popularLabel: 'Pinakasikat',
      monetizationTitle: 'Paano kami kumikita',
      monetizationText:
        'Kumikita kami sa assessment fees na binabayaran ng mga user para sa bayad na ulat. Kapag pinili mong i-engage ang abogadong ipinakilala namin, maaari ring makatanggap ng referral fee mula sa law firm na iyon. Hindi ito nagdaragdag sa binabayaran mo sa abogado at ibinubunyag bago ka mag-commit sa anuman.',
      monetizationNote:
        'Walang nakatagong bayad. Makikita mo palagi ang presyo bago ka magbayad. Ang bayad sa abogado ay itinakda ng abogado at direktang pinagkasunduan mo at niya.',
      disclaimer:
        'Ang bayad na ulat ay informational products, hindi legal na payo. Ang bayad sa abogado ay hiwalay. Maaaring makatanggap ang ExpatUAE ng referral fee mula sa partner firms; ito ay ibubunyag bago ka mag-commit.',
    },
    lawyers: {
      badge: 'Para sa mga Abogado at Law Firm',
      title: 'Tumanggap ng kwalipikado, pre-screened na leads',
      sub: 'Nagpapadala ang ExpatUAE ng mga kaso na dumaan na sa structured intake at AI-assisted summarization. Mas kaunting oras sa fact-finding calls at mas maraming oras sa aktwal na legal na trabaho.',
      sendTitle: 'Anong ipinapadala namin sa iyo',
      sendItems: [
        'Isang malinis na intake buod na sumasaklaw sa uri ng isyu, mga partido, timeline, at mga dokumento',
        'Naayos, naka-index na document bundle',
        'Ang gustong wika ng user at contact preferences',
        'Kumpirmasyon na ang user ay pumayag na ibahagi sa iyo ang kanilang file',
      ],
      dontTitle: 'Anong hindi namin ginagawa',
      dontItems: [
        'Hindi kami nagbibigay sa user ng legal na payo sa iyong ngalan',
        'Hindi kami kinakatawan ang mga user sa hukuman o sa negosasyon',
        'Hindi namin itinatakda ang iyong bayad, pinamamahalaan ang iyong caseload, o sinasabayan ang iyong trabaho',
        'Hindi kami kumukuha ng porsyento ng iyong propesyonal na bayad — lamang ang opsyonal na pre-agreed na referral fee',
      ],
      complianceLabel: 'Tala sa pagsunod',
      complianceText:
        'Ang ExpatUAE ay hindi nagapraktis ng batas, nag-eemploy ng mga abogado, o naghihiwalay ng legal na bayad. Bawat partner firm ay independenteng nag-oopera sa sarili nitong propesyonal na lisensya.',
      onboardingText:
        'Kung ikaw ay isang lisensyadong UAE law firm o isang regulated na propesyonal, mag-apply na sumali sa network. Tinitiyak namin ang lisensya status sa UAE Ministry of Justice bago i-list ang anumang partner. Karaniwang tumatagal ang onboarding ng 5-10 business days.',
      applyCta: 'Mag-apply na Sumali',
    },
    faq: {
      badge: 'FAQ',
      title: 'Mga madalas itanong',
      items: [
        {
          q: 'Ba ang ExpatUAE ay isang law firm?',
          a: 'Hindi. Kami ay isang technology platform na nagbibigay ng AI-assisted intake at nagko-connect ng mga user sa independenteng lisensyadong UAE lawyer at eksperto.',
        },
        {
          q: 'Makakakuha ba ako ng legal na payo mula sa ExpatUAE?',
          a: 'Hindi. Ang aming AI buod ay informational lamang. Para sa legal na payo, kailangan mong makipag-usap sa isang lisensyadong UAE abogado — na maaari naming tulungang ayusin.',
        },
        {
          q: 'Garantiya ba ninyo ang isang partikular na kinalabasan?',
          a: 'Hindi. Walang sinuman ang maaaring maggarantiya sa kinalabasan ng isang legal na bagay. Sinumang nangangako sa iyo ng resulta ay hindi tapat.',
        },
        {
          q: 'Magkano ang gastos?',
          a: 'Ang basic na questionnaire ay libre. Ang bayad na AI ulat ay nagsisimula sa AED 299. Ang bayad sa abogado ay hiwalay at itinakda ng abogado.',
        },
        {
          q: 'Kompidensiyal ba ang aking impormasyon?',
          a: 'Oo. Ang iyong data ay naka-encrypt sa rest at transit, ang access ay restricted, at hindi namin kailanman ipinagbibili ang iyong impormasyon. Maaari mong humiling ng pagtanggal anumang oras.',
        },
        {
          q: 'Anong mga wika ang sinusuportahan ninyo?',
          a: 'Arabic, English, Hindi, Urdu, at Tagalog.',
        },
        {
          q: 'Maaari bang gamitin ang sarili kong abogado?',
          a: 'Oo. Kasama sa bayad na AI ulat ang isang malinis na PDF na maaari mong ibahagi sa anumang abogadong gusto mo.',
        },
      ],
    },
    whatsapp: {
      title: 'Kailangan ng tulong ngayon?',
      sub: 'Makipag-usap sa isang tunay na tao sa loob ng ilang minuto',
      cta: 'Mag-chat na sa WhatsApp',
      note: 'Available 7 araw · English, Arabic, Hindi, Urdu, Filipino',
    },
    trust: {
      title: 'Ang iyong kaso ay protektado',
      items: [
        { icon: '🔒', text: 'Ligtas na paghawak ng dokumento' },
        { icon: '🕵️', text: 'Kompidensiyal na proseso' },
        { icon: '✅', text: 'Beripikadong propesyonal' },
        { icon: '🌍', text: 'Sumusunod sa batas ng UAE' },
      ],
    },
    footer: {
      disclaimer:
        'Ang ExpatUAE ay isang technology platform, hindi isang law firm. Hindi kami nagbibigay ng legal na payo at hindi naggarantiya ng anumang kinalabasan. Lahat ng legal na trabaho ay isinasagawa ng mga independenteng lisensyadong UAE propesyonal. Ang paggamit ng ExpatUAE ay hindi lumilikha ng lawyer-client relationship sa iyo at sa ExpatUAE.',
      links: ['Privacy', 'Terms', 'Cookies', 'Contact'],
    },
    sticky: 'Magsimula ng Libreng Assessment',
  },
}

// ─── Icons ────────────────────────────────────────────────────────
function WAIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate()

  const [lang, setLangState] = useState(() => localStorage.getItem('resolve-lang') || 'en')
  const [selected, setSelected] = useState(null) // situation card
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [locked, setLocked] = useState(true)

  // Deep-merge with English as fallback so missing properties in other
  // languages don't crash the app (e.g. new pricing tiers, lawyers, faq)
  const c =
    lang === 'en'
      ? COPY.en
      : {
          ...COPY.en,
          ...COPY[lang],
          hero: { ...COPY.en.hero, ...(COPY[lang]?.hero || {}) },
          how: { ...COPY.en.how, ...(COPY[lang]?.how || {}) },
          pricing: { ...COPY.en.pricing, ...(COPY[lang]?.pricing || {}) },
          lawyers: COPY[lang]?.lawyers || COPY.en.lawyers,
          faq: COPY[lang]?.faq || COPY.en.faq,
        }
  const meta = LANG_META[lang] || LANG_META.en
  const isRTL = ['ar', 'ur'].includes(lang)

  // Update html dir for RTL
  useEffect(() => {
    document.documentElement.dir = meta.dir
    document.documentElement.lang = lang
    return () => {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = 'en'
    }
  }, [lang, meta.dir])

  // Sticky bar trigger
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close lang dropdown on outside click
  const langRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('resolve-lang', l)
    setLangOpen(false)
  }

  const handleCTA = (mode = '') => {
    const url = mode ? `/signup?caseType=${mode}` : '/signup'
    navigate(url)
  }

  const handleSituationSelect = (id) => {
    setSelected(id)
    setTimeout(() => navigate(`/signup?caseType=${id}`), 400)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden">
      {/* ── Harvey.ai inspired style (embedded) ── */}
      <style>{`
        :root {
          --hy-base: #0d0b09;
          --hy-elevated: #15130f;
          --hy-card: #1a1714;
          --hy-subtle: #26231d;
          --hy-hover: #38352e;
          --hy-primary: #f5f3ef;
          --hy-secondary: #c9c6bb;
          --hy-muted: #7d786b;
          --hy-subtle-text: #979285;
          --hy-border: #38352e;
          --hy-border-strong: #4a463d;
          --hy-accent: #c4903e;
          --hy-accent-hover: #d4a05a;
          --hy-accent-soft: rgba(196,144,62,0.10);
          --hy-shadow: 0 8px 32px rgba(0,0,0,0.5);
          --hy-shadow-lg: 0 20px 60px rgba(0,0,0,0.6);
          --rounded-lg: 10px;
          --rounded-lg-lg: 16px;
          --rounded-lg-full: 9999px;
          --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --font-display: 'Instrument Serif', 'Inter', serif;
          --transition-all: 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .bg-[var(--bg-primary)] { background: var(--hy-base); }
        .bg-[var(--bg-elevated)] { background: var(--hy-elevated); }
        .bg-[var(--bg-card)] { background: var(--hy-card); }
        .bg-[var(--bg-elevated)] { background: var(--hy-subtle); }
        .bg-[var(--accent)] { background: var(--hy-accent); }
        .bg-[var(--accent)]-soft { background: var(--hy-accent-soft); }
        .text-[var(--text-primary)] { color: var(--hy-primary); }
        .text-[var(--text-secondary)] { color: var(--hy-secondary); }
        .text-[var(--text-muted)] { color: var(--hy-muted); }
        .text-hy-subtle { color: var(--hy-subtle-text); }
        .text-[var(--accent)] { color: var(--hy-accent); }
        .border-[var(--border)] { border-color: var(--hy-border); }
        .border-[var(--border)]-strong { border-color: var(--hy-border-strong); }
        .border-[var(--accent)] { border-color: var(--hy-accent); }
        .shadow-hy { box-shadow: var(--hy-shadow); }
        .shadow-lg { box-shadow: var(--hy-shadow-lg); }
        .font-body { font-family: var(--font-body); }
        .font-display { font-family: var(--font-display); }

        /* subtle grain */
        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          opacity: 0.12;
        }
        .glow-orb--a {
          width: 600px;
          height: 600px;
          top: -20%;
          right: -10%;
          background: radial-gradient(circle, var(--hy-accent) 0%, transparent 70%);
        }
        .glow-orb--b {
          width: 400px;
          height: 400px;
          bottom: -20%;
          left: -10%;
          background: radial-gradient(circle, rgba(196,144,62,0.15) 0%, transparent 70%);
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--hy-accent);
        }
        .eyebrow::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 1.5px;
          background: var(--hy-accent);
          border-radius: 2px;
        }

        /* Floating WhatsApp pulse */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .whatsapp-float {
          animation: float 3s ease-in-out infinite;
        }

        /* Smooth transitions */
        .transition-hy {
          transition: var(--transition-all);
        }
        .hover-lift:hover {
          transform: translateY(-2px);
        }
        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(196,144,62,0.12);
        }
      `}</style>

      {/* ── Grain overlay ── */}
      <div className="grain" aria-hidden="true" />

      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-hy-base font-bold text-sm shadow-lg">
              R
            </div>
            <span className="font-semibold text-[var(--text-primary)] text-lg tracking-tight font-display">
              {c.nav.brand}
            </span>
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <ThemeToggle />
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]-strong transition-all text-sm"
              >
                <span>{meta.flag}</span>
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="text-xs">▾</span>
              </button>
              {langOpen && (
                <div className="absolute top-full mt-2 end-0 w-44 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1.5 shadow-hy z-50">
                  {Object.entries(LANG_META).map(([code, m]) => (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-start',
                        lang === code
                          ? 'bg-[var(--accent)]-soft text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--text-primary)]/5 hover:text-[var(--text-primary)]',
                      )}
                    >
                      <span>{m.flag}</span>
                      <span>
                        {code === 'en'
                          ? 'English'
                          : code === 'ar'
                            ? 'العربية'
                            : code === 'hi'
                              ? 'हिन्दी'
                              : code === 'ur'
                                ? 'اردو'
                                : 'Filipino'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border)]-strong rounded-lg transition-all"
            >
              {c.nav.login}
            </button>

            <button
              onClick={() => handleCTA()}
              className="px-3 sm:px-4 py-1.5 text-sm font-semibold bg-[var(--accent)] text-hy-base rounded-lg hover:bg-[var(--accent)]-hover hover:shadow-lg transition-all"
            >
              {c.nav.start}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="glow-orb glow-orb--a" />
          <div className="glow-orb glow-orb--b" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hy-accent/30 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(245,240,232,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,232,0.5) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]-soft text-[var(--accent)] text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            {c.hero.badge}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-semibold text-[var(--text-primary)] leading-tight mb-6 tracking-tight">
            {c.hero.headline}
          </h1>

          <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            {c.hero.sub}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={() => handleCTA()}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-[var(--accent)] text-hy-base shadow-lg shadow-[var(--shadow-color)] hover:bg-[var(--accent)]-hover hover:-translate-y-0.5 transition-all"
            >
              {c.hero.cta1}
            </button>
            <button
              onClick={() => handleCTA('analyze')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-all"
            >
              {c.hero.cta2}
            </button>
          </div>

          {/* Micro-trust */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
            {c.hero.trust.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>

          {/* Hero disclaimer */}
          <div className="mt-8 inline-flex items-start gap-2 max-w-xl mx-auto p-3 rounded-xl bg-white/[0.02] border border-[var(--border)]">
            <span className="text-sm shrink-0 mt-0.5">⚖️</span>
            <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed">
              {c.hero.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* ─── SITUATION SELECTOR ──────────────────────────────────── */}
      <section className="py-12 px-4 bg-[var(--bg-elevated)]">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-lg font-semibold text-[var(--text-primary)] mb-6">
            {c.selector.title}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {c.selector.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSituationSelect(item.id)}
                className={clsx(
                  'group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 hover:-translate-y-1',
                  selected === item.id
                    ? 'border-[var(--accent)] bg-[var(--accent)]-soft shadow-lg shadow-hy-accent/20'
                    : 'border-[var(--border)] bg-[var(--bg-primary)]/50 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]-soft/20',
                )}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  {item.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF STRIP ──────────────────────────────────── */}
      <section className="py-6 px-4 border-y border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {c.proof.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent)] font-bold text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── AI PREVIEW (LOCKED) ──────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-elevated)]">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] text-center mb-2">
            AI Analysis
          </p>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)] text-center mb-2">
            {c.aiPreview.title}
          </h2>
          <p className="text-center text-[var(--text-muted)] mb-8">{c.aiPreview.sub}</p>

          {/* Bullets (visible) */}
          <div className="flex flex-col gap-2 mb-6">
            {c.aiPreview.bullets.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-primary)]/80 border border-[var(--border)]"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--accent)]-soft border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">{b}</span>
              </div>
            ))}
          </div>

          {/* Locked blurred content */}
          <div className="relative rounded-2xl overflow-hidden border border-[var(--accent)]/20">
            {/* Blurred steps */}
            <div
              className={clsx('p-6 space-y-3', locked && 'blur-sm select-none pointer-events-none')}
            >
              {c.aiPreview.blurItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm text-[var(--text-muted)] py-2 border-b border-[var(--border)] last:border-0"
                >
                  <span className="w-6 h-6 rounded-full bg-[var(--accent)]-soft border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Overlay */}
            {locked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-primary)]/75 backdrop-blur-md p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]-soft border border-[var(--accent)]/30 flex items-center justify-center mb-4">
                  <LockIcon />
                </div>
                <p className="font-bold text-[var(--text-primary)] text-lg mb-1">
                  {c.aiPreview.lockTitle}
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-5 max-w-xs">
                  {c.aiPreview.lockSub}
                </p>
                <button
                  onClick={() => handleCTA()}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-[var(--accent)] text-hy-base hover:bg-[var(--accent)]-hover hover:-translate-y-0.5 transition-all"
                >
                  {c.aiPreview.lockCta}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── DOCUMENT AI ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]-soft border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">
              {c.docAI.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)] mb-4 leading-snug">
              {c.docAI.title}
            </h2>
            <p className="text-[var(--text-muted)] mb-6 leading-relaxed">{c.docAI.sub}</p>
            <ul className="space-y-2 mb-8">
              {c.docAI.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]"
                >
                  <span className="text-[var(--accent)]">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCTA()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-[var(--bg-elevated)] border border-[var(--border)]-strong text-[var(--text-primary)] hover:hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)]/50 transition-all"
            >
              📄 {c.docAI.cta}
            </button>
          </div>

          {/* Doc card mockup */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden shadow-hy">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hy-accent/20 to-transparent" />
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border)]">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent)]-soft border border-[var(--accent)]/20 flex items-center justify-center text-xl">
                📄
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  bank_statement_oct.pdf
                </p>
                <p className="text-[11px] text-[var(--accent)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  AI Analysis Complete
                </p>
              </div>
            </div>
            {[
              { label: 'Document Type', value: 'Bank Statement' },
              { label: 'Total Exposure', value: 'AED 48,500', gold: true },
              { label: 'Outstanding Loan', value: 'AED 32,200' },
              { label: 'Risk Level', value: '⚠️ HIGH', red: true },
              { label: 'Next Step', value: 'File formal dispute within 14 days', small: true },
            ].map((row, i) => (
              <div
                key={i}
                className={clsx(
                  'flex justify-between items-start gap-3 py-2.5',
                  i < 4 && 'border-b border-[var(--border)]',
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {row.label}
                </span>
                <span
                  className={clsx(
                    'text-end',
                    row.gold
                      ? 'text-[var(--text-primary)] font-semibold text-sm'
                      : row.red
                        ? 'text-[var(--status-error)] text-xs font-bold bg-[var(--status-error)]/10 border border-[var(--status-error)]/20 px-2 py-0.5 rounded-full'
                        : row.small
                          ? 'text-[11px] text-[var(--text-primary)] max-w-[150px]'
                          : 'text-sm text-[var(--text-secondary)]',
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-elevated)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)] text-center mb-2">
            {c.how.title}
          </h2>
          <p className="text-center text-[var(--text-muted)] mb-12 max-w-xl mx-auto">
            {c.how.subtitle}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.how.steps.map((step, i) => (
              <div key={i} className="relative">
                {i < c.how.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 start-[calc(50%+28px)] end-[-calc(50%-28px)] h-px bg-gradient-to-r from-hy-accent/30 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-[var(--accent)]/50 bg-[var(--bg-primary)] flex items-center justify-center mb-4 font-display font-semibold text-xl text-[var(--text-primary)] shadow-[0_0_20px_rgba(196,144,62,0.08)]">
                    {step.num}
                  </div>
                  <p className="font-semibold text-[var(--text-primary)] mb-2">{step.title}</p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-5 rounded-2xl bg-[var(--accent)]-soft border border-[var(--accent)]/20 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{c.how.callout}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ─── EXECUTION / TRUST ───────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)] mb-2">
            {c.execution.title}
          </h2>
          <p className="text-[var(--text-muted)] mb-12">{c.execution.sub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {c.execution.roles.map((role, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/30 transition-all hover:-translate-y-1 shadow-hy"
              >
                <div className="text-3xl mb-4">{role.icon}</div>
                <p className="font-bold text-[var(--text-primary)] mb-2">{role.title}</p>
                <p className="text-sm text-[var(--text-muted)]">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-elevated)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]-soft border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">
              {c.pricing.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-[var(--text-primary)] mb-2">
              {c.pricing.title}
            </h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto">{c.pricing.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.pricing.tiers.map((tier) => (
              <div
                key={tier.id}
                className={clsx(
                  'relative rounded-2xl p-5 border transition-all flex flex-col',
                  tier.highlighted
                    ? 'bg-gradient-to-b from-hy-accent/10 to-transparent border-[var(--accent)]/40 shadow-hy shadow-hy-accent/10'
                    : 'bg-[var(--bg-card)]/50 border-[var(--border)] hover:border-[var(--accent)]/30',
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--accent)] text-hy-base text-[10px] font-black uppercase tracking-wider">
                    {c.pricing.popularLabel}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  {tier.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4 min-h-[2.5rem]">{tier.desc}</p>
                <div className="mb-4">
                  {tier.price ? (
                    <>
                      <p className="text-3xl font-display font-semibold text-[var(--text-primary)]">
                        {tier.price}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {tier.priceLabel}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[var(--text-secondary)]">Free</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {tier.priceLabel}
                      </p>
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-5 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <span className="text-[var(--accent)] shrink-0 mt-0.5">✓</span>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCTA()}
                  className={clsx(
                    'w-full py-2.5 rounded-lg font-bold text-sm transition-all',
                    tier.highlighted
                      ? 'bg-[var(--accent)] text-hy-base hover:bg-[var(--accent)]-hover hover:-translate-y-0.5 shadow-lg shadow-hy-accent/20'
                      : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]',
                  )}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Monetization transparency */}
          <div className="mt-8 max-w-3xl mx-auto p-5 rounded-2xl bg-[var(--bg-primary)]/50 border border-[var(--border)]">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <span className="text-[var(--accent)]">🔒</span>
              {c.pricing.monetizationTitle}
            </h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
              {c.pricing.monetizationText}
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent)]-soft border border-[var(--accent)]/10">
              <span className="text-sm shrink-0 mt-0.5">⚠️</span>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {c.pricing.monetizationNote}
              </p>
            </div>
          </div>

          {/* Pricing disclaimer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              {c.pricing.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* ─── WHATSAPP ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-hy-base via-hy-subtle to-hy-base">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center mx-auto mb-5 text-[#25D366]">
            <WAIcon size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)] mb-2">
            {c.whatsapp.title}
          </h2>
          <p className="text-[var(--text-muted)] mb-6">{c.whatsapp.sub}</p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base bg-[#25D366] text-hy-base shadow-lg shadow-[var(--shadow-color)] hover:shadow-green-500/35 hover:-translate-y-0.5 transition-all"
          >
            <WAIcon size={22} />
            {c.whatsapp.cta}
          </a>
          <p className="text-xs text-[var(--text-muted)] mt-4">{c.whatsapp.note}</p>
        </div>
      </section>

      {/* ─── FOR LAWYERS ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]-soft border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">
              🏛️ {c.lawyers.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)] mb-2">
              {c.lawyers.title}
            </h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto">{c.lawyers.sub}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* What we send */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-hy">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="text-[var(--accent)]">✓</span>
                {c.lawyers.sendTitle}
              </h3>
              <ul className="space-y-3">
                {c.lawyers.sendItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--accent)] shrink-0 mt-0.5">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What we don't do */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-hy">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="text-[var(--status-error)]">⚠</span>
                {c.lawyers.dontTitle}
              </h3>
              <ul className="space-y-3">
                {c.lawyers.dontItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--status-error)]/70 shrink-0 mt-0.5 text-xs">✕</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Compliance note */}
          <div className="p-5 rounded-2xl bg-[var(--accent)]-soft border border-[var(--accent)]/20 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0">⚖️</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  {c.lawyers.complianceLabel}
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {c.lawyers.complianceText}
                </p>
              </div>
            </div>
          </div>

          {/* Onboarding */}
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)] mb-4 max-w-lg mx-auto">
              {c.lawyers.onboardingText}
            </p>
            <a
              href="mailto:partners@expatuae.kafeely.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]-soft transition-all"
            >
              {c.lawyers.applyCta} →
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 bg-[var(--bg-elevated)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-2">
              {c.faq.badge}
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--text-primary)]">
              {c.faq.title}
            </h2>
          </div>
          <div className="space-y-3">
            {c.faq.items.map((faq, i) => (
              <details
                key={i}
                className="group bg-[var(--bg-primary)]/50 border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-sm font-medium text-[var(--text-primary)] hover:bg-white/[0.02] transition-colors list-none">
                  {faq.q}
                  <span className="text-[var(--text-muted)] shrink-0 group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST ───────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-[var(--bg-elevated)] border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-6">
            {c.trust.title}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {c.trust.items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border)] text-center"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-[var(--text-muted)] leading-tight">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-hy-base font-bold text-xs">
                R
              </div>
              <span className="font-semibold text-[var(--text-primary)] font-display">
                {c.nav.brand}
              </span>
            </div>
            <div className="flex gap-5">
              {c.footer.links.map((l, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--accent)]-soft border border-[var(--accent)]/15">
            <span className="text-lg shrink-0">⚖️</span>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {c.footer.disclaimer}
            </p>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            © 2026 ExpatUAE. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ─── STICKY BOTTOM BAR ───────────────────────────────────── */}
      <div
        className={clsx(
          'fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-primary)]/96 backdrop-blur-xl border-t border-[var(--border)] px-4 py-3 flex items-center justify-between gap-3 transition-transform duration-500',
          scrolled ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <p className="text-sm text-[var(--text-muted)] hidden sm:block">
          {c.stickyText || 'Not sure where to start? Try the free assessment.'}
        </p>
        <div className="flex items-center gap-2 ms-auto">
          <button
            onClick={() => handleCTA()}
            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[var(--accent)] text-hy-base shadow-lg shadow-[var(--shadow-color)] hover:bg-[var(--accent)]-hover hover:-translate-y-0.5 transition-all"
          >
            {c.sticky}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
