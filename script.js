// =================================================================================
//  رفيق الحفظ المتقدم - ملف الجافاسكريبت الرئيسي (v2.1 مع SRS والقراء )
// =================================================================================

// --- استيراد الإعدادات ---
import { API_ENDPOINTS, QUIZ_CONFIG, MOTIVATION_CONFIG, RECITERS, SRS_CONFIG } from './config.js';

// --- رابط الـ API ---
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/ABCDEFG-YOUR-UNIQUE-ID/exec'; // <-- الصق الرابط الخاص بك هنا

// --- 1. DOM Element Variables ---
const startScreen = document.getElementById('start-screen' );
const quizScreen = document.getElementById('quiz-screen');
const errorReviewScreen = document.getElementById('error-review-screen');
const resultScreen = document.getElementById('result-screen');
const profileScreen = document.getElementById('profile-screen');
const loader = document.getElementById('loader');
const userNameInput = document.getElementById('userName');
const pageNumberInput = document.getElementById('pageNumber');
const startButton = document.getElementById('startButton');
const profileButton = document.getElementById('profileButton');
const questionArea = document.getElementById('question-area');
const feedbackArea = document.getElementById('feedback-area');
const progressCounter = document.getElementById('progress-counter');
const progressBar = document.getElementById('progress-bar');
const errorList = document.getElementById('error-list');
const showFinalResultButton = document.getElementById('show-final-result-button');
const challengeLinkInput = document.getElementById('challenge-link');
const welcomeName = document.getElementById('welcome-name');
const userTitle = document.getElementById('user-title');
const profileName = document.getElementById('profileName');
const resultName = document.getElementById('resultName');
const finalScore = document.getElementById('finalScore');
const xpGainedText = document.getElementById('xp-gained-text');
const smartReviewBtn = document.getElementById('smart-review-btn');
const hifzHeatmap = document.getElementById('hifz-heatmap');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const meaningBtn = document.getElementById('meaning-btn');
const meaningModal = document.getElementById('meaning-modal');
const closeMeaningModal = document.getElementById('close-meaning-modal');
const meaningContent = document.getElementById('meaning-content');
const advancedStatsContainer = document.getElementById('advanced-stats-container');
const shareCardBtn = document.getElementById('share-card-btn');
const hafizCard = document.getElementById('hafiz-card');
const motivationFeatures = document.getElementById('motivation-features');
const streakCounter = document.getElementById('streak-counter');
const xpText = document.getElementById('xp-text');
const xpBar = document.getElementById('xp-bar');
const achievementsCounter = document.getElementById('achievements-counter');
const dailyRewardModal = document.getElementById('daily-reward-modal');
const closeDailyModal = document.getElementById('close-daily-modal');
const rewardText = document.getElementById('reward-text');
const progressTreeContainer = document.getElementById('progress-tree-container');
const progressTree = document.getElementById('progress-tree');
const masteredPagesCount = document.getElementById('mastered-pages-count');
const achievementsContainer = document.getElementById('achievements-container');
const backToStartBtn = document.getElementById('back-to-start-btn');
const copyChallengeBtn = document.getElementById('copy-challenge-btn');
const reciterSelect = document.getElementById('reciter-select');

// --- 2. كائن الحالة الموحد ---
let AppState = {
    currentUser: null,
    userData: {
        profile: null,
        settings: null,
        pages: {}
    },
    lastUsedName: localStorage.getItem('lastUserName'),
    theme: localStorage.getItem('theme') || 'light',
    pageData: {
        number: null,
        ayahs: [],
        audioData: {}
    },
    currentQuiz: {
        isActive: false,
        score: 0,
        questionIndex: 0,
        errorLog: [],
        currentAyahForMeaning: null
    }
};

