import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'

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
    nav: { brand: 'ريزولف يو إي', login: 'تسجيل الدخول', start: 'ابدأ مجاناً' },
    hero: {
      headline: 'لا تحتاج إلى العودة إلى الإمارات لحل مشكلتك.',
      sub: 'قروض بنكية، قضايا قانونية، مخالفات سيارات، أو نزاعات عمل — نتولى كل شيء عن بُعد بالذكاء الاصطناعي وخبراء حقيقيين.',
      cta1: 'ابدأ قضيتي الآن',
      cta2: 'تحقق من وضعي مجاناً',
      trust: ['يستغرق دقيقتين', '100% سري', 'لا حاجة للسفر'],
    },
    selector: {
      title: 'ما الذي يصف وضعك بشكل أفضل؟',
      items: [
        { id: 'banking', icon: '🏦', label: 'ديون بنكية', desc: 'قروض، حسابات مجمدة، فوائد' },
        { id: 'car', icon: '🚗', label: 'سيارة مخلفة', desc: 'مخالفات، مصادرة، قروض' },
        { id: 'legal', icon: '⚖️', label: 'قضية قانونية', desc: 'قضايا محاكم، حظر سفر' },
        { id: 'employment', icon: '💼', label: 'مشكلة عمل', desc: 'رواتب غير مدفوعة، نزاعات' },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: 'أكثر من 500 قضية محللة' },
        { icon: '✓', text: 'موثوق من المغتربين في 40+ دولة' },
        { icon: '✓', text: 'سريع وسري' },
      ],
      live: 'آخر قضية حُلّت منذ ساعتين',
    },
    aiPreview: {
      title: 'نحلل قضيتك فوراً',
      sub: 'بناءً على وضعك، قضيتك قد تتضمن:',
      bullets: ['تفاوض تسوية بنكية', 'إجراءات تخليص قانوني', 'خطة إعادة هيكلة المدفوعات'],
      lockTitle: 'افتح خطة قضيتك الكاملة',
      lockSub: 'حل خطوة بخطوة، تعيين خبير، وجدول زمني',
      lockCta: 'افتح الخطة الكاملة — 99 درهم',
      blurItems: [
        'الخطوة 1: الاتصال بالقسم القانوني للبنك عبر القنوات الرسمية الإماراتية…',
        'الخطوة 2: تقديم طلب إعادة هيكلة الديون بموجب إرشادات المصرف المركزي…',
        'الخطوة 3: التفاوض على تسوية خلال 30-90 يوماً…',
        'الخطوة 4: الحصول على شهادة الإخلاء الرسمية وخطاب تخليص البنك…',
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
      steps: [
        { num: '٠١', title: 'أخبرنا بوضعك', desc: 'أدخل التفاصيل. يستغرق أقل من دقيقتين.' },
        {
          num: '٠٢',
          title: 'احصل على تحليل بالذكاء الاصطناعي',
          desc: 'يقيّم محركنا قضيتك ويبني خطة.',
        },
        { num: '٠٣', title: 'وافق على خطة التنفيذ', desc: 'اعرف بالضبط ما سيُنجز قبل أن تلتزم.' },
        { num: '٠٤', title: 'نحلها عن بُعد', desc: 'فريقنا الإماراتي يتولى كل شيء.' },
      ],
    },
    execution: {
      title: 'خبراء حقيقيون يتولون قضيتك',
      sub: 'لا حاجة للسفر. نتولى كل شيء.',
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
      badge: 'الأسعار',
      title: 'ابدأ مجاناً.',
      anchor: 'استشارة قانونية عادية: 750+ درهم',
      cta: 'افتح خطتي الكاملة — 99 درهم',
      note: 'دفعة واحدة · وصول فوري · بدون اشتراك',
    },
    urgency: {
      text: '⚠ التأخير يزيد الغرامات والمخاطر القانونية. ابدأ الآن لتجنب التعقيدات.',
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
        'تقدم هذه المنصة تنظيم القضايا بمساعدة الذكاء الاصطناعي فقط. لا تقدم استشارة قانونية.',
      links: ['الخصوصية', 'الشروط', 'اتصل بنا'],
    },
    sticky: 'ابدأ قضيتي الآن',
  },
  hi: {
    nav: { brand: 'रिज़ॉल्व यूएई', login: 'लॉग इन', start: 'मुफ़्त शुरू करें' },
    hero: {
      headline: 'UAE की समस्या ठीक करने के लिए आपको वापस जाने की जरूरत नहीं।',
      sub: 'बैंक लोन, कानूनी मामले, कार जुर्माने, या नौकरी विवाद — हम AI और विशेषज्ञों से सब दूर से हल करते हैं।',
      cta1: 'अभी अपना केस शुरू करें',
      cta2: 'मेरी स्थिति मुफ़्त देखें',
      trust: ['2 मिनट लगते हैं', '100% गोपनीय', 'यात्रा की जरूरत नहीं'],
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
        { icon: '✓', text: '500+ केस विश्लेषित' },
        { icon: '✓', text: '40+ देशों के प्रवासियों का विश्वास' },
        { icon: '✓', text: 'तेज़ और गोपनीय' },
      ],
      live: 'आखिरी केस 2 घंटे पहले हल हुआ',
    },
    aiPreview: {
      title: 'हम आपका केस तुरंत विश्लेषण करते हैं',
      sub: 'आपकी स्थिति के आधार पर, आपके केस में शामिल हो सकता है:',
      bullets: ['बैंक सेटलमेंट बातचीत', 'कानूनी क्लियरेंस प्रक्रिया', 'भुगतान पुनर्गठन योजना'],
      lockTitle: 'अपनी पूरी केस योजना अनलॉक करें',
      lockSub: 'चरण-दर-चरण समाधान, विशेषज्ञ नियुक्ति, और समयरेखा',
      lockCta: 'पूरी योजना अनलॉक करें — AED 99',
      blurItems: [
        'चरण 1: आधिकारिक UAE चैनलों के माध्यम से बैंक के कानूनी विभाग से संपर्क करें…',
        'चरण 2: केंद्रीय बैंक दिशानिर्देशों के तहत ऋण पुनर्गठन अनुरोध जमा करें…',
        'चरण 3: 30-90 दिनों के भीतर एक सेटलमेंट पर बातचीत करें…',
        'चरण 4: आधिकारिक क्लियरेंस प्रमाणपत्र और बैंक क्लियरेंस पत्र प्राप्त करें…',
      ],
    },
    docAI: {
      badge: 'दस्तावेज़ इंटेलिजेंस',
      title: 'हम आपके दस्तावेज़ केवल स्टोर नहीं करते — हम उन्हें समझते हैं।',
      sub: 'कोई भी अनुबंध, बैंक स्टेटमेंट, या कानूनी नोटिस अपलोड करें। AI सेकंडों में जोखिम, दायित्व और सटीक अगले कदम निकालता है।',
      items: ['अनुबंध और समझौते', 'बैंक स्टेटमेंट', 'कानूनी दस्तावेज़', 'रोजगार पत्र'],
      cta: 'मेरे दस्तावेज़ अपलोड करें और विश्लेषण करें',
    },
    how: {
      title: 'यह कैसे काम करता है',
      steps: [
        { num: '०१', title: 'अपनी स्थिति बताएं', desc: 'विवरण भरें। 2 मिनट से कम लगते हैं।' },
        {
          num: '०२',
          title: 'AI-आधारित विश्लेषण पाएं',
          desc: 'हमारा इंजन आपके केस का मूल्यांकन करता है।',
        },
        {
          num: '०३',
          title: 'एक्जिक्यूशन प्लान मंजूर करें',
          desc: 'प्रतिबद्ध होने से पहले सब देखें।',
        },
        { num: '०४', title: 'हम दूर से हल करते हैं', desc: 'हमारी UAE टीम सब संभालती है।' },
      ],
    },
    execution: {
      title: 'वास्तविक विशेषज्ञ आपका केस संभालते हैं',
      sub: 'यात्रा की कोई जरूरत नहीं। हम सब संभालते हैं।',
      roles: [
        { icon: '⚖️', title: 'UAE लाइसेंस प्राप्त वकील', desc: 'कोर्ट फाइलिंग, कानूनी विवाद' },
        { icon: '🏛️', title: 'सरकारी PRO', desc: 'मंत्रालय फाइलिंग, सरकारी दस्तावेज़' },
        { icon: '🤝', title: 'ऋण वार्ताकार', desc: 'बैंक सेटलमेंट और पुनर्गठन' },
      ],
    },
    pricing: {
      badge: 'मूल्य',
      title: 'मुफ़्त में शुरू करें।',
      anchor: 'सामान्य कानूनी परामर्श: AED 750+',
      cta: 'मेरी पूरी योजना अनलॉक करें — AED 99',
      note: 'एकबारगी भुगतान · तत्काल पहुंच · कोई सदस्यता नहीं',
    },
    urgency: { text: '⚠ देरी से दंड और कानूनी जोखिम बढ़ सकता है। अभी शुरू करें।' },
    whatsapp: {
      title: 'अभी मदद चाहिए?',
      sub: 'मिनटों में एक वास्तविक व्यक्ति से बात करें',
      cta: 'WhatsApp पर अभी चैट करें',
      note: 'सप्ताह के 7 दिन उपलब्ध',
    },
    trust: {
      title: 'आपका केस सुरक्षित है',
      items: [
        { icon: '🔒', text: 'सुरक्षित दस्तावेज़ प्रबंधन' },
        { icon: '🕵️', text: 'गोपनीय प्रक्रिया' },
        { icon: '✅', text: 'सत्यापित पेशेवर' },
        { icon: '🌍', text: 'UAE-कानून अनुपालन' },
      ],
    },
    footer: {
      disclaimer: 'यह प्लेटफ़ॉर्म केवल AI-सहायता केस संगठन प्रदान करता है। यह कानूनी सलाह नहीं है।',
      links: ['गोपनीयता', 'शर्तें', 'संपर्क'],
    },
    sticky: 'अभी अपना केस शुरू करें',
  },
  ur: {
    nav: { brand: 'ریزولو یو اے ای', login: 'لاگ ان', start: 'مفت شروع کریں' },
    hero: {
      headline: 'UAE کی مشکل ٹھیک کرنے کے لیے واپس آنے کی ضرورت نہیں۔',
      sub: 'بینک لون، قانونی مسائل، کار جرمانے، یا ملازمت تنازعات — ہم AI اور ماہرین سے سب دور سے حل کرتے ہیں۔',
      cta1: 'ابھی اپنا کیس شروع کریں',
      cta2: 'میری صورت مفت دیکھیں',
      trust: ['2 منٹ لگتے ہیں', '100% خفیہ', 'سفر کی ضرورت نہیں'],
    },
    selector: {
      title: 'آپ کی صورت حال کو سب سے بہتر کیا بیان کرتا ہے؟',
      items: [
        { id: 'banking', icon: '🏦', label: 'بینک قرض', desc: 'لون، بند اکاؤنٹ، سود' },
        { id: 'car', icon: '🚗', label: 'کار چھوڑی', desc: 'جرمانے، ضبطی، لون' },
        { id: 'legal', icon: '⚖️', label: 'قانونی مسئلہ', desc: 'عدالتی مقدمات، ٹریول بین' },
        { id: 'employment', icon: '💼', label: 'ملازمت مسئلہ', desc: 'غیر ادا تنخواہ، تنازعات' },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: '500+ کیس تجزیہ شدہ' },
        { icon: '✓', text: '40+ ممالک کے تارکین وطن کا اعتماد' },
        { icon: '✓', text: 'تیز اور خفیہ' },
      ],
      live: 'آخری کیس 2 گھنٹے پہلے حل ہوا',
    },
    aiPreview: {
      title: 'ہم آپ کا کیس فوری تجزیہ کرتے ہیں',
      sub: 'آپ کی صورت حال کی بنیاد پر، آپ کے کیس میں شامل ہو سکتا ہے:',
      bullets: ['بینک سیٹلمنٹ بات چیت', 'قانونی کلیئرنس عمل', 'ادائیگی کی نئی ترتیب'],
      lockTitle: 'اپنا مکمل کیس پلان کھولیں',
      lockSub: 'قدم بہ قدم حل، ماہر تقرر، اور ٹائم لائن',
      lockCta: 'مکمل پلان کھولیں — 99 درہم',
      blurItems: [
        'قدم 1: سرکاری UAE چینلز کے ذریعے بینک کے قانونی شعبے سے رابطہ کریں…',
        'قدم 2: مرکزی بینک کی ہدایات کے تحت قرض کی ترتیب نو کی درخواست جمع کریں…',
        'قدم 3: 30-90 دن میں تصفیہ پر بات چیت کریں…',
        'قدم 4: سرکاری کلیئرنس سرٹیفکیٹ اور بینک کلیئرنس خط حاصل کریں…',
      ],
    },
    docAI: {
      badge: 'دستاویز انٹیلی جنس',
      title: 'ہم آپ کے دستاویزات صرف محفوظ نہیں کرتے — ہم انہیں سمجھتے ہیں۔',
      sub: 'کوئی بھی معاہدہ، بینک بیان، یا قانونی نوٹس اپ لوڈ کریں۔ AI سیکنڈوں میں خطرات اور اگلے قدم نکالتا ہے۔',
      items: ['معاہدے اور سمجھوتے', 'بینک بیانات', 'قانونی دستاویزات', 'ملازمت کے کاغذات'],
      cta: 'میرے دستاویزات اپ لوڈ کریں',
    },
    how: {
      title: 'یہ کیسے کام کرتا ہے',
      steps: [
        { num: '۰۱', title: 'اپنی صورت بتائیں', desc: 'تفصیلات درج کریں۔ 2 منٹ سے کم۔' },
        { num: '۰۲', title: 'AI تجزیہ حاصل کریں', desc: 'ہمارا انجن کیس کا جائزہ لیتا ہے۔' },
        { num: '۰۳', title: 'نفاذ منصوبہ منظور کریں', desc: 'وعدہ سے پہلے سب دیکھیں۔' },
        { num: '۰۴', title: 'ہم دور سے حل کرتے ہیں', desc: 'ہماری UAE ٹیم سب سنبھالتی ہے۔' },
      ],
    },
    execution: {
      title: 'حقیقی ماہرین آپ کا کیس سنبھالتے ہیں',
      sub: 'سفر کی ضرورت نہیں۔ ہم سب سنبھالتے ہیں۔',
      roles: [
        { icon: '⚖️', title: 'لائسنس یافتہ UAE وکیل', desc: 'عدالتی درخواستیں، قانونی تنازعات' },
        { icon: '🏛️', title: 'حکومتی PRO', desc: 'وزارتی درخواستیں، دستاویزات' },
        { icon: '🤝', title: 'قرض مذاکرات کار', desc: 'بینک تصفیہ اور ادائیگی ترتیب' },
      ],
    },
    pricing: {
      badge: 'قیمت',
      title: 'مفت شروع کریں۔',
      anchor: 'عام قانونی مشاورت: AED 750+',
      cta: 'میرا مکمل پلان کھولیں — AED 99',
      note: 'ایک بار ادائیگی · فوری رسائی · کوئی سبسکرپشن نہیں',
    },
    urgency: { text: '⚠ تاخیر سے جرمانے اور قانونی خطرہ بڑھ سکتا ہے۔ ابھی شروع کریں۔' },
    whatsapp: {
      title: 'ابھی مدد چاہیے؟',
      sub: 'منٹوں میں ایک حقیقی شخص سے بات کریں',
      cta: 'واٹس ایپ پر ابھی چیٹ کریں',
      note: 'ہفتے کے 7 دن دستیاب',
    },
    trust: {
      title: 'آپ کا کیس محفوظ ہے',
      items: [
        { icon: '🔒', text: 'محفوظ دستاویز معالجہ' },
        { icon: '🕵️', text: 'خفیہ عمل' },
        { icon: '✅', text: 'تصدیق شدہ پیشہ ور' },
        { icon: '🌍', text: 'UAE قانون کے مطابق' },
      ],
    },
    footer: {
      disclaimer:
        'یہ پلیٹ فارم صرف AI کی مدد سے کیس آرگنائزیشن فراہم کرتا ہے۔ یہ قانونی مشورہ نہیں۔',
      links: ['پرائیویسی', 'شرائط', 'رابطہ'],
    },
    sticky: 'ابھی اپنا کیس شروع کریں',
  },
  tl: {
    nav: { brand: 'ResolveUAE', login: 'Mag-Log In', start: 'Magsimula nang Libre' },
    hero: {
      headline: 'Hindi mo kailangang bumalik sa UAE para ayusin ang iyong kaso.',
      sub: 'Bank loans, legal issues, car fines, o job disputes — hinahawakan namin ang lahat nang remote gamit ang AI + tunay na mga eksperto.',
      cta1: 'Simulan ang Aking Kaso Ngayon',
      cta2: 'Tingnan ang Aking Sitwasyon nang Libre',
      trust: ['Tumatagal ng 2 minuto', '100% kumpidensyal', 'Hindi kailangan ng biyahe'],
    },
    selector: {
      title: 'Ano ang pinakamahusay na naglalarawan ng iyong sitwasyon?',
      items: [
        { id: 'banking', icon: '🏦', label: 'Bank Utang', desc: 'Loans, frozen accounts, interes' },
        { id: 'car', icon: '🚗', label: 'Naiwan na Sasakyan', desc: 'Multa, repossession, loans' },
        { id: 'legal', icon: '⚖️', label: 'Legal na Isyu', desc: 'Court cases, travel ban' },
        {
          id: 'employment',
          icon: '💼',
          label: 'Problema sa Trabaho',
          desc: 'Hindi bayad na sahod, alitan',
        },
      ],
    },
    proof: {
      items: [
        { icon: '✓', text: '500+ kaso na nasuri' },
        { icon: '✓', text: 'Pinagkakatiwalaan ng mga OFW sa 40+ bansa' },
        { icon: '✓', text: 'Mabilis at kumpidensyal' },
      ],
      live: 'Huling kaso nareresolba 2h na ang nakakaraan',
    },
    aiPreview: {
      title: 'Sinusuri namin ang iyong kaso kaagad',
      sub: 'Batay sa iyong sitwasyon, maaaring kasama sa iyong kaso ang:',
      bullets: [
        'Negosasyon ng bank settlement',
        'Proseso ng legal clearance',
        'Plano ng muling pagtaas ng bayad',
      ],
      lockTitle: 'I-unlock ang iyong kumpletong case plan',
      lockSub: 'Hakbang-hakbang na resolusyon, pag-aasign ng eksperto, at timeline',
      lockCta: 'I-unlock ang Buong Plano — AED 99',
      blurItems: [
        'Hakbang 1: Makipag-ugnayan sa legal na departamento ng bangko sa pamamagitan ng opisyal na channel ng UAE…',
        'Hakbang 2: Magsumite ng kahilingan sa muling pagtaas ng utang sa ilalim ng mga alituntunin ng Central Bank…',
        'Hakbang 3: Makipag-negosasyon ng settlement sa loob ng 30–90 araw…',
        'Hakbang 4: Kumuha ng opisyal na clearance certificate at bank clearance letter…',
      ],
    },
    docAI: {
      badge: 'Document Intelligence',
      title: 'Hindi lang namin iniimbak ang iyong mga dokumento — naiintindihan namin sila.',
      sub: 'Mag-upload ng anumang kontrata, bank statement, o legal notice. Kukuha ang AI ng mga panganib, obligasyon, at susunod na hakbang sa loob ng ilang segundo.',
      items: [
        'Mga kontrata at kasunduan',
        'Mga bank statement',
        'Legal na dokumento at court notice',
        'Mga papel sa trabaho',
      ],
      cta: 'I-upload ang Aking mga Dokumento at Suriin',
    },
    how: {
      title: 'Paano ito gumagana',
      steps: [
        {
          num: '01',
          title: 'Sabihin ang iyong sitwasyon',
          desc: 'Punan ang mga detalye. Wala pang 2 minuto.',
        },
        {
          num: '02',
          title: 'Makuha ang AI analysis',
          desc: 'Tinatasa ng aming engine ang iyong kaso.',
        },
        { num: '03', title: 'Aprubahan ang plano', desc: 'Tingnan ang lahat bago mag-commit.' },
        {
          num: '04',
          title: 'Nireresolba namin ito',
          desc: 'Ang aming UAE team ang humahawak ng lahat.',
        },
      ],
    },
    execution: {
      title: 'Mga tunay na eksperto ang humahawak ng iyong kaso',
      sub: 'Hindi kailangan ng biyahe. Hinahawakan namin ang lahat.',
      roles: [
        {
          icon: '⚖️',
          title: 'Mga Lisensyadong UAE Abogado',
          desc: 'Court filings, legal disputes',
        },
        {
          icon: '🏛️',
          title: 'Government PROs',
          desc: 'Ministeryal na filings, opisyal na dokumentasyon',
        },
        { icon: '🤝', title: 'Mga Debt Negotiator', desc: 'Bank settlements at muling pagbabayad' },
      ],
    },
    pricing: {
      badge: 'Presyo',
      title: 'Magsimula nang libre.',
      anchor: 'Karaniwang legal na konsultasyon: AED 750+',
      cta: 'I-unlock ang Aking Buong Plano — AED 99',
      note: 'Isang beses na bayad · Agarang access · Walang subscription',
    },
    urgency: {
      text: '⚠ Ang pagpapaliban ay maaaring magdulot ng mas mataas na multa at legal na panganib. Magsimula na ngayon.',
    },
    whatsapp: {
      title: 'Kailangan ng tulong ngayon?',
      sub: 'Makipag-usap sa isang tunay na tao sa loob ng ilang minuto',
      cta: 'Mag-Chat sa WhatsApp Ngayon',
      note: 'Available 7 araw sa isang linggo',
    },
    trust: {
      title: 'Protektado ang iyong kaso',
      items: [
        { icon: '🔒', text: 'Ligtas na paghawak ng dokumento' },
        { icon: '🕵️', text: 'Kumpidensyal na proseso' },
        { icon: '✅', text: 'Mga verified na propesyonal' },
        { icon: '🌍', text: 'Sumusunod sa batas ng UAE' },
      ],
    },
    footer: {
      disclaimer:
        'Nagbibigay lamang ang platform na ito ng AI-assisted na organisasyon ng kaso. Hindi ito legal na payo.',
      links: ['Privacy', 'Terms', 'Contact'],
    },
    sticky: 'Simulan ang Aking Kaso Ngayon',
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


// ─── Design tokens ──────────────────────────────────────────────────
const T = {
  paper: '#F7F4EC',
  paperRaised: '#FFFFFF',
  ink: '#181611',
  inkSoft: '#635C4F',
  inkFaint: '#9B927F',
  line: '#DDD5C2',
  lineStrong: '#C7BC9F',
  accent: '#204B3B',
  accentSoft: 'rgba(32,75,59,0.08)',
  accentSoft2: 'rgba(32,75,59,0.14)',
  brick: '#A23B2E',
  brickSoft: 'rgba(162,59,46,0.09)',
  wa: '#25D366',
}

// ─── Line-icon set (replaces emoji for a quieter, legal-document feel) ──
function Icon({ token, size = 18, className = '', style }) {
  const s = { width: size, height: size, style }
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (token) {
    case 'bank':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M3 9.5 12 4l9 5.5" />
          <path d="M4.5 9.5v9M9 9.5v9M15 9.5v9M19.5 9.5v9" />
          <path d="M3 20.5h18" />
        </svg>
      )
    case 'car':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M4 16.5 5.6 11a2 2 0 011.9-1.4h9a2 2 0 011.9 1.4l1.6 5.5" />
          <rect x="3" y="16.5" width="18" height="4" rx="1.2" />
          <circle cx="7.5" cy="18.5" r=".6" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="18.5" r=".6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'scale':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M12 3v18M8 21h8" />
          <path d="M5 6h6M13 6h6" />
          <path d="M2.5 10 5 6l2.5 4a2.6 2.6 0 01-5 0Z" />
          <path d="M16.5 10 19 6l2.5 4a2.6 2.6 0 01-5 0Z" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
          <path d="M8.5 7.5V6a2 2 0 012-2h3a2 2 0 012 2v1.5" />
          <path d="M3 12.5h18" />
        </svg>
      )
    case 'check':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <rect x="4.5" y="10.5" width="15" height="10" rx="1.8" />
          <path d="M8 10.5V7.5a4 4 0 018 0v3" />
        </svg>
      )
    case 'eye-off':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.2A10.6 10.6 0 0112 5c5 0 8.7 3.4 10 7-.5 1.4-1.4 2.9-2.6 4.1M6.6 6.6C4.4 8 2.9 9.9 2 12c1.3 3.6 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
          <path d="M9.9 10a3 3 0 004.2 4.2" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.2-3.4-8.5s1.2-6.2 3.4-8.5z" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M12 3.5 19 6v6c0 4.4-3 7.7-7 8.5-4-.8-7-4.1-7-8.5V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'handshake':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M2.5 12.5 6 9l3 2.2M21.5 12.5 18 9l-3 2.2" />
          <path d="M9 11.2l2.4 2.2a1.5 1.5 0 002.1-2.1L11 8.7 9 10.5l-3-2.2-3.5 3.2 3 2.6 2 1.8a2 2 0 002.8 0" />
          <path d="M15 11.2l-2.4 2.2" />
        </svg>
      )
    case 'gov':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M3 9.5 12 4l9 5.5" />
          <path d="M5 9.5v9M19 9.5v9M3 20.5h18" />
          <path d="M12 8v3" />
        </svg>
      )
    case 'doc':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M6.5 2.5h8L19 7v14a1 1 0 01-1 1H6.5a1 1 0 01-1-1v-17a1 1 0 011-1z" />
          <path d="M14 2.5V7h4.5" />
          <path d="M8.5 12h7M8.5 15h7M8.5 18h4" />
        </svg>
      )
    case 'warn':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M12 3.5 21.5 20h-19z" />
          <path d="M12 9.5v5M12 17h.01" />
        </svg>
      )
    case 'search':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.8-4.8" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      )
    case 'stamp':
      return (
        <svg {...s} {...common} viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="10" r="6.2" />
          <path d="M8.4 10.3l2.2 2.2 4.4-4.6" />
          <path d="M7 20.5h10M9 16.5l-1.4 4M15 16.5l1.4 4" />
        </svg>
      )
    default:
      return null
  }
}

