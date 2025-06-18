// 段落情報を保持するYahoo! API実装（特殊文字対応版）
// api/ruby-yahoo.js

// 段落構造解析関数
function analyzeParagraphStructure(text) {
    const lines = text.split('\n');
    const structure = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        structure.push({
            content: line,
            trimmed: trimmed,
            isHeading: /^[◆●▲■♦]/.test(trimmed), // 見出しマーク検出
            isEmpty: trimmed === '',
            isSpacing: /^\s*$/.test(line), // 空白のみの行
            lineNumber: i,
            originalLength: line.length
        });
    }
    
    return structure;
}

// 段落構造付きでテキストを再構築
function reconstructWithParagraphs(yahooSegments, originalText) {
    const paragraphStructure = analyzeParagraphStructure(originalText);
    
    // Yahoo!のセグメントから文字位置マップを作成
    let segmentPosition = 0;
    const positionMap = new Map();
    
    for (const segment of yahooSegments) {
        const surface = segment.surface;
        const startPos = segmentPosition;
        const endPos = segmentPosition + surface.length;
        
        positionMap.set(startPos, {
            segment: segment,
            startPos: startPos,
            endPos: endPos
        });
        
        segmentPosition += surface.length;
    }
    
    // 段落ごとにHTML構築
    let result = '';
    let currentPosition = 0;
    
    for (const para of paragraphStructure) {
        if (para.isEmpty || para.isSpacing) {
            // 空行はそのまま
            result += '<div class="paragraph-break"></div>';
            currentPosition += para.originalLength + 1; // +1 for \n
            continue;
        }
        
        if (para.isHeading) {
            // 見出し行
            const headingHTML = processLineWithRuby(para.trimmed, currentPosition, positionMap);
            result += `<div class="paragraph-heading">${headingHTML}</div>`;
        } else {
            // 通常の段落
            const paragraphHTML = processLineWithRuby(para.trimmed, currentPosition, positionMap);
            result += `<div class="paragraph-content">${paragraphHTML}</div>`;
        }
        
        currentPosition += para.originalLength + 1; // +1 for \n
    }
    
    return result;
}

// 1行分のテキストをルビ付きHTMLに変換
function processLineWithRuby(lineText, startPos, positionMap) {
    if (!lineText.trim()) return '';
    
    let result = '';
    let currentPos = startPos;
    
    // この行に含まれるセグメントを順次処理
    for (let i = 0; i < lineText.length; ) {
        let segmentFound = false;
        
        // 現在位置からのセグメントを探索
        for (const [pos, data] of positionMap) {
            if (pos >= currentPos && pos <= currentPos + 10) { // 前後の許容範囲
                const segment = data.segment;
                const surface = segment.surface;
                
                // テキスト一致確認
                if (lineText.substring(i, i + surface.length) === surface) {
                    // ルビ処理
                    if (segment.furigana && segment.furigana !== surface) {
                        result += `<ruby>${surface}<rt>${segment.furigana}</rt></ruby>`;
                    } else {
                        result += surface;
                    }
                    
                    i += surface.length;
                    currentPos += surface.length;
                    segmentFound = true;
                    break;
                }
            }
        }
        
        if (!segmentFound) {
            // セグメントが見つからない場合は1文字そのまま
            result += lineText[i];
            i++;
            currentPos++;
        }
    }
    
    return result;
}

// シンプルな段落なしバージョン（フォールバック用）
function simpleRubyConversion(yahooSegments) {
    let result = '';
    
    for (const segment of yahooSegments) {
        const surface = segment.surface;
        const furigana = segment.furigana;
        
        if (furigana && furigana !== surface) {
            result += `<ruby>${surface}<rt>${furigana}</rt></ruby>`;
        } else {
            result += surface;
        }
    }
    
    return result;
}

export default async function handler(req, res) {
    // CORS対応
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { text: rawText, grade = 1, preserveParagraphs = true } = req.body;
        
        // 入力検証
        if (!rawText || typeof rawText !== 'string') {
            return res.status(400).json({ error: '有効なテキストを入力してください' });
        }
        
        // 🆕 特殊文字クリーニング（追加部分）
        let text = rawText
            .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '') // ゼロ幅文字除去
            .replace(/\*\*(.*?)\*\*/g, '$1') // **太字** → 太字
            .replace(/\*(.*?)\*/g, '$1') // *斜体* → 斜体  
            .replace(/^\s*[\*\-\+]\s+/gm, '') // リスト記号除去
            .replace(/&nbsp;/g, ' ') // &nbsp; → スペース
            .replace(/&amp;/g, '&') // &amp; → &
            .replace(/&lt;/g, '<') // &lt; → <
            .replace(/&gt;/g, '>') // &gt; → >
            .replace(/&quot;/g, '"') // &quot; → "
            .replace(/&#39;/g, "'") // &#39; → '
            .replace(/[ \t]+/g, ' ') // 連続スペース → 単一スペース
            .trim(); // 前後空白除去
        
        if (text.length > 2000) {
            return res.status(400).json({ error: 'テキストが長すぎます（最大2000文字）' });
        }
        
        console.log(`🎯 Yahoo! API呼び出し開始: "${text.substring(0, 30)}..."`);
        console.log(`📋 段落保持モード: ${preserveParagraphs ? 'ON' : 'OFF'}`);
        console.log(`✂️ クリーニング: ${rawText.length}文字 → ${text.length}文字`);
        
        // Yahoo! Text Analytics API呼び出し
        const yahooResponse = await fetch('https://jlp.yahooapis.jp/FuriganaService/V2/furigana', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `Yahoo AppID: ${process.env.YAHOO_APP_ID}`
            },
            body: JSON.stringify({
                id: "1",
                jsonrpc: "2.0",
                method: "jlp.furiganaservice.furigana",
                params: {
                    q: text,
                    grade: parseInt(grade)
                }
            })
        });
        
        if (!yahooResponse.ok) {
            throw new Error(`Yahoo! API Error: ${yahooResponse.status}`);
        }
        
        const yahooData = await yahooResponse.json();
        
        if (yahooData.error) {
            throw new Error(`Yahoo! API Error: ${yahooData.error.message}`);
        }
        
        // レスポンス形式変換
        const segments = yahooData.result.word || [];
        let rubyHTML = '';
        
        // 段落保持モードの分岐
        if (preserveParagraphs && (text.includes('\n') || /[◆●▲■♦]/.test(text))) {
            console.log('📝 段落構造を検出 - 段落保持モードで処理');
            try {
                rubyHTML = reconstructWithParagraphs(segments, text);
                console.log('✅ 段落保持処理完了');
            } catch (error) {
                console.log('⚠️ 段落処理でエラー、シンプルモードにフォールバック:', error.message);
                rubyHTML = simpleRubyConversion(segments);
            }
        } else {
            console.log('📄 シンプルモードで処理');
            rubyHTML = simpleRubyConversion(segments);
        }
        
        console.log(`✅ Yahoo! API処理完了: ${segments.length}セグメント`);
        
        res.json({
            success: true,
            rubyText: rubyHTML,
            segmentCount: segments.length,
            inputLength: rawText.length,
            cleanedLength: text.length,
            provider: 'Yahoo! Text Analytics API (特殊文字対応版)',
            grade: grade,
            paragraphMode: preserveParagraphs && (text.includes('\n') || /[◆●▲■♦]/.test(text))
        });
        
    } catch (error) {
        console.error('❌ Yahoo! API ルビ振りエラー:', error);
        
        res.status(500).json({
            error: 'ルビ振り処理中にエラーが発生しました',
            details: error.message,
            provider: 'Yahoo! API'
        });
    }
}