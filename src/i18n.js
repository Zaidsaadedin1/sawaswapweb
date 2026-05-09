import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        about: "About",
        support: "Support",
        terms: "Terms",
      },
      hero: {
        badge: "Swap • Buy • Sell Together",
        title: "Swap items with your community.",
        text: "SawaSwap is a simple item exchange app where users can post items, swipe through offers, match with others, and chat to complete exchanges.",
        cta: "Learn More",
        support: "Contact Support",
      },
      slider: {
        oneTitle: "Post your item",
        oneText:
          "Add photos, category, condition, city, price, and what you want in exchange.",
        twoTitle: "Swipe offers",
        twoText: "Swipe right to make an offer or swipe left to skip.",
        threeTitle: "Match and chat",
        threeText:
          "When you match with an item, open chat and agree on the deal.",
      },
      features: {
        title: "What you can do with SawaSwap",
        post: "Create buy, sell, or trade offers.",
        swipe: "Swipe through item cards.",
        filters: "Use categories and advanced filters.",
        matches: "See matches, skips, and offers.",
        chat: "Chat with matched users.",
        safe: "Manage your profile and posts securely.",
      },
      about: {
        badge: "About SawaSwap",
        title:
          "A community marketplace for swapping, buying, and selling items.",
        intro:
          "SawaSwap is built for people who want a simple and modern way to exchange useful items. Instead of leaving things unused, users can post them, discover other offers, match with people, and complete exchanges through chat.",
        missionTitle: "Our mission",
        mission:
          "Our mission is to make item exchange easier, more social, and more sustainable. SawaSwap helps communities reuse valuable items, reduce waste, and connect people who need what others already have.",
        whatTitle: "What SawaSwap supports",
        whatItems: [
          "Posting items with images, category, condition, location, and value.",
          "Creating buy, sell, or trade offers.",
          "Swiping through item cards to like or skip offers.",
          "Viewing matches, skipped items, and interested offers.",
          "Opening chat with matched users to agree on exchange details.",
          "Using advanced filters such as offer type, category, and sub-category.",
        ],
        safetyTitle: "Safety and responsibility",
        safety:
          "SawaSwap is a platform that helps users connect, but users are responsible for checking item details, agreeing on safe meeting arrangements, and following local laws. We recommend meeting in public places, reviewing items carefully, and avoiding suspicious requests.",
        communityTitle: "Good for you. Good for the community.",
        community:
          "Every successful swap gives an item a second life. SawaSwap encourages practical, local, and community-friendly exchange.",
      },
      support: {
        title: "Support",
        text: "Need help or want to report an issue? Contact us.",
        email: "support@sawaswap.com",
        noreply: "no-reply@sawaswap.com",
        location: "Jordan",
      },
      terms: {
        badge: "Legal",
        title: "Terms and Conditions",
        updated: "Last updated: May 2026",
        intro:
          "These Terms and Conditions explain the rules for using SawaSwap. By using our website or mobile app, you agree to follow these terms.",
        sections: [
          {
            title: "1. About SawaSwap",
            body: "SawaSwap is an item marketplace that allows users to post, discover, buy, sell, swap, match, and message other users. SawaSwap is not a party to the final agreement between users and does not own, inspect, or guarantee listed items.",
          },
          {
            title: "2. User accounts",
            body: "Users may need to create an account to post items, create offers, match, or send messages. You are responsible for keeping your login details secure and for all activity under your account.",
          },
          {
            title: "3. Listings and item information",
            body: "Users must provide accurate information about their items, including condition, images, location, and exchange expectations. Do not post fake, stolen, illegal, dangerous, or misleading items.",
          },
          {
            title: "4. Buying, selling, and swapping",
            body: "SawaSwap helps users communicate and agree on deals. The final exchange, payment, delivery, meeting, or inspection is handled directly between users. Users are responsible for confirming item quality and deal terms before completing any exchange.",
          },
          {
            title: "5. Messaging and matches",
            body: "Users may message each other after a match or offer. Messages must be respectful and must not include harassment, scams, threats, spam, or illegal activity.",
          },
          {
            title: "6. Prohibited activity",
            body: "You may not use SawaSwap to post illegal goods, counterfeit products, weapons, drugs, stolen items, adult services, financial scams, or any content that violates applicable laws or platform rules.",
          },
          {
            title: "7. Safety",
            body: "Meet in safe public places, inspect items before exchange, avoid sending money in suspicious situations, and report users or listings that appear unsafe or fraudulent.",
          },
          {
            title: "8. Account suspension",
            body: "We may remove listings, restrict features, or suspend accounts that violate these terms, harm other users, or create safety or legal risks.",
          },
          {
            title: "9. Limitation of responsibility",
            body: "SawaSwap provides tools for users to connect. We are not responsible for user behavior, item quality, payments, delivery, loss, damage, or disputes between users.",
          },
          {
            title: "10. Changes to these terms",
            body: "We may update these Terms and Conditions from time to time. Continued use of SawaSwap after updates means you accept the revised terms.",
          },
          {
            title: "11. Contact",
            body: "For support, questions, or reports, contact us at support@sawaswap.com.",
          },
        ],
      },
      footer: {
        text: "Good for you. Good for the community.",
      },
    },
  },
  ar: {
    translation: {
      nav: {
        home: "الرئيسية",
        about: "عن التطبيق",
        support: "الدعم",
        terms: "الشروط",
      },
      hero: {
        badge: "بدّل • اشتري • بيع معاً",
        title: "بدّل أغراضك مع مجتمعك.",
        text: "SawaSwap هو تطبيق بسيط لتبادل الأغراض، يتيح للمستخدمين نشر العناصر، تصفح العروض بالسحب، المطابقة مع الآخرين، والمحادثة لإتمام التبادل.",
        cta: "اعرف المزيد",
        support: "تواصل مع الدعم",
      },
      slider: {
        oneTitle: "انشر غرضك",
        oneText:
          "أضف الصور، التصنيف، الحالة، المدينة، السعر، وما الذي تريده بالمقابل.",
        twoTitle: "اسحب بين العروض",
        twoText: "اسحب لليمين لإنشاء عرض أو لليسار للتخطي.",
        threeTitle: "طابق وابدأ المحادثة",
        threeText: "عند المطابقة مع غرض، افتح المحادثة واتفق على التفاصيل.",
      },
      features: {
        title: "ماذا يمكنك أن تفعل في SawaSwap",
        post: "إنشاء عروض شراء أو بيع أو تبديل.",
        swipe: "تصفح العناصر بطريقة السحب.",
        filters: "استخدام التصنيفات والفلاتر المتقدمة.",
        matches: "مشاهدة المطابقات والتخطي والعروض.",
        chat: "المحادثة مع المستخدمين بعد المطابقة.",
        safe: "إدارة الملف الشخصي والمنشورات بأمان.",
      },
      about: {
        badge: "عن SawaSwap",
        title: "سوق مجتمعي للتبديل والبيع والشراء.",
        intro:
          "تم بناء SawaSwap للأشخاص الذين يريدون طريقة سهلة وحديثة لتبادل الأغراض المفيدة. بدلاً من ترك الأشياء بلا استخدام، يمكن للمستخدمين نشرها، اكتشاف عروض أخرى، المطابقة مع الآخرين، وإتمام التبادل من خلال المحادثة.",
        missionTitle: "مهمتنا",
        mission:
          "مهمتنا هي جعل تبادل الأغراض أسهل وأكثر اجتماعية واستدامة. يساعد SawaSwap المجتمعات على إعادة استخدام الأغراض القيّمة، تقليل الهدر، وربط الأشخاص الذين يحتاجون ما يملكه الآخرون.",
        whatTitle: "ماذا يدعم SawaSwap",
        whatItems: [
          "نشر الأغراض مع الصور، التصنيف، الحالة، الموقع، والقيمة.",
          "إنشاء عروض شراء أو بيع أو تبديل.",
          "تصفح بطاقات الأغراض بالسحب للإعجاب أو التخطي.",
          "مشاهدة المطابقات والعناصر المتخطاة والعروض المهتم بها.",
          "فتح المحادثة مع المستخدمين بعد المطابقة للاتفاق على التفاصيل.",
          "استخدام فلاتر متقدمة مثل نوع العرض والتصنيف الرئيسي والفرعي.",
        ],
        safetyTitle: "الأمان والمسؤولية",
        safety:
          "SawaSwap هو منصة تساعد المستخدمين على التواصل، لكن المستخدمين مسؤولون عن التحقق من تفاصيل الأغراض، الاتفاق على لقاء آمن، والالتزام بالقوانين المحلية. ننصح باللقاء في أماكن عامة، فحص الأغراض بعناية، وتجنب الطلبات المشبوهة.",
        communityTitle: "جيد لك. جيد للمجتمع.",
        community:
          "كل عملية تبديل ناجحة تمنح الغرض فرصة استخدام جديدة. SawaSwap يشجع التبادل المحلي العملي والمفيد للمجتمع.",
      },
      support: {
        title: "الدعم",
        text: "تحتاج مساعدة أو تريد الإبلاغ عن مشكلة؟ تواصل معنا.",
        email: "support@sawaswap.com",
        noreply: "no-reply@sawaswap.com",
        location: "الأردن",
      },
      terms: {
        badge: "قانوني",
        title: "الشروط والأحكام",
        updated: "آخر تحديث: مايو 2026",
        intro:
          "توضح هذه الشروط والأحكام قواعد استخدام SawaSwap. باستخدامك للموقع أو التطبيق، فإنك توافق على الالتزام بهذه الشروط.",
        sections: [
          {
            title: "1. عن SawaSwap",
            body: "SawaSwap هو سوق لتبادل الأغراض يتيح للمستخدمين نشر العناصر، اكتشاف العروض، الشراء، البيع، التبديل، المطابقة، ومراسلة المستخدمين. SawaSwap ليس طرفاً في الاتفاق النهائي بين المستخدمين ولا يملك أو يفحص أو يضمن الأغراض المعروضة.",
          },
          {
            title: "2. حسابات المستخدمين",
            body: "قد يحتاج المستخدم إلى إنشاء حساب لنشر الأغراض، إنشاء العروض، المطابقة، أو إرسال الرسائل. أنت مسؤول عن حماية بيانات تسجيل الدخول الخاصة بك وعن أي نشاط يتم من خلال حسابك.",
          },
          {
            title: "3. المنشورات ومعلومات الأغراض",
            body: "يجب على المستخدمين تقديم معلومات دقيقة عن الأغراض، بما في ذلك الحالة، الصور، الموقع، وما يتوقعونه بالمقابل. يمنع نشر أغراض وهمية أو مسروقة أو غير قانونية أو خطرة أو مضللة.",
          },
          {
            title: "4. الشراء والبيع والتبديل",
            body: "SawaSwap يساعد المستخدمين على التواصل والاتفاق على الصفقات. عملية التبادل أو الدفع أو التسليم أو اللقاء أو الفحص تتم مباشرة بين المستخدمين. المستخدمون مسؤولون عن التأكد من جودة الغرض وشروط الصفقة قبل إتمامها.",
          },
          {
            title: "5. الرسائل والمطابقات",
            body: "يمكن للمستخدمين مراسلة بعضهم بعد المطابقة أو إنشاء عرض. يجب أن تكون الرسائل محترمة وخالية من المضايقة، الاحتيال، التهديد، الرسائل المزعجة، أو أي نشاط غير قانوني.",
          },
          {
            title: "6. الأنشطة المحظورة",
            body: "لا يجوز استخدام SawaSwap لنشر سلع غير قانونية، منتجات مقلدة، أسلحة، مخدرات، أغراض مسروقة، خدمات للبالغين، عمليات احتيال مالية، أو أي محتوى يخالف القوانين أو قواعد المنصة.",
          },
          {
            title: "7. السلامة",
            body: "قابل الآخرين في أماكن عامة وآمنة، افحص الأغراض قبل التبادل، تجنب إرسال الأموال في حالات مشبوهة، وبلّغ عن المستخدمين أو المنشورات التي تبدو غير آمنة أو احتيالية.",
          },
          {
            title: "8. تعليق الحساب",
            body: "قد نقوم بإزالة المنشورات، تقييد بعض الميزات، أو تعليق الحسابات التي تخالف هذه الشروط أو تضر بالمستخدمين أو تسبب مخاطر قانونية أو أمنية.",
          },
          {
            title: "9. حدود المسؤولية",
            body: "SawaSwap يوفر أدوات لربط المستخدمين ببعضهم. نحن غير مسؤولين عن تصرفات المستخدمين، جودة الأغراض، المدفوعات، التسليم، الخسائر، الأضرار، أو النزاعات بين المستخدمين.",
          },
          {
            title: "10. تعديل الشروط",
            body: "قد نقوم بتحديث هذه الشروط والأحكام من وقت لآخر. استمرار استخدام SawaSwap بعد التحديث يعني قبولك للشروط المعدلة.",
          },
          {
            title: "11. التواصل",
            body: "للدعم أو الأسئلة أو البلاغات، تواصل معنا عبر support@sawaswap.com.",
          },
        ],
      },
      footer: {
        text: "جيد لك. جيد للمجتمع.",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
