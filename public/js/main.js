let currentRubyResult = '';
let currentDictResult = '';
let recognition = null;
let isRecognizing = false;
let currentVoiceTarget = 'search';

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : window.location.origin;

const DEBUG = window.location.hostname === 'localhost';
if (DEBUG) {
    console.log(`🌐 API Base URL: ${API_BASE}`);
}

function initVoiceRecognition() {
    if (!recognition) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            if (DEBUG) console.log('🎤 音声認識開始');
            isRecognizing = true;
            updateVoiceButtonStatus('listening');
        };
        
        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            
            if (currentVoiceTarget === 'search') {
                document.getElementById('searchInput').value = result;
            } else if (currentVoiceTarget === 'dict') {
                document.getElementById('dictInput').value = result;
            }
            
            if (DEBUG) console.log(`🎤 音声認識結果 (${currentVoiceTarget}): "${result}"`);
            showNotification(`🎤 音声認識成功: "${result}"`, 'success');
        };
        
        recognition.onend = () => {
            if (DEBUG) console.log('🎤 音声認識終了');
            isRecognizing = false;
            updateVoiceButtonStatus('idle');
        };
        
        recognition.onerror = (event) => {
            console.error('音声認識エラー:', event.error);
            isRecognizing = false;
            updateVoiceButtonStatus('idle');
            
            let errorMessage = '';
            switch(event.error) {
                case 'not-allowed':
                    errorMessage = '🎤 マイクへのアクセスが拒否されました\n\nブラウザのアドレスバー左側のマイクアイコンをクリックして「許可」を選択してください';
                    break;
                case 'no-speech':
                    errorMessage = '🎤 音声が検出されませんでした。もう一度お試しください。';
                    break;
                case 'network':
                    errorMessage = '🎤 ネットワークエラーが発生しました。インターネット接続を確認してください。';
                    break;
                default:
                    errorMessage = `🎤 音声認識エラー: ${event.error}`;
            }
            alert(errorMessage);
        };
    }
    return true;
}

