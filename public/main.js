document.addEventListener('DOMContentLoaded', () => {
    // --- 탭 기능 관련 ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === btn.dataset.tab) {
                    content.classList.add('active');
                }
            });
        });
    });

    // --- 공통: 로딩 버튼 제어 함수 ---
    const toggleButtonLoading = (button, isLoading) => {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    };

    // --- 탭 1: 디자인 시스템 추천 기능 ---
    const recommendBtn = document.getElementById('recommendBtn');
    const coordPlane = document.getElementById('coordPlane');
    const coordMarker = document.getElementById('coordMarker');
    const targetAge = document.getElementById('targetAge');
    const servicePurpose = document.getElementById('servicePurpose');
    const recommendationResult = document.getElementById('recommendationResult');
    let selectedCoords = null;

    coordPlane.addEventListener('click', (e) => {
        const rect = coordPlane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        coordMarker.style.left = `${x}px`;
        coordMarker.style.top = `${y}px`;
        coordMarker.style.display = 'block';
        selectedCoords = { x: x / rect.width, y: y / rect.height };
    });

    recommendBtn.addEventListener('click', async () => {
        if (!selectedCoords) {
            alert('디자인 감성을 먼저 선택해주세요.');
            return;
        }
        toggleButtonLoading(recommendBtn, true);
        recommendationResult.classList.remove('placeholder-box');
        recommendationResult.textContent = '';
        
        const query = new URLSearchParams({
            x: selectedCoords.x, y: selectedCoords.y,
            age: targetAge.value, purpose: servicePurpose.value
        }).toString();

        try {
            const response = await fetch(`/.netlify/functions/recommend-design?${query}`);
            if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
            const result = await response.json();
            recommendationResult.textContent = result.recommendation;
        } catch (error) {
            recommendationResult.textContent = '오류가 발생했습니다: ' + error.message;
        } finally {
            toggleButtonLoading(recommendBtn, false);
        }
    });

    // --- 탭 2: HTML 분석 & AI 챗봇 ---
    const analyzeBtn = document.getElementById('analyzeBtn');
    const htmlFileInput = document.getElementById('htmlFileInput');
    const analysisResult = document.getElementById('analysisResult');
    const fileUploadText = document.getElementById('fileUploadText');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');

    htmlFileInput.addEventListener('change', () => {
        if (htmlFileInput.files.length > 0) {
            fileUploadText.textContent = `선택된 파일: ${htmlFileInput.files[0].name}`;
        } else {
            fileUploadText.textContent = '여기를 클릭하여 파일 업로드';
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        const file = htmlFileInput.files[0];
        if (!file) {
            alert('HTML 파일을 먼저 선택해주세요.');
            return;
        }
        toggleButtonLoading(analyzeBtn, true);
        analysisResult.classList.remove('placeholder-box');
        analysisResult.textContent = '';

        try {
            const fileContent = await file.text();
            const response = await fetch('/.netlify/functions/analyze-html', {
                method: 'POST',
                headers: { 'Content-Type': 'text/html' },
                body: fileContent
            });
            if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
            const result = await response.json();
            analysisResult.textContent = result.feedback;
        } catch (error) {
            analysisResult.textContent = '오류가 발생했습니다: ' + error.message;
        } finally {
            toggleButtonLoading(analyzeBtn, false);
        }
    });

    async function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        const userBubble = document.createElement('div');
        userBubble.className = 'user-message';
        userBubble.textContent = message;
        chatBox.appendChild(userBubble);
        chatInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        const aiTypingBubble = document.createElement('div');
        aiTypingBubble.className = 'ai-message typing';
        chatBox.appendChild(aiTypingBubble);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch(`/.netlify/functions/ai-chatbot?message=${encodeURIComponent(message)}`);
            if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
            const result = await response.json();
            
            aiTypingBubble.classList.remove('typing');
            const p = document.createElement('p');
            p.textContent = result.reply;
            aiTypingBubble.appendChild(p);

        } catch (error) {
            aiTypingBubble.classList.remove('typing');
            aiTypingBubble.textContent = '답변 생성 중 오류가 발생했습니다.';
        } finally {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
});