// --- 3. Initialization ---
window.onload = async () => {
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
startButton.addEventListener('click', startStandardTest);
profileButton.addEventListener('click', () => showProfileScreen());
themeToggleBtn.addEventListener('click', toggleTheme);
smartReviewBtn.addEventListener('click', startSmartReview);
meaningBtn.addEventListener('click', showMeaning);
closeMeaningModal.onclick = () => meaningModal.style.display = "none";
closeDailyModal.onclick = () => dailyRewardModal.style.display = "none";
shareCardBtn.addEventListener('click', generateAndShareCard);
showFinalResultButton.addEventListener('click', () => {
    errorReviewScreen.classList.add('hidden');
    showResults();
});
backToStartBtn.addEventListener('click', showStartScreen);
copyChallengeBtn.addEventListener('click', copyChallengeLink);

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
        AppState.userData = {
            profile: {
                xp: 0, level: 1, lastTestDate: null, testsCompleted: 0,
                totalCorrect: 0, streak: 0, lastRewardDate: null,
                achievements: JSON.parse(JSON.stringify(MOTIVATION_CONFIG.achievements))
            },
            settings: {
                reciter: Object.keys(RECITERS)[0]
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
            return null;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("حدث خطأ أثناء جلب بياناتك.");
        return null;
    }
}

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

async function savePageData(pageNumber, score, srsLevel, nextReviewDate) {
    if (!AppState.currentUser) return;
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
        welcomeName.textContent = '';
        userTitle.textContent = '';
        motivationFeatures.classList.add('hidden');
        return;
    }
    motivationFeatures.classList.remove('hidden');
    const userData = AppState.userData.profile;
    welcomeName.textContent = AppState.currentUser;
    userTitle.textContent = MOTIVATION_CONFIG.titles[userData.level - 1] || MOTIVATION_CONFIG.titles[MOTIVATION_CONFIG.titles.length - 1];
    
    streakCounter.textContent = userData.streak;
    achievementsCounter.textContent = Object.values(userData.achievements).filter(a => a.unlocked).length;

    const currentLevelXP = MOTIVATION_CONFIG.levels[userData.level - 1] || 0;
    const nextLevelXP = MOTIVATION_CONFIG.levels[userData.level] || (currentLevelXP * 2);
    const xpInLevel = userData.xp - currentLevelXP;
    const xpForLevel = nextLevelXP - currentLevelXP;
    const xpPercentage = Math.min(100, (xpInLevel / xpForLevel) * 100);
    xpBar.style.width = `${xpPercentage}%`;
    xpText.textContent = `المستوى ${userData.level} (${xpInLevel}/${xpForLevel})`;

    themeToggleBtn.textContent = document.body.classList.contains('dark-mode') ? "الوضع النهاري" : "الوضع الليلي";
    
    if (AppState.userData.settings) {
        reciterSelect.value = AppState.userData.settings.reciter;
    }
}

function handleReciterChange() {
    const newReciter = reciterSelect.value;
    AppState.userData.settings.reciter = newReciter;
    saveUserProfileAndSettings();
    alert(`تم تغيير القارئ إلى: ${RECITERS[newReciter]}`);
}

function showProfileScreen() {
    if (!AppState.currentUser || !AppState.userData.profile) {
        alert('الرجاء إدخال اسمك وبدء اختبار أولاً.');
        return;
    }
    startScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    profileScreen.classList.remove('hidden');
    profileName.textContent = AppState.currentUser;
    
    const masteredCount = Object.values(AppState.userData.pages).filter(p => p.bestScore === 10).length;
    masteredPagesCount.textContent = masteredCount;
    const treeEmojis = ['🌱', '🌿', '🌳', '🌳✨', '🌳🌟'];
    const treeIndex = Math.min(Math.floor(masteredCount / 50), treeEmojis.length - 1);
    progressTree.textContent = treeEmojis[treeIndex];

    achievementsContainer.innerHTML = '';
    for (const key in AppState.userData.profile.achievements) {
        const ach = AppState.userData.profile.achievements[key];
        const card = document.createElement('div');
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
        card.innerHTML = `<div class="icon">${ach.unlocked ? '✅' : '🔒'}</div><h5>${ach.title}</h5>`;
        achievementsContainer.appendChild(card);
    }

    buildHeatmap();
    showAdvancedStats();
}

function showStartScreen() {
    profileScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    updateAllUI();
}

// --- 6. هياكل التحميل (Loading Skeletons) ---

