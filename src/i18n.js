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
        privacy: "Privacy",
        deleteAccount: "Delete Account",
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
        deleteAccountLink: "Account and data deletion",
      },
      deleteAccount: {
        badge: "Account Deletion",
        title: "SawaSwap Account and Data Deletion",
        intro:
          "Users can request deletion of their SawaSwap account and associated data by emailing us at support@sawaswap.com from the email address used in the app.",
        emailInstruction:
          "Send your request from the same email address used for your SawaSwap account.",
        subjectLabel: "Email subject",
        subjectValue: "Delete my SawaSwap account",
        includeLabel: "Please include",
        includeValue: "Your SawaSwap account email in the message.",
        deletedTitle: "When your account is deleted, we delete:",
        items: [
          "Profile information",
          "Item listings",
          "Uploaded item photos",
          "Likes",
          "Skips",
          "Matches",
          "Chat messages associated with your account",
        ],
        retentionTitle: "Limited retention",
        retentionBody:
          "Some limited data may be kept for a short period if required for security, fraud prevention, legal, or technical backup reasons. Deletion requests are processed as quickly as possible.",
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
      privacy: {
        badge: "Privacy",
        title: "Privacy Policy",
        updated: "Last updated: May 13, 2026",
        intro:
          "This Privacy Policy explains how SawaSwap collects, uses, stores, and shares personal data when you use our website, mobile app, and support channels. It is written to reflect the main features of SawaSwap, including account creation, item listings, matching, messaging, and support requests.",
        sections: [
          {
            title: "1. Who this policy applies to",
            body: "This policy applies to people who visit the SawaSwap website, create an account, browse or post listings, swipe or match with offers, send messages, or contact support. By using SawaSwap, you understand that some personal data is required for the service to work safely and correctly.",
          },
          {
            title: "2. Information we collect",
            body: "We may collect information you provide directly, such as your name, email address, phone number if requested in the app, profile details, city, item descriptions, images, pricing or swap preferences, account credentials, messages sent through the platform, and any information you include when contacting support. If you choose to create or update a listing with a photo, the app may access your camera so you can take pictures of items you want to trade, buy, or sell.",
          },
          {
            title: "3. Information collected automatically",
            body: "We may automatically collect technical and usage information such as device type, operating system, app version, browser type, language, IP address, approximate location derived from your network or selected city, log data, and actions taken in the app such as viewing listings, creating offers, matching, or reporting content.",
          },
          {
            title: "4. How we use your information",
            body: "We use personal data to create and manage accounts, display profiles and listings, enable matching and chat features, improve search and relevance, respond to support requests, send important service notices, detect abuse or fraud, enforce platform rules, maintain security, and improve the performance and reliability of SawaSwap. Camera access is used only to let users capture photos for item listings inside the app.",
          },
          {
            title: "5. Listings, profiles, and chat visibility",
            body: "Because SawaSwap is a marketplace service, some information is visible to other users as part of the product. This may include your profile name, city, item photos, item descriptions, offer details, and messages you choose to send to matched or contacted users. Please avoid sharing sensitive information in listings or chat unless it is necessary and you trust the recipient.",
          },
          {
            title: "6. Legal and safety reasons for processing",
            body: "We process information because it is necessary to provide the service you request, communicate with you, protect users, investigate abuse, comply with applicable legal obligations, and support our legitimate interest in running a secure item marketplace.",
          },
          {
            title: "7. When we share information",
            body: "We do not sell personal data. We may share information with service providers that support hosting, analytics, communications, moderation, security, or customer support, and with law enforcement or regulators when required by law or when reasonably necessary to protect users, resolve fraud, or enforce our terms.",
          },
          {
            title: "8. Data retention",
            body: "We keep personal data for as long as needed to operate your account, provide marketplace features, resolve disputes, investigate safety issues, comply with legal obligations, and maintain internal records. Some data may remain in backups or security logs for a limited period even after account deletion or content removal.",
          },
          {
            title: "9. Your choices and rights",
            body: "You may be able to update profile details, edit or remove listings, and stop using the service at any time. You can also contact us to request access, correction, deletion, or clarification regarding your personal data, subject to legal, security, and operational limits that may require us to keep certain records.",
          },
          {
            title: "10. Security",
            body: "We use reasonable technical and organizational measures to protect personal data, but no online service can guarantee absolute security. You are responsible for keeping your password secure, using trusted devices, and reporting suspected unauthorized access to your account.",
          },
          {
            title: "11. Camera permission",
            body: "SawaSwap requests camera permission so users can take photos of items they want to trade, buy, or sell. The camera is used only when you choose to capture a photo for a listing or related in-app flow, and it is not used for background recording.",
          },
          {
            title: "12. Children's privacy",
            body: "SawaSwap is not intended for children who are not legally allowed to use marketplace services in their jurisdiction. If we learn that personal data was provided by a child in violation of applicable rules, we may remove the account or related content.",
          },
          {
            title: "13. International processing",
            body: "SawaSwap may use service providers or technical infrastructure located in more than one country. By using the service, you understand that your information may be processed or stored in countries that have different data protection rules than your place of residence.",
          },
          {
            title: "14. Updates to this Privacy Policy",
            body: "We may update this Privacy Policy from time to time to reflect product changes, legal requirements, or security practices. The updated version will be posted on this page with a revised effective date.",
          },
          {
            title: "15. Contact us",
            body: "For privacy questions, requests, or complaints, contact SawaSwap at support@sawaswap.com. General product emails may also come from no-reply@sawaswap.com.",
          },
        ],
      },
      footer: {
        text: "Good for you. Good for the community.",
      },
      verified: {
        badge: "Email verified",
        title: "You're verified!",
        text: "Your SawaSwap account email has been confirmed successfully. You can now return to the app and start trading, selling, buying, and matching safely.",
        home: "Back to home",
        support: "Need help?",
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
        privacy: "الخصوصية",
        deleteAccount: "حذف الحساب",
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
        deleteAccountLink: "حذف الحساب والبيانات",
      },
      deleteAccount: {
        badge: "حذف الحساب",
        title: "حذف حساب وبيانات SawaSwap",
        intro:
          "يمكن للمستخدمين طلب حذف حسابهم في SawaSwap والبيانات المرتبطة به عبر مراسلتنا على support@sawaswap.com من نفس البريد الإلكتروني المستخدم داخل التطبيق.",
        emailInstruction:
          "أرسل طلب الحذف من نفس عنوان البريد الإلكتروني المستخدم في حساب SawaSwap.",
        subjectLabel: "عنوان الرسالة",
        subjectValue: "Delete my SawaSwap account",
        includeLabel: "يرجى تضمين",
        includeValue: "البريد الإلكتروني المرتبط بحسابك في SawaSwap داخل الرسالة.",
        deletedTitle: "عند حذف الحساب، نقوم بحذف:",
        items: [
          "معلومات الملف الشخصي",
          "منشورات العناصر",
          "صور العناصر المرفوعة",
          "الإعجابات",
          "عمليات التخطي",
          "المطابقات",
          "رسائل المحادثة المرتبطة بحسابك",
        ],
        retentionTitle: "احتفاظ محدود ببعض البيانات",
        retentionBody:
          "قد يتم الاحتفاظ بقدر محدود من البيانات لفترة قصيرة إذا كان ذلك مطلوباً لأسباب أمنية أو لمنع الاحتيال أو للامتثال القانوني أو لأسباب النسخ الاحتياطي التقنية. تتم معالجة طلبات الحذف بأسرع وقت ممكن.",
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
      privacy: {
        badge: "الخصوصية",
        title: "سياسة الخصوصية",
        updated: "آخر تحديث: 13 مايو 2026",
        intro:
          "توضح سياسة الخصوصية هذه كيفية قيام SawaSwap بجمع البيانات الشخصية واستخدامها وتخزينها ومشاركتها عند استخدامك للموقع الإلكتروني أو التطبيق أو قنوات الدعم. تمت صياغة هذه السياسة بما يعكس الوظائف الرئيسية في SawaSwap مثل إنشاء الحسابات، نشر الأغراض، المطابقة، المحادثة، وطلبات الدعم.",
        sections: [
          {
            title: "1. على من تنطبق هذه السياسة",
            body: "تنطبق هذه السياسة على زوار موقع SawaSwap، والمستخدمين الذين ينشئون حساباً، أو يتصفحون المنشورات، أو ينشرون أغراضاً، أو يجرون المطابقة، أو يرسلون رسائل، أو يتواصلون مع الدعم. باستخدامك لـ SawaSwap فأنت تدرك أن بعض البيانات الشخصية مطلوبة ليعمل التطبيق بشكل آمن وصحيح.",
          },
          {
            title: "2. المعلومات التي نجمعها",
            body: "قد نجمع المعلومات التي تقدمها لنا مباشرة، مثل الاسم، البريد الإلكتروني، رقم الهاتف إذا كان مطلوباً داخل التطبيق، تفاصيل الملف الشخصي، المدينة، وصف الغرض، الصور، السعر أو تفضيلات التبديل، بيانات تسجيل الدخول، الرسائل المرسلة عبر المنصة، وأي معلومات ترسلها عند التواصل مع الدعم. وإذا اخترت إنشاء منشور أو تحديثه بصورة جديدة، فقد يطلب التطبيق الوصول إلى الكاميرا حتى تتمكن من التقاط صور للأغراض التي تريد تبديلها أو بيعها أو شراءها.",
          },
          {
            title: "3. المعلومات التي يتم جمعها تلقائياً",
            body: "قد نجمع تلقائياً معلومات تقنية ومعلومات استخدام مثل نوع الجهاز، نظام التشغيل، إصدار التطبيق، نوع المتصفح، اللغة، عنوان IP، الموقع التقريبي المستنتج من الشبكة أو من المدينة التي تختارها، بيانات السجل، والإجراءات التي تتم داخل التطبيق مثل مشاهدة المنشورات، إنشاء العروض، المطابقة، أو الإبلاغ عن المحتوى.",
          },
          {
            title: "4. كيف نستخدم معلوماتك",
            body: "نستخدم البيانات الشخصية لإنشاء الحسابات وإدارتها، عرض الملفات الشخصية والمنشورات، تشغيل ميزات المطابقة والمحادثة، تحسين البحث وملاءمة النتائج، الرد على طلبات الدعم، إرسال الإشعارات المهمة المتعلقة بالخدمة، اكتشاف إساءة الاستخدام أو الاحتيال، تطبيق قواعد المنصة، الحفاظ على الأمان، وتحسين أداء وموثوقية SawaSwap. ويُستخدم الوصول إلى الكاميرا فقط لتمكين المستخدم من التقاط صور للأغراض داخل التطبيق.",
          },
          {
            title: "5. ظهور المنشورات والملفات الشخصية والمحادثات",
            body: "بما أن SawaSwap خدمة سوق إلكتروني، فإن بعض المعلومات تظهر للمستخدمين الآخرين كجزء من الخدمة. قد يشمل ذلك اسم الملف الشخصي، المدينة، صور الأغراض، وصفها، تفاصيل العرض، والرسائل التي تختار إرسالها إلى المستخدمين الذين تمت مطابقتهم معك أو تواصلت معهم. يرجى تجنب مشاركة المعلومات الحساسة في المنشورات أو المحادثات إلا عند الضرورة ومع من تثق به.",
          },
          {
            title: "6. الأساس التشغيلي والأمني لمعالجة البيانات",
            body: "نعالج المعلومات لأن ذلك ضروري لتقديم الخدمة التي تطلبها، والتواصل معك، وحماية المستخدمين، والتحقيق في إساءة الاستخدام، والامتثال للالتزامات القانونية المعمول بها، ودعم مصلحتنا المشروعة في تشغيل سوق آمن لتبادل الأغراض.",
          },
          {
            title: "7. متى نشارك المعلومات",
            body: "نحن لا نبيع البيانات الشخصية. قد نشارك المعلومات مع مزودي الخدمات الذين يدعمون الاستضافة، التحليلات، الاتصالات، الإشراف، الأمان، أو خدمة العملاء، وكذلك مع الجهات الرسمية أو التنظيمية عندما يفرض القانون ذلك أو عندما يكون ضرورياً بشكل معقول لحماية المستخدمين أو معالجة الاحتيال أو تطبيق الشروط.",
          },
          {
            title: "8. الاحتفاظ بالبيانات",
            body: "نحتفظ بالبيانات الشخصية طالما كان ذلك ضرورياً لتشغيل حسابك، وتقديم ميزات السوق، وحل النزاعات، والتحقيق في مسائل السلامة، والامتثال للالتزامات القانونية، والاحتفاظ بالسجلات الداخلية. وقد تبقى بعض البيانات في النسخ الاحتياطية أو سجلات الأمان لفترة محدودة حتى بعد حذف الحساب أو إزالة المحتوى.",
          },
          {
            title: "9. خياراتك وحقوقك",
            body: "قد تتمكن من تحديث بيانات الملف الشخصي، وتعديل المنشورات أو حذفها، والتوقف عن استخدام الخدمة في أي وقت. ويمكنك أيضاً التواصل معنا لطلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها أو طلب توضيح بشأنها، وذلك مع مراعاة الحدود القانونية والأمنية والتشغيلية التي قد تلزمنا بالاحتفاظ ببعض السجلات.",
          },
          {
            title: "10. الأمان",
            body: "نستخدم تدابير تقنية وتنظيمية معقولة لحماية البيانات الشخصية، لكن لا توجد خدمة عبر الإنترنت تضمن أماناً مطلقاً. أنت مسؤول عن الحفاظ على سرية كلمة المرور، واستخدام أجهزة موثوقة، وإبلاغنا إذا اشتبهت في وصول غير مصرح به إلى حسابك.",
          },
          {
            title: "11. إذن الكاميرا",
            body: "يطلب SawaSwap إذن الكاميرا حتى يتمكن المستخدمون من التقاط صور للأغراض التي يريدون تبديلها أو شراءها أو بيعها. ولا يتم استخدام الكاميرا إلا عندما تختار التقاط صورة لمنشور أو ضمن تدفق مرتبط بذلك داخل التطبيق، ولا تُستخدم للتسجيل في الخلفية.",
          },
          {
            title: "12. خصوصية الأطفال",
            body: "SawaSwap غير مخصص للأطفال غير المسموح لهم قانونياً باستخدام خدمات الأسواق الإلكترونية في نطاقهم القانوني. وإذا علمنا أن بيانات شخصية قُدمت من طفل بما يخالف القواعد المعمول بها، فقد نقوم بإزالة الحساب أو المحتوى المرتبط به.",
          },
          {
            title: "13. المعالجة الدولية للبيانات",
            body: "قد يستخدم SawaSwap مزودي خدمات أو بنية تقنية موجودة في أكثر من دولة. باستخدامك للخدمة فأنت تدرك أن معلوماتك قد تتم معالجتها أو تخزينها في دول تختلف قواعد حماية البيانات فيها عن قواعد بلد إقامتك.",
          },
          {
            title: "14. تحديثات سياسة الخصوصية",
            body: "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس تغييرات المنتج أو المتطلبات القانونية أو الممارسات الأمنية. سيتم نشر النسخة المحدثة على هذه الصفحة مع تاريخ نفاذ جديد.",
          },
          {
            title: "15. التواصل معنا",
            body: "للاستفسارات أو الطلبات أو الشكاوى المتعلقة بالخصوصية، تواصل مع SawaSwap عبر support@sawaswap.com. وقد تصلك رسائل عامة متعلقة بالخدمة أيضاً من no-reply@sawaswap.com.",
          },
        ],
      },
      footer: {
        text: "جيد لك. جيد للمجتمع.",
      },
      verified: {
        badge: "تم تأكيد البريد",
        title: "تم التحقق بنجاح!",
        text: "تم تأكيد بريدك الإلكتروني في SawaSwap بنجاح. يمكنك الآن الرجوع إلى التطبيق والبدء بالتبديل والبيع والشراء والمطابقة بأمان.",
        home: "العودة للرئيسية",
        support: "تحتاج مساعدة؟",
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