function updateVoiceButtonStatus(status) {
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceDictBtn = document.getElementById('voiceDictBtn');
    
    if (status === 'listening') {
        if (currentVoiceTarget === 'search' && voiceBtn) {
            voiceBtn.style.background = 'linear-gradient(45deg, #fc8181, #f56565)';
            voiceBtn.innerHTML = '<ruby>🔴<rt></rt></ruby> <ruby>認<rt>にん</rt></ruby><ruby>識<rt>しき</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>';
        } else if (currentVoiceTarget === 'dict' && voiceDictBtn) {
            voiceDictBtn.style.background = 'linear-gradient(45deg, #fc8181, #f56565)';
            voiceDictBtn.innerHTML = '<ruby>🔴<rt></rt></ruby> <ruby>認<rt>にん</rt></ruby><ruby>識<rt>しき</rt></ruby><ruby>中<rt>ちゅう</rt></ruby>';
        }
    } else {
        if (voiceBtn) {
            voiceBtn.style.background = 'linear-gradient(45deg, #9f7aea, #805ad5)';
            voiceBtn.innerHTML = '<ruby>🎤<rt></rt></ruby> <ruby>音<rt>おん</rt></ruby><ruby>声<rt>せい</rt></ruby><ruby>入<rt>にゅう</rt></ruby><ruby>力<rt>りょく</rt></ruby>';
        }
        if (voiceDictBtn) {
            voiceDictBtn.style.background = 'linear-gradient(45deg, #9f7aea, #805ad5)';
            voiceDictBtn.innerHTML = '<ruby>🎤<rt></rt></ruby> <ruby>音<rt>おん</rt></ruby><ruby>声<rt>せい</rt></ruby><ruby>入<rt>にゅう</rt></ruby><ruby>力<rt>りょく</rt></ruby>';
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1';
    
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: ${bgColor}; color: white; padding: 15px 20px;
        border-radius: 10px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px; word-wrap: break-word;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

function googleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert('検索したい内容を入力してください');
        return;
    }
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
    if (DEBUG) console.log(`🔍 Google検索: "${query}"`);
}

function startVoiceSearch() {
    currentVoiceTarget = 'search';
    startVoiceRecognition();
}

function startVoiceDict() {
    currentVoiceTarget = 'dict';
    startVoiceRecognition();
}

function startVoiceRecognition() {
    if (!initVoiceRecognition()) {
        alert('❌ お使いのブラウザは音声認識に対応していません\n\n対応ブラウザ:\n・Google Chrome\n・Microsoft Edge\n・Safari（一部）');
        return;
    }
    
    try {
        if (isRecognizing) {
            recognition.stop();
        } else {
            if (recognition.state !== 'inactive') {
                recognition.abort();
                setTimeout(() => {
                    recognition.start();
                }, 100);
            } else {
                recognition.start();
            }
        }
    } catch (error) {
        console.error('音声認識開始エラー:', error);
        isRecognizing = false;
        updateVoiceButtonStatus('idle');
        alert('🎤 音声認識を開始できませんでした。ブラウザがマイクアクセスをブロックしている可能性があります。');
    }
}

function searchWeblio() {
    const word = document.getElementById('dictInput').value.trim();
    if (!word) {
        alert('調べたい単語を入力してください');
        return;
    }
    
    const weblioUrl = `https://www.weblio.jp/content_find?query=${encodeURIComponent(word)}&searchType=exact`;
    window.open(weblioUrl, '_blank');
    
    const resultDiv = document.getElementById('dictResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-box result-success';
    resultDiv.innerHTML = `
        <div style="padding: 12px;">
            <div style="font-size: 16px; margin-bottom: 8px; color: #2d3748;">
                📚 <ruby>Weblio<rt>ウェブリオ</rt></ruby><ruby>辞書<rt>じしょ</rt></ruby>で「${word}」を<ruby>調<rt>しら</rt></ruby>べています ✅ <ruby>新<rt>あたら</rt></ruby>しいタブが<ruby>開<rt>ひら</rt></ruby>きました
            </div>
            <div style="background: #e6fffa; padding: 12px; border-radius: 6px; border: 1px solid #4fd1c7;">
                <div style="font-size: 14px; color: #0f766e;">
                    💡 <ruby>辞書<rt>じしょ</rt></ruby>の<ruby>意味<rt>いみ</rt></ruby>をコピーして、<ruby>下<rt>した</rt></ruby>の「ルビ<ruby>振<rt>ふ</rt></ruby>り」で<ruby>使<rt>つか</rt></ruby>えます
                </div>
            </div>
        </div>
    `;
    
    if (DEBUG) console.log(`📚 Weblio辞書検索: "${word}"`);
}

function searchGakken() {
    const word = document.getElementById('dictInput').value.trim();
    if (!word) {
        alert('調べたい単語を入力してください');
        return;
    }
    
    const gakkenUrl = `https://kids.gakken.co.jp/jiten/result/?s=${encodeURIComponent(word)}`;
    window.open(gakkenUrl, '_blank');
    
    const resultDiv = document.getElementById('dictResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-box result-success';
    resultDiv.innerHTML = `
        <div style="padding: 12px;">
            <div style="font-size: 16px; margin-bottom: 8px; color: #2d3748;">
                🏫 <ruby>学研<rt>がくけん</rt></ruby><ruby>辞書<rt>じしょ</rt></ruby>で「${word}」を<ruby>検索<rt>けんさく</rt></ruby> ✅ <ruby>新<rt>あたら</rt></ruby>しいタブが<ruby>開<rt>ひら</rt></ruby>きました
            </div>
            <div style="background: #e6fffa; padding: 12px; border-radius: 6px; border: 1px solid #4fd1c7;">
                <div style="font-size: 14px; color: #0f766e;">
                    💡 <ruby>子<rt>こ</rt></ruby>ども<ruby>向<rt>む</rt></ruby>けの<ruby>分<rt>わ</rt></ruby>かりやすい<ruby>説明<rt>せつめい</rt></ruby>が<ruby>見<rt>み</rt></ruby>つかります
                </div>
            </div>
        </div>
    `;
    
    if (DEBUG) console.log(`🏫 学研辞書検索: "${word}"`);
}

function clearDict() {
    document.getElementById('dictInput').value = '';
    document.getElementById('dictResult').style.display = 'none';
    currentDictResult = '';
    if (DEBUG) console.log('🗑️ 辞書セクション消去');
}

// 🆕 Yahoo! APIルビ振り機能（学年選択対応版）
async function addRuby() {
    const text = document.getElementById('rubyInput').value.trim();
    if (!text) {
        alert('ルビを振りたい文章を入力してください');
        return;
    }
    
    if (text.length > 2000) {
        alert('文章が長すぎます。2000文字以内にしてください。');
        return;
    }
    
    // 🆕 学年設定を取得
    const gradeSelect = document.getElementById('gradeSelect');
    const gradeValue = gradeSelect.value;
    const grade = gradeValue === '' ? 1 : parseInt(gradeValue);
    
    // 学年表示用テキスト
    const gradeText = gradeValue === '' ? '全ルビモード' : gradeSelect.options[gradeSelect.selectedIndex].text;
    
    const resultDiv = document.getElementById('rubyResult');
    const rubyBtn = document.getElementById('rubyBtn');
    const copyBtn = document.getElementById('copyBtn');
    
    // 段落構造検出
    const hasParagraphs = text.includes('\n') || /[◆●▲■♦]/.test(text);
    const paragraphInfo = hasParagraphs ? '📋 段落構造を検出しました' : '📄 単一段落として処理します';
    
    resultDiv.style.display = 'block';
    resultDiv.className = 'result-box result-loading';
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 1.5em; margin-bottom: 10px;">⚡</div>
            <div>Yahoo! Text Analytics API でルビを振っています...</div>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">
                📚 ${gradeText} | ${paragraphInfo}
            </div>
        </div>
    `;
    rubyBtn.disabled = true;
    copyBtn.style.display = 'none';
    
    try {
        if (DEBUG) console.log(`🌐 Yahoo! API呼び出し: ${API_BASE}/api/ruby-yahoo (学年: ${grade})`);
        
        const response = await fetch(`${API_BASE}/api/ruby-yahoo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text, 
                grade: grade,
                preserveParagraphs: true
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'レスポンス取得失敗');
            throw new Error(`サーバーエラー: ${response.status} ${response.statusText}\n詳細: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentRubyResult = data.rubyText;
            
            const modeText = data.paragraphMode ? '📋 段落構造保持モード' : '📄 シンプルモード';
            
            resultDiv.className = 'result-box result-success';
            resultDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 15px; color: #2d3748;">
                    ✨ ルビ振り完了！ (${modeText})
                </div>
                <div style="padding: 20px; background: #fff; border-radius: 10px; border: 2px solid #e2e8f0; line-height: 2.2;">
                    ${data.rubyText}
                </div>
                <div class="stats">
                    📊 ${text.length}文字 → ${data.segmentCount}セグメント処理完了
                </div>
            `;
            
            copyBtn.style.display = 'flex';
            document.getElementById('speakBtn').style.display = 'flex';
            document.getElementById('stopBtn').style.display = 'flex';
            if (DEBUG) console.log(`✨ Yahoo! API ルビ振り完了: ${data.segmentCount}セグメント (学年: ${data.grade}, 段落モード: ${data.paragraphMode})`);
        } else {
            throw new Error(data.error || 'ルビ振り処理でエラーが発生しました');
        }
        
    } catch (error) {
        console.error('Yahoo! API ルビ振りエラー:', error);
        resultDiv.className = 'result-box result-error';
        resultDiv.innerHTML = `
            <div style="padding: 20px;">
                <div style="font-size: 1.2em; margin-bottom: 15px; color: #c53030;">
                    ❌ Yahoo! API エラー
                </div>
                <div style="background: #fed7d7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <strong>エラー内容:</strong><br>
                    ${error.message}
                </div>
                <div style="background: #e6fffa; padding: 15px; border-radius: 8px;">
                    <strong>💡 解決方法:</strong><br>
                    ・Yahoo! APIキーの設定を確認してください<br>
                    ・少し時間をおいて再度お試しください<br>
                    ・文章を短くしてお試しください
                </div>
            </div>
        `;
    } finally {
        rubyBtn.disabled = false;
    }
}

// ルビセクション消去（学年選択もリセット）
function clearRuby() {
    document.getElementById('rubyInput').value = '';
    document.getElementById('rubyResult').style.display = 'none';
    document.getElementById('copyBtn').style.display = 'none';
    document.getElementById('speakBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    // 🆕 学年選択もリセット
    document.getElementById('gradeSelect').value = '';
    currentRubyResult = '';
    
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
    
    if (DEBUG) console.log('🗑️ ルビセクション消去（学年選択もリセット）');
}

function speakRubyResult() {
    if (!currentRubyResult) {
        alert('読み上げる内容がありません');
        return;
    }
    
    if (!('speechSynthesis' in window)) {
        alert('お使いのブラウザは音声読み上げに対応していません');
        return;
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentRubyResult;
    
    const rtElements = tempDiv.querySelectorAll('rt');
    rtElements.forEach(rt => rt.remove());
    
    const paragraphElements = tempDiv.querySelectorAll('.paragraph-heading, .paragraph-content, .paragraph-break');
    paragraphElements.forEach(el => {
        el.innerHTML = el.innerHTML + '\n\n';
    });
    
    const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b');
    headingElements.forEach(el => {
        el.innerHTML = el.innerHTML + '\n';
    });
    
    const blockElements = tempDiv.querySelectorAll('div, p, li');
    blockElements.forEach(el => {
        el.innerHTML = el.innerHTML + '\n';
    });
    
    const textToSpeak = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!textToSpeak.trim()) {
        alert('読み上げる文章がありません');
        return;
    }
    
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;
    
    const speakBtn = document.getElementById('speakBtn');
    
    utterance.onstart = () => {
        speakBtn.style.background = 'linear-gradient(45deg, #fc8181, #f56565)';
        speakBtn.innerHTML = '<ruby>🔊<rt></rt></ruby> <ruby>読<rt>よ</rt></ruby><ruby>み<rt></rt></ruby><ruby>上<rt>あ</rt></ruby><ruby>げ<rt></rt></ruby><ruby>中<rt>ちゅう</rt></ruby>';
        if (DEBUG) console.log('🔊 読み上げ開始');
        showNotification('🔊 読み上げています...', 'info');
    };
    
    utterance.onend = () => {
        speakBtn.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
        speakBtn.innerHTML = '<ruby>🔊<rt></rt></ruby> <ruby>読<rt>よ</rt></ruby><ruby>み<rt></rt></ruby><ruby>上<rt>あ</rt></ruby><ruby>げ<rt></rt></ruby>';
        if (DEBUG) console.log('🔊 読み上げ完了');
        showNotification('✅ 読み上げが完了しました', 'success');
    };
    
    utterance.onerror = (event) => {
        console.error('読み上げエラー:', event.error);
        speakBtn.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
        speakBtn.innerHTML = '<ruby>🔊<rt></rt></ruby> <ruby>読<rt>よ</rt></ruby><ruby>み<rt></rt></ruby><ruby>上<rt>あ</rt></ruby><ruby>げ<rt></rt></ruby>';
        showNotification('❌ 読み上げでエラーが発生しました', 'error');
    };
    
    speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        const speakBtn = document.getElementById('speakBtn');
        speakBtn.style.background = 'linear-gradient(45deg, #48bb78, #38a169)';
        speakBtn.innerHTML = '<ruby>🔊<rt></rt></ruby> <ruby>読<rt>よ</rt></ruby><ruby>み<rt></rt></ruby><ruby>上<rt>あ</rt></ruby><ruby>げ<rt></rt></ruby>';
        
        if (DEBUG) console.log('⏹️ 読み上げ停止');
        showNotification('⏹️ 読み上げを停止しました', 'info');
    }
}

function copyResult() {
    if (!currentRubyResult) {
        alert('コピーする結果がありません');
        return;
    }
    
    try {
        const optimizedHTML = `
            <div style="font-family: 'BIZ UDPゴシック', 'Yu Gothic UI', 'Meiryo UI', 'Hiragino Sans', sans-serif; font-size: 16px; line-height: 2.2;">
                ${currentRubyResult.replace(/<ruby>/g, '<ruby style="font-size: 16px;">').replace(/<rt>/g, '<rt style="font-size: 8px; color: #666;">')}
            </div>
        `;
        
        const plainText = currentRubyResult.replace(/<[^>]*>/g, '');
        
        if (navigator.clipboard && navigator.clipboard.write) {
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([optimizedHTML], { type: 'text/html' }),
                'text/plain': new Blob([plainText], { type: 'text/plain' })
            });
            
            navigator.clipboard.write([clipboardItem]).then(() => {
                showCopySuccess('Word最適化版');
                if (DEBUG) console.log('📋 Word最適化HTML + テキストをコピー完了');
            }).catch(err => {
                if (DEBUG) console.log('HTML+テキストコピー失敗、フォールバック実行');
                fallbackCopy();
            });
        } else {
            fallbackCopy();
        }
        
    } catch (error) {
        console.error('コピーエラー:', error);
        alert('コピーに失敗しました');
    }
}