function showQuestionSkeleton() {
    questionArea.innerHTML = `
        <h3>السؤال ${AppState.currentQuiz.questionIndex + 1}</h3>
        <div class="skeleton skeleton-audio"></div>
        <div class="skeleton skeleton-option"></div>
        <div class="skeleton skeleton-option"></div>
        <div class="skeleton skeleton-option"></div>
    `;
}

// --- 7. Core Quiz Functions ---

async function startStandardTest() {
    const username = userNameInput.value;
    const pageNumber = pageNumberInput.value;
    if (!username || !pageNumber) {
        alert('الرجاء إدخال اسم ورقم صفحة.');
        return;
    }
    
    if (username !== AppState.currentUser) {
        await handleUserLogin(username);
    }
    
    if (!AppState.userData.profile) {
        alert("لم نتمكن من تحميل بياناتك، يرجى المحاولة مرة أخرى.");
        return;
    }

    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    loader.classList.remove('hidden');

    const success = await fetchPageText(pageNumber);
    loader.classList.add('hidden');
    if (success) {
        AppState.currentQuiz = {
            isActive: true, score: 0, questionIndex: 0, errorLog: [], currentAyahForMeaning: null
        };
        displayQuestion();
    } else {
        showStartScreen();
    }
}

async function fetchPageText(pageNumber) {
    try {
        const response = await fetch(API_ENDPOINTS.pageText(pageNumber));
        const data = await response.json();
        if (data.code === 200 && data.data.ayahs.length > 0) {
            AppState.pageData = {
                number: pageNumber,
                ayahs: data.data.ayahs,
                audioData: {}
            };
            return true;
        } else {
            alert('حدث خطأ في جلب بيانات الصفحة.');
            return false;
        }
    } catch (error) {
        console.error("Error fetching page text:", error);
        alert('لا يمكن الوصول إلى الخادم. تحقق من اتصالك بالإنترنت.');
        return false;
    }
}

async function getAyahAudio(ayah) {
    if (AppState.pageData.audioData[ayah.numberInSurah]) {
        return AppState.pageData.audioData[ayah.numberInSurah];
    }
    try {
        const reciterId = AppState.userData.settings.reciter || Object.keys(RECITERS)[0];
        const response = await fetch(API_ENDPOINTS.pageAudio(AppState.pageData.number, reciterId));
        const data = await response.json();
        if (data.code === 200) {
            data.data.ayahs.forEach(a => {
                AppState.pageData.audioData[a.numberInSurah] = a.audio;
            });
            return AppState.pageData.audioData[ayah.numberInSurah];
        }
        return null;
    } catch (error) {
        console.error("Error fetching audio:", error);
        return null;
    }
}

function displayQuestion() {
    if (AppState.currentQuiz.questionIndex >= QUIZ_CONFIG.defaultQuestionsCount) {
        endQuiz();
        return;
    }
    updateProgress();
    feedbackArea.classList.add('hidden');
    meaningBtn.classList.add('hidden');
    showQuestionSkeleton();

    setTimeout(() => {
        const randomType = shuffleArray(QUIZ_CONFIG.questionTypes)[0];
        try {
            const questionGenerators = {
                'chooseNext': generateChooseNextQuestion,
                'choosePrevious': generateChoosePreviousQuestion,
                'locateAyah': generateLocateAyahQuestion,
                'completeAyah': generateCompleteAyahQuestion,
                'completeLastWord': generateCompleteLastWordQuestion,
                'linkStartEnd': generateLinkStartEndQuestion
            };
            questionGenerators[randomType]();
        } catch (e) {
            console.error("Failed to generate question:", e);
            generateChooseNextQuestion();
        }
    }, 500);
}

