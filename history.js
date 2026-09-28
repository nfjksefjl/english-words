function getQuizHistory() {
    try {
        const saved = localStorage.getItem(QUIZ_HISTORY_STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function saveQuizHistory(list) {
    localStorage.setItem(QUIZ_HISTORY_STORAGE_KEY, JSON.stringify(list));
}

function recordQuizResult(score, total, wrongWords, meta) {
    const history = getQuizHistory();
    const record = {
        id: Date.now(),
        date: new Date().toISOString(),
        score: score,
        correctCount: score,
        totalQuestions: total,
        wrongWords: wrongWords,
        meta: meta || {}
    };

    history.unshift(record);
    saveQuizHistory(history.slice(0, 30));
}

function renderQuizHistoryList() {
    const history = getQuizHistory().slice(0, 30);
    const list = document.getElementById('quizHistoryList');
    const empty = document.getElementById('emptyQuizHistory');

    if (!history.length) {
        empty.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }

    empty.classList.add('hidden');

    list.innerHTML = history.map((record, index) => {
        const meta = record.meta || {};
        const levels = meta.level && meta.level !== 'all' ? String(meta.level).split(',') : [];
        const letters = meta.letter && meta.letter !== 'all' ? String(meta.letter).split(',') : [];
        const levelText = levels.length ? levels.map(level => `Level ${level}`).join(', ') : '全部等級';
        const letterText = letters.length ? `字母 ${letters.join(', ')}` : '全部字母';

        const wrongHtml = record.wrongWords && record.wrongWords.length
            ? record.wrongWords.map(item => `
                <span class="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs mr-2 mb-2">
                    ${item.word} (${item.translation})
                </span>
            `).join('')
            : '<span class="text-gray-500 text-sm">本次沒有錯題</span>';

        return `
            <div class="bg-white p-4 rounded-xl border shadow-sm">
                <div class="flex justify-between items-start gap-4 mb-3">
                    <div>
                        <div class="font-bold text-blue-800">第 ${index + 1} 次測驗</div>
                        <div class="text-xs text-gray-500">${new Date(record.date).toLocaleString('zh-TW')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-blue-600">${record.score} 分</div>
                        <div class="text-xs text-gray-500">${record.correctCount} / ${record.totalQuestions} 答對</div>
                    </div>
                </div>

                <div class="text-xs text-gray-600 mb-3">
                    ${meta.mode === 'zhToEn' ? '中文 → 英文' : '英文 → 中文'} · ${levelText} · ${letterText}
                </div>

                <div class="flex flex-wrap">
                    ${wrongHtml}
                </div>
            </div>
        `;
    }).join('');
}