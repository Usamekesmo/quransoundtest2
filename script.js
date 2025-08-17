// =================================================================================
//  رفيق الحفظ المتقدم - ملف الجافاسكريبت الرئيسي (v2 مع SRS والقراء)
// =================================================================================

// --- استيراد الإعدادات ---
import { API_ENDPOINTS, QUIZ_CONFIG, MOTIVATION_CONFIG, RECITERS, SRS_CONFIG } from './config.js';

// --- رابط الـ API ---
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzWZCatLoIr9kvpbbN8WNcAPS5bXO0Yxi40IZy9EwCHsVaz9D97MYpHgkyOCvi72F-k/exec'; // <-- الصق الرابط الخاص بك هنا

// --- 1. DOM Element Variables ---
// ... (لا تغيير هنا، كل المتغيرات كما هي )
const reciterSelect = document.getElementById('reciter-select'); // [جديد]

// --- 2. كائن الحالة الموحد ---
let AppState = {
    currentUser: null,
    // [تعديل] تقسيم بيانات المستخدم
    userData: {
        profile: null,
        settings: null,
        pages: {}
    },
    lastUsedName: localStorage.getItem('lastUserName'),
    theme: localStorage.getItem('theme') || 'light',
    pageData: { /* ... */ },
    currentQuiz: { /* ... */ }
};

// --- 3. Initialization ---
window.onload = async () => {
    // [جديد] ملء قائمة القراء
    for (const id in RECITERS) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = RECITERS[id];
        reciterSelect.appendChild(option);
    }
    reciterSelect.addEventListener('change', handleReciterChange);

    if (AppState.lastUsedName) {
        userNameInput.value = AppState.lastUsedName;
        await handleUserLogin(AppState.lastUsedName);
    }
    if (AppState.theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateAllUI();
};

// --- 4. Event Listeners ---
// ... (لا تغيير هنا)

// --- 5. Core User Data & UI Management ---

async function handleUserLogin(username) {
    if (!username) return;
    loader.classList.remove('hidden');
    AppState.currentUser = username;
    localStorage.setItem('lastUserName', username);

    const data = await getUserData(username);
    if (data) {
        AppState.userData = data;
    } else {
        // مستخدم جديد
        AppState.userData = {
            profile: {
                xp: 0, level: 1, lastTestDate: null, testsCompleted: 0,
                totalCorrect: 0, streak: 0, lastRewardDate: null,
                achievements: JSON.parse(JSON.stringify(MOTIVATION_CONFIG.achievements))
            },
            settings: {
                reciter: Object.keys(RECITERS)[0] // اختيار أول قارئ كافتراضي
            },
            pages: {}
        };
    }
    
    loader.classList.add('hidden');
    updateAllUI();
}

