// --- 全域變數 ---
let currentLevel = 1;
let currentLetter = 'A';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const QUIZ_HISTORY_STORAGE_KEY = 'englishQuizHistoryRecords';
const MISTAKE_SUMMARY_STORAGE_KEY = 'englishQuizMistakeSummary';
const LEGACY_WRONG_WORDS_STORAGE_KEY = 'englishQuizWrongWords';

// --- 視圖切換與瀏覽器 History 控制 ---

/**
 * 切換頁面 (View)
 * @param {string} viewName 頁面名稱 ('home', 'dictionary', 'quizSetup', 'quizPlay', 'quizResult', 'quizHistory', 'mistakeSummary')
 * @param {boolean} pushState 是否要寫入瀏覽器歷史紀錄 (預設 true，點擊按鈕時為 true，按瀏覽器上一頁時傳 false)
 */
function switchView(viewName, pushState = true) {
    // 1. 隱藏所有頁面
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('dictionaryView').classList.add('hidden');
    document.getElementById('quizSetupView').classList.add('hidden');
    document.getElementById('quizPlayView').classList.add('hidden');
    document.getElementById('quizResultView').classList.add('hidden');
    document.getElementById('quizHistoryView').classList.add('hidden');
    document.getElementById('mistakeSummaryView').classList.add('hidden');

    // 2. 顯示目標頁面與初始化
    if (viewName === 'home') {
        document.getElementById('homeView').classList.remove('hidden');
    } else if (viewName === 'dictionary') {
        document.getElementById('dictionaryView').classList.remove('hidden');
    } else if (viewName === 'quizSetup') {
        document.getElementById('quizSetupView').classList.remove('hidden');
        initQuizSetup();
    } else if (viewName === 'quizPlay') {
        document.getElementById('quizPlayView').classList.remove('hidden');
    } else if (viewName === 'quizResult') {
        document.getElementById('quizResultView').classList.remove('hidden');
    } else if (viewName === 'quizHistory') {
        document.getElementById('quizHistoryView').classList.remove('hidden');
        renderQuizHistoryList();
    } else if (viewName === 'mistakeSummary') {
        document.getElementById('mistakeSummaryView').classList.remove('hidden');
        renderMistakeSummaryList();
    }

    // 3. 寫入瀏覽器歷史紀錄 (點選功能切換時觸發)
    if (pushState) {
        history.pushState({ view: viewName }, '', `#${viewName}`);
    }

    // 切換頁面時自動捲動到最上方
    window.scrollTo(0, 0);
}

// 監聽瀏覽器的「上一頁 / 下一頁」按鈕 (Back/Forward)
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view) {
        // 如果歷史紀錄中有 State，切換至該頁面 (不重複 pushState)
        switchView(event.state.view, false);
    } else {
        // 沒有 State (回到初始載入頁面) 預設回首頁
        switchView('home', false);
    }
});

function showQuizHistory() {
    switchView('quizHistory');
}

function showMistakeSummary() {
    switchView('mistakeSummary');
}

function showWrongWordsReview() {
    showQuizHistory();
}

// 陣列打亂工具
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 頁面初始化載入
window.onload = () => {
    migrateLegacyWrongWords();
    initDictionary();
    initQuizSetup();
    initMistakeSummaryFilters();
    renderQuizHistoryList();
    renderMistakeSummaryList();

    // 檢查網址是否有 Anchor hash (例如 #dictionary)，有則直接開啟對應頁面
    const initialView = location.hash.replace('#', '') || 'home';
    
    // 設定初始狀態 replaceState，確保按下「上一頁」回到最一開始時也能正確識別
    history.replaceState({ view: initialView }, '', `#${initialView}`);
    switchView(initialView, false);
};