function handleResult(isCorrect, correctAnswerText, questionAyah) {
    const interactiveElements = questionArea.querySelectorAll('.choice-box, .option-div, button');
    interactiveElements.forEach(el => el.style.pointerEvents = 'none');
    
    if (isCorrect) {
        AppState.currentQuiz.score++;
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.className = 'correct-feedback';
        AppState.currentQuiz.currentAyahForMeaning = questionAyah;
        meaningBtn.classList.remove('hidden');
    } else {
        feedbackArea.textContent = `إجابة خاطئة.`;
        feedbackArea.className = 'wrong-feedback';
        const questionData = {
            type: 'unknown',
            correctAnswer: correctAnswerText,
            questionHTML: questionArea.innerHTML
        };
        AppState.currentQuiz.errorLog.push(questionData);
        
        AppState.userData.profile.errorTypes[questionData.type] = (AppState.userData.profile.errorTypes[questionData.type] || 0) + 1;
    }
    feedbackArea.classList.remove('hidden');
    setTimeout(() => {
        AppState.currentQuiz.questionIndex++;
        displayQuestion();
    }, 3000);
}

function endQuiz() {
    progressBar.style.width = '100%';
    if (AppState.currentQuiz.errorLog.length > 0) {
        quizScreen.classList.add('hidden');
        errorReviewScreen.classList.remove('hidden');
        displayErrorReview();
    } else {
        showResults();
    }
}

function displayErrorReview() {
    errorList.innerHTML = '';
    AppState.currentQuiz.errorLog.forEach(error => {
        const item = document.createElement('div');
        item.className = 'error-review-item';
        item.innerHTML = `<h4>سؤال خاطئ</h4>
                          <div>${error.questionHTML.replace(/<button.*<\/button>/g, '')}</div>
                          <p>الإجابة الصحيحة: <span class="correct-text">${error.correctAnswer}</span></p>`;
        item.querySelectorAll('.choice-box, .option-div, .number-box').forEach(el => {
            el.style.pointerEvents = 'none';
            if (el.dataset.correct !== 'true') {
                el.style.opacity = '0.5';
            } else {
                el.classList.add('correct-answer');
            }
        });
        errorList.appendChild(item);
    });
}

function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    const page = AppState.pageData.number;
    const score = AppState.currentQuiz.score;
    
    resultName.textContent = AppState.currentUser;
    finalScore.textContent = `${score} من ${QUIZ_CONFIG.defaultQuestionsCount}`;
    
    const xpGained = 10 + (score * 2);
    xpGainedText.textContent = xpGained;
    
    let userProfile = AppState.userData.profile;
    userProfile.xp += xpGained;
    userProfile.totalCorrect += score;
    userProfile.testsCompleted++;

    const pageSRSRecord = AppState.userData.pages[page] || { srsLevel: 0, bestScore: 0 };
    let currentSrsLevel = pageSRSRecord.srsLevel;
    let newBestScore = Math.max(score, pageSRSRecord.bestScore);

    if (score >= QUIZ_CONFIG.srsPromotionThreshold) {
        currentSrsLevel = Math.min(currentSrsLevel + 1, SRS_CONFIG.intervals.length - 1);
    } else if (score < 5) {
        currentSrsLevel = Math.max(0, currentSrsLevel - 1);
    }

    const daysToAdd = SRS_CONFIG.intervals[currentSrsLevel];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    savePageData(page, newBestScore, currentSrsLevel, nextReviewDate.toISOString());

    if (newBestScore > pageSRSRecord.bestScore) {
        showMotivationalMessage('newBest');
    }
    if (score === QUIZ_CONFIG.defaultQuestionsCount) {
        showMotivationalMessage('perfectScore');
    }

    const currentLevel = userProfile.level;
    while (userProfile.xp >= (MOTIVATION_CONFIG.levels[userProfile.level] || Infinity)) {
        userProfile.level++;
    }
    if (userProfile.level > currentLevel) {
        alert(`🎉 تهانينا! لقد وصلت إلى المستوى ${userProfile.level}!`);
    }

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (userProfile.lastTestDate === yesterday) {
        userProfile.streak++;
    } else if (userProfile.lastTestDate !== today) {
        userProfile.streak = 1;
    }
    if (userProfile.lastRewardDate !== today) {
        grantDailyReward();
        userProfile.lastRewardDate = today;
    }
    userProfile.lastTestDate = today;

    checkAndGrantAchievements(score);
    saveUserProfileAndSettings();
    generateChallengeLink();
    updateAllUI();
}