function fallbackCopy() {
    const textArea = document.createElement('textarea');
    textArea.value = currentRubyResult.replace(/<[^>]*>/g, '');
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showCopySuccess('テキスト版');
    if (DEBUG) console.log('📋 テキストをコピー完了（フォールバック）');
}

function showCopySuccess(type) {
    const notification = document.createElement('div');
    notification.className = 'copy-success';
    notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">📋 コピー完了！</div>
        <div style="font-size: 13px;">
            ${type}をコピーしました<br>
            Wordに貼り付けると文字16px、ルビ8pxで表示されます
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 4000);
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                if (document.activeElement.id === 'searchInput') {
                    e.preventDefault();
                    googleSearch();
                } else if (document.activeElement.id === 'dictInput') {
                    e.preventDefault();
                    searchWeblio();
                } else if (document.activeElement.id === 'rubyInput') {
                    e.preventDefault();
                    addRuby();
                }
                break;
            case 'c':
                if (currentRubyResult && document.activeElement.id === 'rubyInput') {
                    e.preventDefault();
                    copyResult();
                }
                break;
        }
    }
});

window.addEventListener('load', () => {
    if (DEBUG) {
        console.log('📚 調べる窓口 v5.0 - 学年選択機能付き完全版準備完了！');
        console.log(`🌐 動作環境: ${API_BASE === window.location.origin ? 'Vercel本番' : 'ローカル開発'}`);
        console.log(`🔌 API接続先: ${API_BASE}/api/ruby-yahoo`);
        console.log('🆕 学年選択機能: Yahoo! API gradeパラメータ対応');
        console.log('⌨️  ショートカット: Ctrl+Enter=実行, Ctrl+C=コピー');
    }
    
    document.getElementById('searchInput').focus();
});