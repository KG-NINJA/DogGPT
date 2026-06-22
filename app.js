document.addEventListener("DOMContentLoaded", () => {
    const wordButtons = document.querySelectorAll(".word-button");
    const selectedWordSpan = document.getElementById("selected-word");
    const placeholder = document.getElementById("display-placeholder");
    const ttsToggle = document.getElementById("tts-toggle");
    const langToggle = document.getElementById("lang-toggle");
    const actionArea = document.getElementById("action-area");
    const promptPreview = document.getElementById("prompt-preview");
    const openGptBtn = document.getElementById("open-gpt-btn");
    const particleContainer = document.getElementById("particle-container");
    const resetBtn = document.getElementById("reset-btn");

    // UIパーツの日本語/英語文言切り替え用マッピング
    const uiTexts = {
        ja: {
            subtitle: "犬が自分でChatGPTに話しかけるタッチボード",
            placeholder: "ボタンをタッチしてね！",
            statusMsg: "📋 クリップボードに「犬の言葉」をコピーしました！",
            instruction: "※別ウィンドウで開いたChatGPTの入力欄に「貼り付け」して送信してください。",
            gptBtn: "💬 ChatGPTを別ウィンドウで開く",
            resetConfirm: "リセットしました"
        },
        en: {
            subtitle: "Touch board for dogs to talk to ChatGPT",
            placeholder: "Touch a button!",
            statusMsg: "📋 Copied the dog's prompt to clipboard!",
            instruction: "*Paste it into the ChatGPT input field in the opened window.",
            gptBtn: "💬 Open ChatGPT in a new window",
            resetConfirm: "Reset complete"
        }
    };

    // ワードデータ一覧
    const wordTranslations = {
        "おやつ": { ja: "おやつ", en: "Treat" },
        "さんぽ": { ja: "さんぽ", en: "Walk" },
        "あそぼう": { ja: "あそぼう", en: "Play" },
        "なでて": { ja: "なでて", en: "Pet me" },
        "おそと": { ja: "おそと", en: "Outside" },
        "おなかすいた": { ja: "おなかすいた", en: "Hungry" },
        "みず": { ja: "みず", en: "Water" },
        "だいすき": { ja: "だいすき", en: "Love you" }
    };

    let selectedWords = [];

    // 現在選択されている言語 ("ja" または "en")
    let currentLang = "ja";

    // 言語トグルのリスナー
    langToggle.addEventListener("change", () => {
        currentLang = langToggle.checked ? "en" : "ja";
        updateLanguageUI();
    });

    wordButtons.forEach(button => {
        const handleInteraction = (e) => {
            e.preventDefault();
            
            // data-word-jaから引いて翻訳マッピングを取得
            const baseWordJa = button.getAttribute("data-word-ja");
            const wordObj = wordTranslations[baseWordJa];
            const word = currentLang === "en" ? wordObj.en : wordObj.ja;
            
            const emoji = button.querySelector(".emoji").textContent;
            
            button.classList.add("active");
            setTimeout(() => button.classList.remove("active"), 150);

            createParticles(e, emoji);
            addWord(wordObj); // 翻訳対応オブジェクトを渡す
        };

        button.addEventListener("touchstart", handleInteraction, { passive: false });
        button.addEventListener("mousedown", handleInteraction);
    });

    // リセット処理
    resetBtn.addEventListener("click", () => {
        selectedWords = [];
        selectedWordSpan.textContent = "";
        placeholder.style.display = "block";
        actionArea.style.display = "none";
        
        if (ttsToggle.checked && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(uiTexts[currentLang].resetConfirm);
            utterance.lang = currentLang === "en" ? "en-US" : "ja-JP";
            window.speechSynthesis.speak(utterance);
        }
    });

    // ワードを追加してプロンプト構築
    function addWord(wordObj) {
        placeholder.style.display = "none";
        selectedWords.push(wordObj);
        
        // 画面上の結合表示
        const displayList = selectedWords.map(w => "「" + (currentLang === "en" ? w.en : w.ja) + "」");
        selectedWordSpan.textContent = displayList.join(" ➔ ");

        // 今タッチされた単語の読み上げ
        if (ttsToggle.checked) {
            speakWord(currentLang === "en" ? wordObj.en : wordObj.ja);
        }

        // プロンプト構築 (言語別)
        let prompt = "";
        if (currentLang === "en") {
            const joinedWords = selectedWords.map(w => "'" + w.en + "'").join(" and ");
            prompt = "I am a dog! I am feeling " + joinedWords + " right now. Let's talk directly to me about this!";
        } else {
            const joinedWords = selectedWords.map(w => "『" + w.ja + "』").join("と");
            prompt = "ぼくは犬だよ。いま" + joinedWords + "な気分んだ。これについてぼくに直接お話ししよう！";
        }
        
        promptPreview.textContent = prompt;
        copyToClipboard(prompt);

        openGptBtn.href = "https://chatgpt.com/?q=" + encodeURIComponent(prompt);
        actionArea.style.display = "flex";
    }

    // 音声発話
    function speakWord(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = currentLang === "en" ? "en-US" : "ja-JP";
            utterance.rate = 1.0;
            utterance.pitch = currentLang === "en" ? 1.0 : 1.2; // 英語は標準的な可愛いトーン

            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
        }
    }

    // UI表記全体の言語を動的アップデート
    function updateLanguageUI() {
        const textSet = uiTexts[currentLang];
        
        // ヘッダーのサブタイトル
        document.getElementById("app-subtitle").textContent = textSet.subtitle;
        
        // プレースホルダー
        placeholder.textContent = textSet.placeholder;
        
        // クリップボード等の指示文
        document.getElementById("status-msg").textContent = textSet.statusMsg;
        document.getElementById("instruction-msg").textContent = textSet.instruction;
        openGptBtn.textContent = textSet.gptBtn;

        // ボタンのラベルを全件更新
        wordButtons.forEach(button => {
            const baseWordJa = button.getAttribute("data-word-ja");
            const wordObj = wordTranslations[baseWordJa];
            const labelSpan = button.querySelector(".label");
            labelSpan.textContent = currentLang === "en" ? wordObj.en : wordObj.ja;
        });

        // 既に選択済みの単語リストがあれば再構築
        if (selectedWords.length > 0) {
            const displayList = selectedWords.map(w => "「" + (currentLang === "en" ? w.en : w.ja) + "」");
            selectedWordSpan.textContent = displayList.join(" ➔ ");

            // プロンプトも再生成してコピー
            let prompt = "";
            if (currentLang === "en") {
                const joinedWords = selectedWords.map(w => "'" + w.en + "'").join(" and ");
                prompt = "I am a dog! I am feeling " + joinedWords + " right now. Let's talk directly to me about this!";
            } else {
                const joinedWords = selectedWords.map(w => "『" + w.ja + "』").join("と");
                prompt = "ぼくは犬だよ。いま" + joinedWords + "な気分んだ。これについてぼくに直接お話ししよう！";
            }
            promptPreview.textContent = prompt;
            copyToClipboard(prompt);
            openGptBtn.href = "https://chatgpt.com/?q=" + encodeURIComponent(prompt);
        }
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                console.log("Copy success");
            }).catch(err => {
                console.error("Copy failed", err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }

    function createParticles(e, emoji) {
        let clientX = 0;
        let clientY = 0;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        for (let i = 0; i < 6; i++) {
            const particle = document.createElement("span");
            particle.classList.add("particle");
            particle.textContent = emoji;
            
            particle.style.left = clientX + "px";
            particle.style.top = clientY + "px";

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 80;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance - 50;
            const r = Math.random() * 360 - 180;

            particle.style.setProperty("--x", x + "px");
            particle.style.setProperty("--y", y + "px");
            particle.style.setProperty("--r", r + "deg");

            particleContainer.appendChild(particle);

            particle.addEventListener("animationend", () => {
                particle.remove();
            });
        }
    }
});