function grantDailyReward() {
    const reward = shuffleArray(MOTIVATION_CONFIG.dailyRewards)[0];
    rewardText.textContent = reward.text;
    if (reward.type === 'xp') {
        AppState.userData.profile.xp += reward.value;
    }
    dailyRewardModal.style.display = 'block';
}

function checkAndGrantAchievements(score) {
    let userProfile = AppState.userData.profile;
    let newAchievement = false;
    
    if (!userProfile.achievements.firstTest.unlocked) {
        userProfile.achievements.firstTest.unlocked = true; newAchievement = true;
    }
    if (userProfile.testsCompleted >= 10 && !userProfile.achievements.tenTests.unlocked) {
        userProfile.achievements.tenTests.unlocked = true; newAchievement = true;
    }
    if (score === QUIZ_CONFIG.defaultQuestionsCount && !userProfile.achievements.perfectScore.unlocked) {
        userProfile.achievements.perfectScore.unlocked = true; newAchievement = true;
    }
    const perfectScoresCount = Object.values(AppState.userData.pages).filter(p => p.bestScore === 10).length;
    if (perfectScoresCount >= 5 && !userProfile.achievements.fivePerfect.unlocked) {
        userProfile.achievements.fivePerfect.unlocked = true; newAchievement = true;
    }
    
    if (newAchievement) {
        alert("🎉 لقد حصلت على إنجاز جديد! تفحصه في ملفك الشخصي.");
    }
}

function copyChallengeLink() {
    challengeLinkInput.select();
    document.execCommand('copy');
    alert('تم نسخ رابط التحدي!');
    
    let userProfile = AppState.userData.profile;
    if (!userProfile.achievements.sendChallenge.unlocked) {
        userProfile.achievements.sendChallenge.unlocked = true;
        alert("🎉 لقد حصلت على إنجاز 'المتحدي'!");
        saveUserProfileAndSettings();
    }
}

function updateProgress() {
    progressCounter.textContent = `السؤال ${AppState.currentQuiz.questionIndex + 1} من ${QUIZ_CONFIG.defaultQuestionsCount}`;
    progressBar.style.width = `${((AppState.currentQuiz.questionIndex) / QUIZ_CONFIG.defaultQuestionsCount) * 100}%`;
}

function generateChallengeLink() {
    const params = {
        page: AppState.pageData.number,
        count: QUIZ_CONFIG.defaultQuestionsCount
    };
    const encodedParams = btoa(JSON.stringify(params));
    const link = `${window.location.origin}${window.location.pathname}?challenge=${encodedParams}`;
    challengeLinkInput.value = link;
}

// --- 8. Advanced Feature Functions ---

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    AppState.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', AppState.theme);
    updateAllUI();
}

async function startSmartReview() {
    const username = userNameInput.value;
    if (!username) {
        alert('الرجاء إدخال اسمك أولاً.');
        return;
    }
    if (username !== AppState.currentUser) {
        await handleUserLogin(username);
    }
    if (!AppState.userData.profile) return;

    const today = new Date();
    const pagesToReview = Object.entries(AppState.userData.pages)
        .filter(([, pageData]) => new Date(pageData.nextReviewDate) <= today)
        .map(([pageNumber]) => pageNumber);

    let pageToReview;
    if (pagesToReview.length > 0) {
        pageToReview = pagesToReview[Math.floor(Math.random() * pagesToReview.length)];
        alert(`مراجعات اليوم: حان وقت مراجعة صفحة ${pageToReview}.`);
    } else {
        alert("لا توجد مراجعات مستحقة اليوم! سيتم اختيار صفحة عشوائية للمراجعة.");
        pageToReview = Math.floor(Math.random() * 604) + 1;
    }
    
    pageNumberInput.value = pageToReview;
    await startStandardTest();
}

