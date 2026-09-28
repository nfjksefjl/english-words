// 測驗動態變數
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedQuizMode = 'zhToEn';
let currentQuizWrongWords = [];

function initQuizSetup() {
    const letterSelect = document.getElementById('quizLetterSelect');
    letterSelect.innerHTML = '';
    [['all', '不限字母'], ...alphabet.map(letter => [letter, letter])].forEach(([value, text]) => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 py-1';
        label.innerHTML = `<input type="checkbox" name="quizLetter" value="${value}" class="text-blue-600"><span>${text}</span>`;
        const checkbox = label.querySelector('input');
        checkbox.checked = value === 'all';
        checkbox.onchange = () => updateQuizSelection('quizLetter', value);
        letterSelect.appendChild(label);
    });
}

function updateQuizSelection(groupName, selectedValue) {
    const inputs = [...document.querySelectorAll(`input[name="${groupName}"]`)];
    const allInput = inputs.find(input => input.value === 'all');
    const specificInputs = inputs.filter(input => input.value !== 'all');

    if (selectedValue === 'all' && allInput.checked) {
        specificInputs.forEach(input => { input.checked = false; });
    } else {
        allInput.checked = false;
        if (!specificInputs.some(input => input.checked)) allInput.checked = true;
    }
}

function toggleQuizLevelOptions() {
    const button = document.getElementById('quizLevelToggle');
    const options = document.getElementById('quizLevelSelect');
    const expanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', String(!expanded));
    options.classList.toggle('hidden', expanded);
}

function toggleQuizLetterOptions() {
    const button = document.getElementById('quizLetterToggle');
    const options = document.getElementById('quizLetterSelect');
    const expanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', String(!expanded));
    options.classList.toggle('hidden', expanded);
}

function getQuizSelection(groupName) {
    const selected = [...document.querySelectorAll(`input[name="${groupName}"]:checked`)]
        .map(input => input.value)
        .filter(value => value !== 'all');
    return selected;
}

function startQuiz() {
    const selectedLevels = getQuizSelection('quizLevel');
    const selectedLetters = getQuizSelection('quizLetter');
    selectedQuizMode = document.querySelector('input[name="quizMode"]:checked').value;

    let pool = wordsDatabase.filter(item => {
        const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(String(item.level));
        const matchLetter = selectedLetters.length === 0 || selectedLetters.some(letter =>
            item.word.toUpperCase().startsWith(letter)
        );
        return matchLevel && matchLetter;
    });

    if (pool.length === 0) {
        alert('該條件下沒有可用的單字，請重新設定！');
        return;
    }

    pool = shuffleArray([...pool]);
    const totalQuestions = Math.min(50, pool.length);
    const selectedWords = pool.slice(0, totalQuestions);

    let previousOptionKey = '';

    quizQuestions = selectedWords.map(targetWord => {
        let options;
        let optionKey;
        let attempts = 0;

        do {
            options = buildOptionsForWord(targetWord, selectedQuizMode);

            optionKey = options
                .map(item => item.word)
                .sort()
                .join('|');

            attempts++;
        } while (optionKey === previousOptionKey && attempts < 20);

        previousOptionKey = optionKey;

        return {
            target: targetWord,
            options
        };
    });

    currentQuestionIndex = 0;
    score = 0;
    currentQuizWrongWords = [];

    switchView('quizPlay');
    renderQuestion();
}

function buildOptionsForWord(targetWord, mode) {
    const answer = { ...targetWord };
    const preferredLetter = answer.word.charAt(0).toUpperCase();

    let candidates = wordsDatabase.filter(item =>
        item.word !== answer.word &&
        item.word.toUpperCase().startsWith(preferredLetter)
    );

    if (candidates.length < 3) {
        candidates = [
            ...candidates,
            ...wordsDatabase.filter(item =>
                item.word !== answer.word &&
                item.level === answer.level
            )
        ];
    }

    candidates = candidates.filter((item, index, arr) =>
        arr.findIndex(x => x.word === item.word) === index
    );

    shuffleArray(candidates);
    const finalOptions = [answer];
    for (const item of candidates) {
        if (finalOptions.length >= 4) break;
        if (item.word !== answer.word && !finalOptions.some(x => x.word === item.word)) {
            finalOptions.push(item);
        }
    }

    while (finalOptions.length < 4) {
        const fallback = wordsDatabase.find(item =>
            item.word !== answer.word &&
            !finalOptions.some(x => x.word === item.word)
        );
        if (!fallback) break;
        finalOptions.push(fallback);
    }

    return shuffleArray(finalOptions);
}

