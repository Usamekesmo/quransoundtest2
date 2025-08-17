// =================================================================================
//  ملف الإعدادات (config.js)
// =================================================================================

/**
 * نقاط النهاية للواجهات البرمجية (APIs)
 */
export const API_ENDPOINTS = {
    pageText: (page) => `https://api.alquran.cloud/v1/page/${page}/quran-uthmani`,
    // [تعديل] جعل رابط الصوت ديناميكياً
    pageAudio: (page, reciterId ) => `https://api.alquran.cloud/v1/page/${page}/${reciterId}`,
    tafsir: (surah, ayah ) => `https://api.quran.com/api/v4/quran/tafsirs/1?verse_key=${surah}:${ayah}`
};

/**
 * [جديد] إعدادات القراء
 */
export const RECITERS = {
    "ar.alafasy": "مشاري العفاسي",
    "ar.husary": "محمود خليل الحصري",
    "ar.sudais": "عبدالرحمن السديس",
    "ar.minshawi": "محمد صديق المنشاوي"
};

/**
 * [جديد] إعدادات نظام التكرار المتباعد (SRS )
 * الفترات بالايام. المستوى 0 يعني المراجعة غداً.
 */
export const SRS_CONFIG = {
    // الفاصل الزمني للمراجعة القادمة بالايام لكل مستوى
    intervals: [1, 3, 7, 14, 30, 60, 120, 240] // 8 مستويات
};

/**
 * إعدادات الاختبار
 */
export const QUIZ_CONFIG = {
    defaultQuestionsCount: 10,
    // [تعديل] درجة النجاح لرفع مستوى الـ SRS
    srsPromotionThreshold: 8, // إذا كانت النتيجة 8 أو أكثر، يرتفع المستوى
    questionTypes: [
        'chooseNext', 
        'choosePrevious', 
        'locateAyah', 
        'completeAyah', 
        'completeLastWord', 
        'linkStartEnd'
    ]
};

/**
 * نظام التحفيز والتقدم
 */
export const MOTIVATION_CONFIG = {
    levels: [0, 100, 250, 500, 1000, 2000, 5000, 10000],
    titles: ["حافظ ناشئ", "حافظ مجتهد", "حافظ متقدم", "حافظ متقن", "نجم الحفظ", "سيد الحفاظ", "إمام الحفاظ"],
    achievements: {
        firstTest: { id: 'firstTest', title: 'الحافظ الجديد', desc: 'أكمل أول اختبار لك بنجاح.', unlocked: false },
        tenTests: { id: 'tenTests', title: 'المثابر', desc: 'أكمل 10 اختبارات.', unlocked: false },
        perfectScore: { id: 'perfectScore', title: 'المتقِن', desc: 'حقق الدرجة الكاملة في أي اختبار.', unlocked: false },
        fivePerfect: { id: 'fivePerfect', title: 'نجم الحفظ', desc: 'حقق الدرجة الكاملة في 5 صفحات مختلفة.', unlocked: false },
        sendChallenge: { id: 'sendChallenge', title: 'المتحدي', desc: 'أرسل تحدياً إلى صديق.', unlocked: false }
    },
    dailyRewards: [
        { type: 'xp', value: 50, text: "لقد حصلت على 50 نقطة خبرة إضافية!" },
        { type: 'info', text: "معلومة: أطول سورة في القرآن هي سورة البقرة." }
    ],
    motivationalMessages: {
        comeback: "أهلاً بعودتك! سعداء برؤيتك مجدداً. لنكمل رحلة المراجعة.",
        perfectScore: "ما شاء الله! درجة كاملة! هذا إتقان حقيقي.",
        newBest: "تقدم ملحوظ ومبارك. استمر على هذا المنوال.",
        struggle: "لا بأس، كل الحفاظ يمرون بهذه المرحلة. خذ نفساً عميقاً وأكمل."
    }
};