function buildHeatmap() {
    if (!AppState.userData.pages) return;
    hifzHeatmap.innerHTML = '';
    for (let i = 1; i <= 604; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        const pageData = AppState.userData.pages[i];
        const score = pageData ? pageData.bestScore : undefined;
        let level = 0;
        if (score === 10) level = 4;
        else if (score >= 8) level = 3;
        else if (score >= 5) level = 2;
        else if (score > 0) level = 1;
        cell.dataset.level = level;
        cell.innerHTML = `<span class="tooltip">صفحة ${i}  
أفضل درجة: ${score !== undefined ? score : 'لم تختبر'}</span>`;
        hifzHeatmap.appendChild(cell);
    }
}

async function showMeaning() {
    const ayah = AppState.currentQuiz.currentAyahForMeaning;
    if (!ayah) return;
    meaningModal.style.display = 'block';
    meaningContent.innerHTML = '<div class="loader"></div>';
    
    try {
        const response = await fetch(API_ENDPOINTS.tafsir(ayah.surah.number, ayah.numberInSurah));
        const data = await response.json();
        if (data.tafsir) {
            meaningContent.innerHTML = `
                <h4>تفسير ميسر للآية:</h4>
                <p>${ayah.text} [${ayah.surah.name}: ${ayah.numberInSurah}]</p>
                <p>${data.tafsir.text.replace(/<[^>]*>/g, '')}</p>
            `;
        } else { throw new Error('Tafsir not found'); }
    } catch (error) {
        meaningContent.innerHTML = '<p>عفواً، لم نتمكن من جلب التفسير حالياً.</p>';
        console.error("Tafsir API error:", error);
    }
}

function showMotivationalMessage(type) {
    const message = MOTIVATION_CONFIG.motivationalMessages[type];
    if (message) {
        feedbackArea.textContent = message;
        feedbackArea.className = 'motivational-feedback';
        feedbackArea.classList.remove('hidden');
    }
}

function generateAndShareCard() {
    if (!AppState.currentUser || !AppState.userData.profile) return;
    const userProfile = AppState.userData.profile;
    const masteredCount = Object.values(AppState.userData.pages).filter(p => p.bestScore === 10).length;
    const unlockedAchievements = Object.values(userProfile.achievements).filter(a => a.unlocked).length;
    
    document.getElementById('card-name').textContent = AppState.currentUser;
    document.getElementById('card-title').textContent = MOTIVATION_CONFIG.titles[userProfile.level - 1] || '';
    document.getElementById('card-level').textContent = userProfile.level;
    document.getElementById('card-mastered').textContent = masteredCount;
    document.getElementById('card-achievements').textContent = unlockedAchievements;
    const treeEmojis = ['🌱', '🌿', '🌳', '🌳✨', '🌳🌟'];
    const treeIndex = Math.min(Math.floor(masteredCount / 50), treeEmojis.length - 1);
    document.getElementById('card-tree').textContent = treeEmojis[treeIndex];

    hafizCard.style.display = 'block';
    html2canvas(hafizCard, { backgroundColor: null, scale: 2 }).then(canvas => {
        hafizCard.style.display = 'none';
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `بطاقة-الحافظ-${AppState.currentUser}.png`;
        link.click();
    });
}

function showAdvancedStats() {
    if (!AppState.userData.profile) return;
    const userProfile = AppState.userData.profile;
    const totalQuestionsAnswered = userProfile.testsCompleted * QUIZ_CONFIG.defaultQuestionsCount;
    const accuracy = totalQuestionsAnswered > 0 ? Math.round((userProfile.totalCorrect / totalQuestionsAnswered) * 100) : 0;
    
    const weakPoint = Object.entries(userProfile.errorTypes || {})
                        .sort((a, b) => b[1] - a[1])[0]?.[0] || "لا يوجد";

    advancedStatsContainer.innerHTML = `
        <div class="stat-card"><h5>معدل الدقة</h5><p>${accuracy}%</p></div>
        <div class="stat-card"><h5>نقطة للتحسين</h5><p>${weakPoint}</p></div>
        <div class="stat-card"><h5>إجمالي الاختبارات</h5><p>${userProfile.testsCompleted}</p></div>
    `;
}

// --- 9. All Question Generators ---

