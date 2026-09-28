// --- 單字表模組 ---
function initDictionary() {
    renderLevelButtons();
    renderAlphabetButtons();
    filterAndRender();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        if (keyword) {
            searchWords(keyword);
        } else {
            filterAndRender();
        }
    });
}

function renderLevelButtons() {
    const container = document.getElementById('levelContainer');
    container.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const btn = document.createElement('button');
        btn.textContent = `Level ${i}`;
        btn.className = `px-4 py-2 rounded font-semibold transition-colors ${currentLevel === i ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-100'}`;
        btn.onclick = () => {
            currentLevel = i;
            document.getElementById('searchInput').value = '';
            renderLevelButtons();
            filterAndRender();
        };
        container.appendChild(btn);
    }
}

function renderAlphabetButtons() {
    const container = document.getElementById('alphabetContainer');
    container.innerHTML = '';
    alphabet.forEach(letter => {
        const btn = document.createElement('button');
        btn.textContent = letter;
        btn.className = `w-8 h-8 rounded flex items-center justify-center font-medium transition-colors ${currentLetter === letter ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 hover:bg-gray-100'}`;
        btn.onclick = () => {
            currentLetter = letter;
            document.getElementById('searchInput').value = '';
            renderAlphabetButtons();
            filterAndRender();
        };
        container.appendChild(btn);
    });
}

function filterAndRender() {
    const filtered = wordsDatabase.filter(item => 
        item.level === currentLevel && 
        item.word.toUpperCase().startsWith(currentLetter)
    );
    renderCards(filtered);
}

function searchWords(keyword) {
    const filtered = wordsDatabase.filter(item => 
        item.word.toLowerCase().includes(keyword) || 
        item.translation.includes(keyword)
    );
    renderCards(filtered);
}

function renderCards(data) {
    const container = document.getElementById('wordList');
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">找不到相符的單字</p>';
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h2 class="text-xl font-bold text-gray-900">${item.word}</h2>
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Level ${item.level}</span>
            </div>
            <p class="text-gray-700">${item.translation}</p>
        `;
        container.appendChild(card);
    });
}