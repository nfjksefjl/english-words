let mistakeSummaryLevelFilterValue = 'all';
let mistakeSummaryLetterFilterValue = 'all';
let mistakeSummarySearchTerm = '';

function getMistakeSummary() {
    try {
        const saved = localStorage.getItem(MISTAKE_SUMMARY_STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function saveMistakeSummary(list) {
    localStorage.setItem(MISTAKE_SUMMARY_STORAGE_KEY, JSON.stringify(list));
}

function migrateLegacyWrongWords() {
    const hasNew = localStorage.getItem(MISTAKE_SUMMARY_STORAGE_KEY);
    if (hasNew) return;

    const legacy = localStorage.getItem(LEGACY_WRONG_WORDS_STORAGE_KEY);
    if (!legacy) return;

    try {
        const oldList = JSON.parse(legacy);
        if (!Array.isArray(oldList)) return;

        const mapped = oldList.map(item => ({
            word: item.word,
            translation: item.translation || '',
            level: item.level || 1,
            count: item.count || 1,
            firstMistake: item.firstMistake || item.lastMistake || new Date().toISOString(),
            lastMistake: item.lastMistake || new Date().toISOString()
        }));

        saveMistakeSummary(mapped);
    } catch (error) {
        console.error('Legacy data migrate failed', error);
    }
}

function initMistakeSummaryFilters() {
    const levelFilter = document.getElementById('mistakeSummaryLevelFilter');
    const letterFilter = document.getElementById('mistakeSummaryLetterFilter');
    const searchInput = document.getElementById('mistakeSummarySearchInput');

    levelFilter.innerHTML = '<option value="all">全部等級</option>' +
        Array.from({ length: 6 }, (_, i) => `<option value="${i + 1}">Level ${i + 1}</option>`).join('');

    letterFilter.innerHTML = '<option value="all">全部字母</option>' +
        alphabet.map(letter => `<option value="${letter}">${letter}</option>`).join('');

    levelFilter.value = mistakeSummaryLevelFilterValue;
    letterFilter.value = mistakeSummaryLetterFilterValue;
    searchInput.value = mistakeSummarySearchTerm;

    levelFilter.onchange = (e) => {
        mistakeSummaryLevelFilterValue = e.target.value;
        renderMistakeSummaryList();
    };

    letterFilter.onchange = (e) => {
        mistakeSummaryLetterFilterValue = e.target.value;
        renderMistakeSummaryList();
    };

    searchInput.oninput = (e) => {
        mistakeSummarySearchTerm = e.target.value.trim().toLowerCase();
        renderMistakeSummaryList();
    };
}

function registerWrongWord(wordData) {
    const summary = getMistakeSummary();
    const existingIndex = summary.findIndex(item => item.word === wordData.word);

    if (existingIndex >= 0) {
        summary[existingIndex].count += 1;
        summary[existingIndex].lastMistake = new Date().toISOString();
        summary[existingIndex].translation = wordData.translation;
        summary[existingIndex].level = wordData.level;
    } else {
        summary.push({
            word: wordData.word,
            translation: wordData.translation,
            level: wordData.level,
            count: 1,
            firstMistake: new Date().toISOString(),
            lastMistake: new Date().toISOString()
        });
    }

    saveMistakeSummary(summary);
}

function renderMistakeSummaryList() {
    const summary = getMistakeSummary();
    const list = document.getElementById('mistakeSummaryList');
    const empty = document.getElementById('emptyMistakeSummary');

    const filtered = summary.filter(item => {
        const levelMatch = mistakeSummaryLevelFilterValue === 'all' || item.level === Number(mistakeSummaryLevelFilterValue);
        const firstLetter = item.word.charAt(0).toUpperCase();
        const letterMatch = mistakeSummaryLetterFilterValue === 'all' || firstLetter === mistakeSummaryLetterFilterValue;

        const searchText = mistakeSummarySearchTerm;
        const keywordMatch =
            !searchText ||
            item.word.toLowerCase().includes(searchText) ||
            (item.translation || '').toLowerCase().includes(searchText);

        return levelMatch && letterMatch && keywordMatch;
    });

    if (!filtered.length) {
        empty.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }

    empty.classList.add('hidden');

    const grouped = {};
    filtered.forEach(item => {
        const groupKey = `Level ${item.level} / ${item.word.charAt(0).toUpperCase()}`;
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(item);
    });

    list.innerHTML = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b, 'zh-TW'))
        .map(([groupKey, items]) => `
            <div class="bg-white p-4 rounded-xl border shadow-sm">
                <h3 class="font-bold text-blue-700 mb-3">${groupKey}</h3>
                <div class="space-y-3">
                    ${items
                        .sort((a, b) => b.count - a.count)
                        .map(item => `
                            <div class="flex justify-between items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <div class="text-lg font-bold text-gray-900">${item.word}</div>
                                    <div class="text-gray-600">${item.translation}</div>
                                </div>
                                <span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                                    錯 ${item.count} 次
                                </span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `).join('');
}