function addChoiceListeners(correctAnswerText, questionAyah) {
    questionArea.querySelectorAll('.choice-box, .option-div').forEach(el => {
        if (el.dataset.listenerAttached) return;
        el.dataset.listenerAttached = 'true';
        el.addEventListener('click', () => {
            const isCorrect = el.dataset.correct === 'true';
            handleResult(isCorrect, correctAnswerText, questionAyah);
            el.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
            if (!isCorrect) {
                const correctEl = questionArea.querySelector('[data-correct="true"]');
                if (correctEl) correctEl.classList.add('correct-answer');
            }
        });
    });
}

async function generateChooseNextQuestion() {
    const pageAyahs = AppState.pageData.ayahs;
    if (pageAyahs.length < 2) return generateCompleteLastWordQuestion();
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    const audioSrc = await getAyahAudio(questionAyah);
    let wrongOptions = pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number).slice(0, 2);
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    questionArea.innerHTML = `<h3>السؤال ${AppState.currentQuiz.questionIndex + 1}: اختر الآية التالية</h3>
        ${audioSrc ? `<audio controls autoplay src="${audioSrc}"></audio>` : '<p>عفواً، تعذر تحميل الصوت.</p>'}
        ${options.map(opt => `<div class="option-div" data-correct="${opt.number === correctNextAyah.number}">${opt.text}</div>`).join('')}`;
    addChoiceListeners(correctNextAyah.text, questionAyah);
}

async function generateChoosePreviousQuestion() {
    const pageAyahs = AppState.pageData.ayahs;
    if (pageAyahs.length < 2) return generateChooseNextQuestion();
    
    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1)) + 1;
    const questionAyah = pageAyahs[startIndex];
    const correctPreviousAyah = pageAyahs[startIndex - 1];
    const audioSrc = await getAyahAudio(questionAyah);
    let wrongOptions = pageAyahs.filter(a => a.number !== correctPreviousAyah.number && a.number !== questionAyah.number).slice(0, 2);
    const options = shuffleArray([correctPreviousAyah, ...wrongOptions]);
    questionArea.innerHTML = `<h3>السؤال ${AppState.currentQuiz.questionIndex + 1}: اختر الآية السابقة</h3>
        ${audioSrc ? `<audio controls autoplay src="${audioSrc}"></audio>` : '<p>عفواً، تعذر تحميل الصوت.</p>'}
        ${options.map(opt => `<div class="option-div" data-correct="${opt.number === correctPreviousAyah.number}">${opt.text}</div>`).join('')}`;
    addChoiceListeners(correctPreviousAyah.text, questionAyah);
}

async function generateLocateAyahQuestion() {
    const pageAyahs = AppState.pageData.ayahs;
    const ayahIndex = Math.floor(Math.random() * pageAyahs.length);
    const questionAyah = pageAyahs[ayahIndex];
    const audioSrc = await getAyahAudio(questionAyah);
    const totalAyahs = pageAyahs.length;
    let correctLocation;
    if (ayahIndex < totalAyahs / 3) correctLocation = 'بداية';
    else if (ayahIndex < (totalAyahs * 2) / 3) correctLocation = 'وسط';
    else correctLocation = 'نهاية';
    questionArea.innerHTML = `<h3>السؤال ${AppState.currentQuiz.questionIndex + 1}: أين يقع موضع هذه الآية؟</h3>
        ${audioSrc ? `<audio controls autoplay src="${audioSrc}"></audio>` : '<p>عفواً، تعذر تحميل الصوت.</p>'}
        <div class="interactive-area">${['بداية', 'وسط', 'نهاية'].map(loc => `<div class="choice-box" data-correct="${loc === correctLocation}">${loc} الصفحة</div>`).join('')}</div>`;
    addChoiceListeners(`${correctLocation} الصفحة`, questionAyah);
}