// Map the emoji used inside COPY content to the new line-icon tokens,
// so translated data stays untouched but renders with the new icon set.
const EMOJI_TOKEN = {
  '🏦': 'bank',
  '🚗': 'car',
  '⚖️': 'scale',
  '💼': 'briefcase',
  '✓': 'check',
  '✅': 'check',
  '🔒': 'lock',
  '🕵️': 'eye-off',
  '🌍': 'globe',
  '🤝': 'handshake',
  '🏛️': 'gov',
  '📄': 'doc',
  '⚠️': 'warn',
  '⚠': 'warn',
}
function GlyphIcon({ emoji, size = 18, className = '', style }) {
  const token = EMOJI_TOKEN[emoji]
  if (!token) return <span className={className} style={style}>{emoji}</span>
  return <Icon token={token} size={size} className={className} style={style} />
}

// ─── Docket / case-file decorative card — the page's signature motif ──
function DocketCard({ className = '' }) {
  return (
    <div
      className={clsx('relative rounded-[4px] border overflow-hidden', className)}
      style={{ borderColor: T.line, background: T.paperRaised }}
    >
      <div className="absolute -top-px left-6 w-16 h-2 rounded-b-[3px]" style={{ background: T.accent }} />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: T.inkFaint }}>
            File 2026-EXP-0184
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-1 rounded-sm"
            style={{ color: T.accent, background: T.accentSoft }}
          >
            Status: Reviewed
          </span>
        </div>
        <div className="space-y-2.5">
          <div className="h-2.5 rounded-sm" style={{ background: T.line, width: '92%' }} />
          <div className="h-2.5 rounded-sm" style={{ background: T.line, width: '78%' }} />
          <div className="h-2.5 rounded-sm" style={{ background: T.line, width: '85%' }} />
          <div className="h-2.5 rounded-sm" style={{ background: T.accentSoft2, width: '60%' }} />
          <div className="h-2.5 rounded-sm" style={{ background: T.line, width: '70%' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate()

  const [lang, setLangState] = useState(() => localStorage.getItem('resolve-lang') || 'en')
  const [selected, setSelected] = useState(null)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [locked, setLocked] = useState(true)

  const c = COPY[lang] || COPY.en
  const meta = LANG_META[lang] || LANG_META.en
  const isRTL = ['ar', 'ur'].includes(lang)

  useEffect(() => {
    document.documentElement.dir = meta.dir
    document.documentElement.lang = lang
    return () => {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = 'en'
    }
  }, [lang, meta.dir])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  // shared style helpers
  const eyebrow = 'font-mono text-[10px] tracking-[0.22em] uppercase'
  const serif = 'font-display'

  return (
    <div
      className={clsx('min-h-screen font-sans overflow-x-hidden', isRTL && 'font-sans')}
      style={{ background: T.paper, color: T.ink }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .font-sans { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(420%); } }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b"
        style={{ background: 'rgba(247,244,236,0.92)', borderColor: T.line }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-[3px] flex items-center justify-center font-display font-semibold text-sm"
              style={{ background: T.ink, color: T.paper }}
            >
              E
            </div>
            <span className={clsx(serif, 'font-semibold text-lg tracking-tight')} style={{ color: T.ink }}>
              {c.nav.brand}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] border text-sm transition-all"
                style={{ borderColor: T.line, color: T.inkSoft }}
              >
                <span>{meta.flag}</span>
                <span className="hidden sm:inline font-mono text-xs">{meta.label}</span>
                <span className="text-[9px]">▾</span>
              </button>
              {langOpen && (
                <div
                  className="absolute top-full mt-2 end-0 w-44 rounded-[4px] p-1.5 shadow-2xl z-50 border"
                  style={{ background: T.paperRaised, borderColor: T.line }}
                >
                  {Object.entries(LANG_META).map(([code, m]) => (
                    <button
                      key={code}
                      onClick={() => setLang(code)}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-sm transition-all text-start',
                      )}
                      style={
                        lang === code
                          ? { background: T.accentSoft, color: T.accent }
                          : { color: T.inkSoft }
                      }
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
              className="hidden sm:block px-3 py-1.5 text-sm border rounded-[3px] transition-all"
              style={{ borderColor: T.line, color: T.inkSoft }}
            >
              {c.nav.login}
            </button>

            <button
              onClick={() => handleCTA()}
              className="px-3 sm:px-4 py-1.5 text-sm font-semibold rounded-[3px] transition-all hover:-translate-y-0.5"
              style={{ background: T.ink, color: T.paper }}
            >
              {c.nav.start}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4">
        <div className="max-w-6xl mx-auto">
          {/* docket header bar */}
          <div
            className="hidden sm:flex items-center justify-between max-w-4xl mx-auto mb-10 pb-3 border-b"
            style={{ borderColor: T.line }}
          >
            <span className={eyebrow} style={{ color: T.inkFaint }}>
              {c.hero.badge}
            </span>
            <span className={eyebrow} style={{ color: T.inkFaint }}>
              UAE · Remote Intake
            </span>
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="sm:hidden inline-flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
              <span className={eyebrow} style={{ color: T.inkFaint }}>{c.hero.badge}</span>
            </div>

            <h1
              className={clsx(serif, 'font-semibold leading-[1.08] mb-6 tracking-tight text-4xl sm:text-6xl lg:text-7xl')}
              style={{ color: T.ink }}
            >
              {c.hero.headline}
            </h1>

            <p className="text-base sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: T.inkSoft }}>
              {c.hero.sub}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <button
                onClick={() => handleCTA()}
                className="w-full sm:w-auto px-8 py-4 rounded-[3px] font-semibold text-base transition-all hover:-translate-y-0.5"
                style={{ background: T.ink, color: T.paper }}
              >
                {c.hero.cta1}
              </button>
              <button
                onClick={() => handleCTA('analyze')}
                className="w-full sm:w-auto px-8 py-4 rounded-[3px] font-medium text-base border transition-all inline-flex items-center justify-center gap-2"
                style={{ borderColor: T.lineStrong, color: T.ink }}
              >
                {c.hero.cta2}
                <Icon token="arrow" size={15} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {c.hero.trust.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: T.inkSoft }}>
                  <Icon token="check" size={14} className="shrink-0" style={{ color: T.accent }} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* signature docket card */}
          <div className="max-w-md mx-auto mt-14">
            <DocketCard />
          </div>

          {/* hero disclaimer */}
          <div
            className="mt-10 max-w-xl mx-auto p-4 rounded-[3px] border flex items-start gap-2.5"
            style={{ background: T.paperRaised, borderColor: T.line }}
          >
            <Icon token="scale" size={15} className="shrink-0 mt-0.5" style={{ color: T.inkFaint }} />
            <p className="text-[11px] text-center leading-relaxed" style={{ color: T.inkFaint }}>
              {c.hero.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* ── SITUATION SELECTOR ──────────────────────────────────── */}
      <section className="py-14 px-4 border-y" style={{ borderColor: T.line, background: T.paperRaised }}>
        <div className="max-w-4xl mx-auto">
          <p className={clsx(serif, 'text-center text-xl sm:text-2xl font-semibold mb-8')} style={{ color: T.ink }}>
            {c.selector.title}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {c.selector.items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleSituationSelect(item.id)}
                className="group relative flex flex-col items-center gap-2.5 p-5 rounded-[4px] border-2 text-center transition-all duration-200 hover:-translate-y-1 overflow-hidden"
                style={
                  selected === item.id
                    ? { borderColor: T.accent, background: T.accentSoft }
                    : { borderColor: T.line, background: T.paper }
                }
              >
                <span
                  className="absolute -top-px left-4 w-8 h-1.5 rounded-b-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: T.accent }}
                />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: T.inkFaint }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon token={item.icon ? EMOJI_TOKEN[item.icon] : undefined} size={24} style={{ color: T.ink }} />
                <span className="font-semibold text-sm" style={{ color: T.ink }}>{item.label}</span>
                <span className="text-xs" style={{ color: T.inkFaint }}>{item.desc}</span>
                {selected === item.id && (
                  <span className="absolute top-2 right-2" style={{ color: T.accent }}>
                    <Icon token="check" size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ──────────────────────────────────── */}
      <section className="py-6 px-4" style={{ background: T.paper }}>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3 divide-x" style={{ color: T.inkSoft }}>
          {c.proof.items.map((item, i) => (
            <div key={i} className={clsx('flex items-center gap-2 text-sm', i > 0 && 'ps-10')}>
              <GlyphIcon emoji={item.icon} size={15} className="shrink-0" style={{ color: T.accent }} />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI PREVIEW (LOCKED / REDACTED) ──────────────────────── */}
      <section className="py-20 sm:py-28 px-4" style={{ background: T.paperRaised }}>
        <div className="max-w-2xl mx-auto">
          <p className={clsx(eyebrow, 'text-center mb-3')} style={{ color: T.inkFaint }}>
            AI Analysis
          </p>
          <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold text-center mb-2')} style={{ color: T.ink }}>
            {c.aiPreview.title}
          </h2>
          <p className="text-center mb-9" style={{ color: T.inkSoft }}>{c.aiPreview.sub}</p>

          <div className="flex flex-col gap-2 mb-7">
            {c.aiPreview.bullets.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-[3px] border"
                style={{ background: T.paper, borderColor: T.line }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 font-mono"
                  style={{ background: T.accentSoft, color: T.accent }}
                >
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: T.inkSoft }}>{b}</span>
              </div>
            ))}
          </div>

          <div className="relative rounded-[4px] overflow-hidden border" style={{ borderColor: T.lineStrong }}>
            <div className={clsx('p-6 space-y-1', locked && 'select-none pointer-events-none')}>
              {c.aiPreview.blurItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: T.line }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono"
                    style={{ background: T.accentSoft, color: T.accent }}
                  >
                    {i + 1}
                  </span>
                  {/* redaction bar rather than blur — reads as document, not a paywall trick */}
                  <span
                    className="h-3.5 rounded-sm flex-1 mt-1"
                    style={{ background: T.ink, opacity: 0.86, maxWidth: `${72 - i * 6}%` }}
                  />
                </div>
              ))}
            </div>

            {locked && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                style={{ background: 'rgba(247,244,236,0.9)', backdropFilter: 'blur(2px)' }}
              >
                <div
                  className="absolute top-4 right-4 rotate-[8deg] font-mono text-[10px] tracking-[0.2em] uppercase px-2 py-1 border rounded-sm"
                  style={{ borderColor: T.brick, color: T.brick }}
                >
                  Redacted
                </div>
                <div
                  className="w-12 h-12 rounded-full border flex items-center justify-center mb-4"
                  style={{ borderColor: T.lineStrong, background: T.paperRaised }}
                >
                  <Icon token="lock" size={20} style={{ color: T.ink }} />
                </div>
                <p className={clsx(serif, 'font-semibold text-lg mb-1')} style={{ color: T.ink }}>{c.aiPreview.lockTitle}</p>
                <p className="text-sm mb-5 max-w-xs" style={{ color: T.inkSoft }}>{c.aiPreview.lockSub}</p>
                <button
                  onClick={() => handleCTA()}
                  className="px-6 py-3 rounded-[3px] font-semibold text-sm transition-all hover:-translate-y-0.5"
                  style={{ background: T.ink, color: T.paper }}
                >
                  {c.aiPreview.lockCta}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── DOCUMENT AI ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4" style={{ background: T.paper }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className={clsx(eyebrow, 'mb-4')} style={{ color: T.accent }}>{c.docAI.badge}</p>
            <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold mb-4 leading-snug')} style={{ color: T.ink }}>
              {c.docAI.title}
            </h2>
            <p className="mb-6 leading-relaxed" style={{ color: T.inkSoft }}>{c.docAI.sub}</p>
            <ul className="space-y-2.5 mb-8">
              {c.docAI.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: T.inkSoft }}>
                  <Icon token="arrow" size={14} style={{ color: T.accent }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCTA()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-[3px] font-semibold text-sm border transition-all inline-flex items-center gap-2"
              style={{ borderColor: T.lineStrong, color: T.ink, background: T.paperRaised }}
            >
              <Icon token="doc" size={16} />
              {c.docAI.cta}
            </button>
          </div>

          {/* Doc card mockup */}
          <div className="relative rounded-[4px] p-6 border overflow-hidden" style={{ background: T.paperRaised, borderColor: T.line }}>
            <div
              className="absolute left-0 right-0 h-16 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, transparent, rgba(32,75,59,0.10), transparent)', animation: 'scanline 3.2s linear infinite' }}
            />
            <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: T.line }}>
              <div className="w-9 h-9 rounded-[3px] flex items-center justify-center" style={{ background: T.accentSoft }}>
                <Icon token="doc" size={18} style={{ color: T.accent }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: T.ink }}>bank_statement_oct.pdf</p>
                <p className="text-[11px] flex items-center gap-1.5" style={{ color: T.accent }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                  AI Analysis Complete
                </p>
              </div>
            </div>
            {[
              { label: 'Document Type', value: 'Bank Statement' },
              { label: 'Total Exposure', value: 'AED 48,500', gold: true },
              { label: 'Outstanding Loan', value: 'AED 32,200' },
              { label: 'Risk Level', value: 'HIGH', red: true },
              { label: 'Next Step', value: 'File formal dispute within 14 days', small: true },
            ].map((row, i) => (
              <div key={i} className={clsx('flex justify-between items-start gap-3 py-2.5', i < 4 && 'border-b')} style={{ borderColor: T.line }}>
                <span className="font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: T.inkFaint }}>
                  {row.label}
                </span>
                <span
                  className={clsx('text-end', row.gold && 'font-semibold text-sm', row.small && 'text-[11px] max-w-[150px]')}
                  style={
                    row.red
                      ? { color: T.brick, fontSize: 11, fontWeight: 700, background: T.brickSoft, padding: '2px 8px', borderRadius: 999 }
                      : row.gold
                        ? { color: T.accent }
                        : { color: T.inkSoft, fontSize: row.small ? 11 : 14 }
                  }
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 border-y" style={{ borderColor: T.line, background: T.paperRaised }}>
        <div className="max-w-4xl mx-auto">
          <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold text-center mb-2')} style={{ color: T.ink }}>
            {c.how.title}
          </h2>
          <p className="text-center mb-14 max-w-xl mx-auto" style={{ color: T.inkSoft }}>{c.how.subtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {c.how.steps.map((step, i) => (
              <div key={i} className="relative">
                {i < c.how.steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-6 start-[calc(50%+30px)] end-[-calc(50%-30px)] h-px"
                    style={{ background: T.lineStrong }}
                  />
                )}
                <div className="flex flex-col items-center text-center">
                  <div
                    className={clsx(serif, 'w-12 h-12 rounded-full border flex items-center justify-center mb-4 font-semibold text-lg')}
                    style={{ borderColor: T.lineStrong, background: T.paper, color: T.ink }}
                  >
                    {step.num}
                  </div>
                  <p className="font-semibold mb-2" style={{ color: T.ink }}>{step.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: T.inkSoft }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {c.how.callout && (
            <div className="mt-12 p-5 rounded-[4px] border text-center" style={{ background: T.accentSoft, borderColor: T.accentSoft2 }}>
              <p className="text-sm" style={{ color: T.ink }}>
                <strong>{c.how.callout}</strong>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── EXECUTION / PROFESSIONALS ───────────────────────────── */}
      <section className="py-20 sm:py-28 px-4" style={{ background: T.paper }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold mb-2')} style={{ color: T.ink }}>
            {c.execution.title}
          </h2>
          <p className="mb-14" style={{ color: T.inkSoft }}>{c.execution.sub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {c.execution.roles.map((role, i) => (
              <div
                key={i}
                className="relative text-start rounded-[4px] p-6 border transition-all hover:-translate-y-1 overflow-hidden"
                style={{ background: T.paperRaised, borderColor: T.line }}
              >
                <span className="absolute -top-px left-6 w-10 h-1.5 rounded-b-[2px]" style={{ background: T.accent }} />
                <Icon token={EMOJI_TOKEN[role.icon]} size={26} className="mb-4" style={{ color: T.ink }} />
                <p className="font-bold mb-2" style={{ color: T.ink }}>{role.title}</p>
                <p className="text-sm" style={{ color: T.inkSoft }}>{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 border-y" style={{ borderColor: T.line, background: T.paperRaised }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className={clsx(eyebrow, 'mb-4')} style={{ color: T.accent }}>{c.pricing.badge}</p>
            <h2 className={clsx(serif, 'text-3xl sm:text-4xl font-semibold mb-2')} style={{ color: T.ink }}>
              {c.pricing.title}
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: T.inkSoft }}>{c.pricing.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.pricing.tiers.map((tier) => {
              const dark = tier.highlighted
              return (
                <div
                  key={tier.id}
                  className="relative rounded-[4px] p-5 border flex flex-col transition-all"
                  style={
                    dark
                      ? { background: T.ink, borderColor: T.ink, color: T.paper }
                      : { background: T.paper, borderColor: T.line, color: T.ink }
                  }
                >
                  {dark && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: T.accent, color: T.paper }}
                    >
                      {c.pricing.popularLabel}
                    </div>
                  )}
                  <h3 className="text-sm font-semibold mb-1">{tier.name}</h3>
                  <p className="text-xs mb-4 min-h-[2.5rem]" style={{ color: dark ? 'rgba(247,244,236,0.6)' : T.inkFaint }}>
                    {tier.desc}
                  </p>
                  <div className="mb-4">
                    <p className={clsx(serif, 'text-3xl font-semibold')}>{tier.price ? tier.price : 'Free'}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: dark ? 'rgba(247,244,236,0.5)' : T.inkFaint }}>
                      {tier.priceLabel}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs" style={{ color: dark ? 'rgba(247,244,236,0.75)' : T.inkSoft }}>
                        <Icon token="check" size={12} className="shrink-0 mt-0.5" style={{ color: dark ? T.paper : T.accent }} />
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCTA()}
                    className="w-full py-2.5 rounded-[3px] font-semibold text-sm transition-all hover:-translate-y-0.5"
                    style={
                      dark
                        ? { background: T.paper, color: T.ink }
                        : { border: `1px solid ${T.lineStrong}`, color: T.ink }
                    }
                  >
                    {tier.cta}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-8 max-w-3xl mx-auto p-5 rounded-[4px] border" style={{ background: T.paper, borderColor: T.line }}>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: T.ink }}>
              <Icon token="lock" size={14} style={{ color: T.accent }} />
              {c.pricing.monetizationTitle}
            </h4>
            <p className="text-xs leading-relaxed mb-3" style={{ color: T.inkSoft }}>{c.pricing.monetizationText}</p>
            <div className="flex items-start gap-2 p-3 rounded-[3px] border" style={{ background: T.accentSoft, borderColor: T.accentSoft2 }}>
              <Icon token="warn" size={14} className="shrink-0 mt-0.5" style={{ color: T.accent }} />
              <p className="text-[11px] leading-relaxed" style={{ color: T.ink }}>{c.pricing.monetizationNote}</p>
            </div>
          </div>

          {c.pricing.disclaimer && (
            <div className="mt-6 text-center">
              <p className="text-[11px] max-w-xl mx-auto leading-relaxed" style={{ color: T.inkFaint }}>
                {c.pricing.disclaimer}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── WHATSAPP ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4" style={{ background: T.paper }}>
        <div className="max-w-lg mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: T.wa }}
          >
            <WAIcon size={28} />
          </div>
          <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold mb-2')} style={{ color: T.ink }}>
            {c.whatsapp.title}
          </h2>
          <p className="mb-6" style={{ color: T.inkSoft }}>{c.whatsapp.sub}</p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-[3px] font-bold text-base transition-all hover:-translate-y-0.5"
            style={{ background: T.wa, color: '#0B2015' }}
          >
            <WAIcon size={22} />
            {c.whatsapp.cta}
          </a>
          <p className="text-xs mt-4" style={{ color: T.inkFaint }}>{c.whatsapp.note}</p>
        </div>
      </section>

      {/* ── FOR LAWYERS ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 border-y" style={{ borderColor: T.line, background: T.paperRaised }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className={clsx(eyebrow, 'mb-4 inline-flex items-center gap-2')} style={{ color: T.accent }}>
              <Icon token="gov" size={13} />
              {c.lawyers.badge}
            </p>
            <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold mb-2')} style={{ color: T.ink }}>
              {c.lawyers.title}
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: T.inkSoft }}>{c.lawyers.sub}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="relative rounded-[4px] p-5 border overflow-hidden" style={{ background: T.paper, borderColor: T.line }}>
              <span className="absolute -top-px left-5 w-8 h-1.5 rounded-b-[2px]" style={{ background: T.accent }} />
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.ink }}>
                <Icon token="check" size={14} style={{ color: T.accent }} />
                {c.lawyers.sendTitle}
              </h3>
              <ul className="space-y-3">
                {c.lawyers.sendItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: T.inkSoft }}>
                    <Icon token="check" size={13} className="shrink-0 mt-1" style={{ color: T.accent }} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-[4px] p-5 border overflow-hidden" style={{ background: T.paper, borderColor: T.line }}>
              <span className="absolute -top-px left-5 w-8 h-1.5 rounded-b-[2px]" style={{ background: T.brick }} />
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: T.ink }}>
                <Icon token="warn" size={14} style={{ color: T.brick }} />
                {c.lawyers.dontTitle}
              </h3>
              <ul className="space-y-3">
                {c.lawyers.dontItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: T.inkSoft }}>
                    <span className="shrink-0 mt-1 text-xs" style={{ color: T.brick }}>✕</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-[4px] mb-6 border" style={{ background: T.accentSoft, borderColor: T.accentSoft2 }}>
            <div className="flex items-start gap-3">
              <Icon token="scale" size={17} className="shrink-0" style={{ color: T.accent }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: T.ink }}>{c.lawyers.complianceLabel}</p>
                <p className="text-xs leading-relaxed" style={{ color: T.inkSoft }}>{c.lawyers.complianceText}</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm mb-4 max-w-lg mx-auto" style={{ color: T.inkSoft }}>{c.lawyers.onboardingText}</p>
            <a
              href="mailto:partners@expatuae.kafeely.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[3px] font-semibold text-sm border transition-all"
              style={{ borderColor: T.lineStrong, color: T.ink }}
            >
              {c.lawyers.applyCta}
              <Icon token="arrow" size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4" style={{ background: T.paper }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className={eyebrow} style={{ color: T.accent }}>{c.faq.badge}</p>
            <h2 className={clsx(serif, 'text-2xl sm:text-3xl font-semibold mt-2')} style={{ color: T.ink }}>
              {c.faq.title}
            </h2>
          </div>
          <div>
            {c.faq.items.map((faq, i) => (
              <details key={i} className="group border-b" style={{ borderColor: T.line }}>
                <summary className="flex items-center justify-between gap-3 py-5 cursor-pointer text-sm font-medium list-none" style={{ color: T.ink }}>
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs" style={{ color: T.inkFaint }}>{String(i + 1).padStart(2, '0')}</span>
                    {faq.q}
                  </span>
                  <span className="shrink-0 group-open:rotate-45 transition-transform text-lg font-light" style={{ color: T.inkFaint }}>+</span>
                </summary>
                <div className="pb-5 ps-8 text-sm leading-relaxed" style={{ color: T.inkSoft }}>{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ───────────────────────────────────────────────── */}
      <section className="py-12 px-4 border-y" style={{ borderColor: T.line, background: T.paperRaised }}>
        <div className="max-w-3xl mx-auto">
          <p className={clsx(eyebrow, 'text-center mb-6')} style={{ color: T.inkFaint }}>{c.trust.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {c.trust.items.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-[3px] border text-center" style={{ borderColor: T.line, background: T.paper }}>
                <GlyphIcon emoji={item.icon} size={20} style={{ color: T.accent }} />
                <span className="text-xs leading-tight" style={{ color: T.inkSoft }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-10 px-4" style={{ background: T.ink, color: T.paper }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[3px] flex items-center justify-center font-display font-bold text-xs" style={{ background: T.paper, color: T.ink }}>
                E
              </div>
              <span className="font-semibold">{c.nav.brand}</span>
            </div>
            <div className="flex gap-5">
              {c.footer.links.map((l, i) => (
                <a key={i} href="#" className="text-sm transition-colors" style={{ color: 'rgba(247,244,236,0.4)' }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-[3px]" style={{ background: 'rgba(247,244,236,0.06)', border: '1px solid rgba(247,244,236,0.12)' }}>
            <Icon token="scale" size={15} className="shrink-0" style={{ color: 'rgba(247,244,236,0.5)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(247,244,236,0.45)' }}>{c.footer.disclaimer}</p>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: 'rgba(247,244,236,0.25)' }}>
            © 2026 {c.nav.brand}. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── STICKY BOTTOM BAR ───────────────────────────────────── */}
      <div
        className={clsx(
          'fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t px-4 py-3 flex items-center justify-between gap-3 transition-transform duration-500',
          scrolled ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ background: 'rgba(24,22,17,0.96)', borderColor: 'rgba(247,244,236,0.1)' }}
      >
        <p className="text-sm hidden sm:block" style={{ color: 'rgba(247,244,236,0.55)' }}>
          Not sure where to start? Try the free assessment.
        </p>
        <div className="flex items-center gap-2 ms-auto">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-sm font-medium transition-all"
            style={{ background: 'rgba(37,211,102,0.12)', color: T.wa, border: '1px solid rgba(37,211,102,0.3)' }}
          >
            <WAIcon size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={() => handleCTA()}
            className="px-5 py-2.5 rounded-[3px] font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: T.paper, color: T.ink }}
          >
            {c.sticky}
          </button>
        </div>
      </div>

      {/* ── FLOATING WHATSAPP ───────────────────────────────────── */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={clsx(
          'fixed z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all',
          scrolled ? 'bottom-20' : 'bottom-6',
          isRTL ? 'left-4 sm:left-6' : 'right-4 sm:right-6',
        )}
        style={{ background: T.wa, animation: 'float 3s ease-in-out infinite' }}
      >
        <WAIcon size={26} />
      </a>
    </div>
  )
}

export default LandingPage