function renderQuestion() {
    const q = quizQuestions[currentQuestionIndex];
    const total = quizQuestions.length;

    document.getElementById('quizProgress').textContent = `題目 ${currentQuestionIndex + 1} / ${total}`;
    document.getElementById('progressBar').style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;

    const tag = document.getElementById('questionTypeTag');
    const qText = document.getElementById('questionText');

    if (selectedQuizMode === 'zhToEn') {
        tag.textContent = '模式一：看中文選英文';
        qText.textContent = q.target.translation;
    } else {
        tag.textContent = '模式二：看英文選中文';
        qText.textContent = q.target.word;
    }

    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    document.getElementById('nextQuestionButton').classList.add('hidden');

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'w-full py-3 px-4 border border-gray-300 rounded-lg text-lg font-medium hover:bg-blue-50 transition text-left flex justify-between items-center';
        btn.textContent = (selectedQuizMode === 'zhToEn') ? opt.word : opt.translation;

        btn.onclick = () => handleAnswer(btn, opt, q.target);
        container.appendChild(btn);
    });
}

function handleAnswer(btnElement, selectedOpt, targetOpt) {
    const buttons = document.querySelectorAll('#optionsContainer button');
    buttons.forEach(b => b.disabled = true);

    const isCorrect = isCorrectOption(selectedOpt, targetOpt, selectedQuizMode);

    if (isCorrect) {
        btnElement.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
        score++;
    } else {
        btnElement.classList.add('bg-red-100', 'border-red-500', 'text-red-800');

        const wrongEntry = {
            word: targetOpt.word,
            translation: targetOpt.translation,
            level: targetOpt.level
        };

        currentQuizWrongWords.push(wrongEntry);
        registerWrongWord(wrongEntry);

        buttons.forEach(b => {
            const expectedText = (selectedQuizMode === 'zhToEn') ? targetOpt.word : targetOpt.translation;
            if (b.textContent === expectedText) {
                b.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
            }
        });
    }

    if (isCorrect) {
        setTimeout(goToNextQuestion, 600);
    } else {
        document.getElementById('nextQuestionButton').classList.remove('hidden');
    }
}

function goToNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        renderQuestion();
    } else {
        showResult();
    }
}

function isCorrectOption(selectedOpt, targetOpt, mode) {
    if (mode === 'zhToEn') {
        return selectedOpt.word === targetOpt.word;
    }
    return selectedOpt.translation === targetOpt.translation;
}

function showResult() {
    const total = quizQuestions.length;
    const finalScoreVal = Math.round((score / total) * 100);

    const uniqueWrongWords = [];
    const seen = new Set();

    currentQuizWrongWords.forEach(item => {
        if (!seen.has(item.word)) {
            seen.add(item.word);
            uniqueWrongWords.push(item);
        }
    });

    const selectedLevels = getQuizSelection('quizLevel');
    const selectedLetters = getQuizSelection('quizLetter');

    recordQuizResult(finalScoreVal, total, uniqueWrongWords, {
        mode: selectedQuizMode,
        level: selectedLevels.length ? selectedLevels.join(',') : 'all',
        letter: selectedLetters.length ? selectedLetters.join(',') : 'all'
    });

    document.getElementById('finalScore').textContent = finalScoreVal;
    document.getElementById('correctCount').textContent = score;
    document.getElementById('totalQuestionsCount').textContent = total;
    document.getElementById('wrongWordsCount').textContent = uniqueWrongWords.length;

    const panel = document.getElementById('quizWrongWordPanel');
    const list = document.getElementById('quizWrongWordList');

    if (uniqueWrongWords.length > 0) {
        list.innerHTML = uniqueWrongWords.map(item => `
            <div class="flex justify-between items-center bg-white rounded-lg p-2 border">
                <div>
                    <div class="font-semibold">${item.word}</div>
                    <div class="text-xs text-gray-500">${item.translation}</div>
                </div>
                <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Level ${item.level}</span>
            </div>
        `).join('');
        panel.classList.remove('hidden');
    } else {
        list.innerHTML = '<div class="text-sm text-gray-500">本次測驗沒有錯題，表現很棒！</div>';
        panel.classList.remove('hidden');
    }

    switchView('quizResult');
}

function confirmExitQuiz() {
    if (confirm('確定要放棄目前的測驗並返回首頁嗎？')) {
        switchView('home');
    }
}