async function generateCompleteAyahQuestion() {
    const pageAyahs = AppState.pageData.ayahs;
    const longAyahs = pageAyahs.filter(a => a.text.split(' ').length > 8);
    if (longAyahs.length < 3) return generateChooseNextQuestion();
    const questionAyah = shuffleArray(longAyahs)[0];
    const audioSrc = await getAyahAudio(questionAyah);
    const words = questionAyah.text.split(' ');
    const splitPoint = Math.floor(words.length / 2);
    const firstHalfText = words.slice(0, splitPoint).join(' ');
    const correctSecondHalf = words.slice(splitPoint).join(' ');
    const wrongAyahs = pageAyahs.filter(a => a.number !== questionAyah.number);
    const wrongOptions = shuffleArray(wrongAyahs).slice(0, 2).map(a => {
        const wrongWords = a.text.split(' ');
        return wrongWords.slice(Math.floor(wrongWords.length / 2)).join(' ');
    });
    const options = shuffleArray([correctSecondHalf, ...wrongOptions]);
    questionArea.innerHTML = `<h3>السؤال ${AppState.currentQuiz.questionIndex + 1}: أكمل الآية</h3>
        <p style="font-family: 'Amiri', serif; font-size: 22px;">"${firstHalfText}..."</p>
        ${audioSrc ? `<audio controls autoplay src="${audioSrc}"></audio>` : ''}
        ${options.map(opt => `<div class="option-div" data-correct="${opt.replace(/'/g, "\\'") === correctSecondHalf.replace(/'/g, "\\'")}">${opt}</div>`).join('')}`;
    addChoiceListeners(correctSecondHalf, questionAyah);
}

async function generateCompleteLastWordQuestion() {
    const pageAyahs = AppState.pageData.ayahs;
    const suitableAyahs = pageAyahs.filter(a => a.text.split(' ').length > 3);
    if (suitableAyahs.length < 4) return generateChooseNextQuestion();
    const questionAyah = shuffleArray(suitableAyahs)[0];
    const audioSrc = await getAyahAudio(questionAyah);
    const words = questionAyah.text.split(' ');
    const correctLastWord = words.pop();
    const incompleteAyahText = words.join(' ');
    const wrongOptions = shuffleArray(suitableAyahs.filter(a => a.number !== questionAyah.number)).slice(0, 3).map(a => a.text.split(' ').pop());
    const options = shuffleArray([correctLastWord, ...wrongOptions]);
    questionArea.innerHTML = `<h3>السؤال ${AppState.currentQuiz.questionIndex + 1}: أكمل الكلمة الأخيرة</h3>
        <p style="font-family: 'Amiri', serif; font-size: 22px;">${incompleteAyahText} (...)</p>
        ${audioSrc ? `<audio controls autoplay src="${audioSrc}"></audio>` : ''}
        <div class="interactive-area">${options.map(opt => `<div class="choice-box" data-correct="${opt === correctLastWord}">${opt}</div>`).join('')}</div>`;
    addChoiceListeners(correctLastWord, questionAyah);
}

async function generateLinkStartEndQuestion() {
    const pageAyahs = AppState.pageData.ayahs;
    const suitableAyahs = pageAyahs.filter(a => a.text.split(' ').length > 5);
    if (suitableAyahs.length < 4) return generateChooseNextQuestion();
    const questionAyah = shuffleArray(suitableAyahs)[0];
    const words = questionAyah.text.split(' ');
    const startText = words.slice(0, 3).join(' ') + '...';
    const correctEnding = '...' + words.slice(-3).join(' ');
    const wrongOptions = shuffleArray(suitableAyahs.filter(a => a.number !== questionAyah.number))
        .slice(0, 3)
        .map(a => '...' + a.text.split(' ').slice(-3).join(' '));
    const options = shuffleArray([correctEnding, ...wrongOptions]);
    questionArea.innerHTML = `<h3>السؤال ${AppState.currentQuiz.questionIndex + 1}: اربط بداية الآية بنهايتها</h3>
        <p style="font-family: 'Amiri', serif; font-size: 22px; border: 1px solid var(--border-color); padding: 10px; border-radius: 5px;">"${startText}"</p>
        ${options.map(opt => `<div class="option-div" data-correct="${opt === correctEnding}">${opt}</div>`).join('')}`;
    addChoiceListeners(correctEnding, questionAyah);
}

// --- 10. Helper Functions ---
const shuffleArray = array => array.sort(() => 0.5 - Math.random());