async function getUserData(username) {
    try {
        const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=getUserData&user=${encodeURIComponent(username)}`);
        const result = await response.json();
        if (result.status === "success") {
            return result.data;
        } else if (result.status === "not_found") {
            return null; // سيتم التعامل معه كمستخدم جديد
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("حدث خطأ أثناء جلب بياناتك.");
        return null;
    }
}

// [تعديل] دالة لحفظ بيانات الملف الشخصي والإعدادات
async function saveUserProfileAndSettings() {
    if (!AppState.currentUser) return;
    try {
        await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({
                action: 'saveUserData',
                userId: AppState.currentUser,
                data: {
                    profile: AppState.userData.profile,
                    settings: AppState.userData.settings
                }
            })
        });
    } catch (error) { console.error("Error saving profile:", error); }
}

// [جديد] دالة لحفظ بيانات صفحة معينة
async function savePageData(pageNumber, score, srsLevel, nextReviewDate) {
    if (!AppState.currentUser) return;
    // تحديث الحالة المحلية
    AppState.userData.pages[pageNumber] = {
        ...AppState.userData.pages[pageNumber],
        bestScore: score, srsLevel, nextReviewDate, lastTested: new Date().toISOString()
    };
    try {
        await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({
                action: 'savePageData',
                userId: AppState.currentUser,
                data: { pageNumber, score, srsLevel, nextReviewDate }
            })
        });
    } catch (error) { console.error(`Error saving page ${pageNumber}:`, error); }
}

function updateAllUI() {
    if (!AppState.currentUser || !AppState.userData.profile) {
        // ... (المنطق القديم لإخفاء العناصر)
        return;
    }
    // ... (كل منطق تحديث الواجهة يبقى كما هو، لكنه سيستخدم AppState.userData.profile)
    const userData = AppState.userData.profile;
    // ...
    // [جديد] تحديث قائمة اختيار القارئ
    if (AppState.userData.settings) {
        reciterSelect.value = AppState.userData.settings.reciter;
    }
}

// [جديد] التعامل مع تغيير القارئ
function handleReciterChange() {
    const newReciter = reciterSelect.value;
    AppState.userData.settings.reciter = newReciter;
    saveUserProfileAndSettings(); // حفظ الإعداد الجديد
    alert(`تم تغيير القارئ إلى: ${RECITERS[newReciter]}`);
}

// --- 7. Core Quiz Functions ---

// [تعديل] دالة جلب الصوت
async function getAyahAudio(ayah) {
    if (AppState.pageData.audioData[ayah.numberInSurah]) {
        return AppState.pageData.audioData[ayah.numberInSurah];
    }
    try {
        const reciterId = AppState.userData.settings.reciter || Object.keys(RECITERS)[0];
        const response = await fetch(API_ENDPOINTS.pageAudio(AppState.pageData.number, reciterId));
        // ... (بقية المنطق كما هو)
    } catch (error) { /* ... */ }
}

// [تعديل] دالة عرض النتائج لتشمل منطق SRS
function showResults() {
    // ... (المنطق الحالي لحساب النقاط والمستوى يبقى كما هو)
    
    // --- [جديد] منطق نظام التكرار المتباعد (SRS) ---
    const page = AppState.pageData.number;
    const score = AppState.currentQuiz.score;
    const pageSRSRecord = AppState.userData.pages[page] || { srsLevel: 0, bestScore: 0 };
    let currentSrsLevel = pageSRSRecord.srsLevel;
    let newBestScore = Math.max(score, pageSRSRecord.bestScore);

    if (score >= QUIZ_CONFIG.srsPromotionThreshold) {
        // ترقية مستوى الصفحة
        currentSrsLevel = Math.min(currentSrsLevel + 1, SRS_CONFIG.intervals.length - 1);
    } else if (score < 5) {
        // تخفيض مستوى الصفحة عند الأداء السيء
        currentSrsLevel = Math.max(0, currentSrsLevel - 1);
    }

    const daysToAdd = SRS_CONFIG.intervals[currentSrsLevel];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    // حفظ بيانات الصفحة الجديدة
    savePageData(page, newBestScore, currentSrsLevel, nextReviewDate.toISOString());
    
    // --- نهاية منطق SRS ---

    // ... (بقية منطق عرض النتائج وحفظ بيانات الملف الشخصي)
    // ملاحظة: يجب استدعاء saveUserProfileAndSettings() في النهاية لحفظ XP والتغييرات الأخرى
    saveUserProfileAndSettings();
    updateAllUI();
}

// --- 8. Advanced Feature Functions ---

// [تعديل] المراجعة الذكية لتصبح مراجعة SRS
async function startSmartReview() { // يمكن إعادة تسميتها إلى startSrsReview
    const username = userNameInput.value;
    if (!username) { /* ... */ }
    if (username !== AppState.currentUser) {
        await handleUserLogin(username);
    }
    if (!AppState.currentUserData) return;

    const today = new Date();
    const pagesToReview = Object.entries(AppState.userData.pages)
        .filter(([, pageData]) => new Date(pageData.nextReviewDate) <= today)
        .map(([pageNumber]) => pageNumber);

    let pageToReview;
    if (pagesToReview.length > 0) {
        // اختر صفحة عشوائية من الصفحات التي حان وقت مراجعتها
        pageToReview = pagesToReview[Math.floor(Math.random() * pagesToReview.length)];
        alert(`مراجعات اليوم: حان وقت مراجعة صفحة ${pageToReview}.`);
    } else {
        // لا توجد مراجعات مستحقة، اقترح صفحة جديدة أو ضعيفة
        alert("لا توجد مراجعات مستحقة اليوم! سيتم اختيار صفحة عشوائية.");
        pageToReview = Math.floor(Math.random() * 604) + 1;
    }
    
    pageNumberInput.value = pageToReview;
    await startStandardTest();
}

// ... (بقية الدوال تبقى كما هي في الغالب)
