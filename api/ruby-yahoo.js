// Yahoo! Text Analytics API を使用したルビ振り実装
// api/ruby-yahoo.js
// kuromoji.js の代替として Yahoo! API を使用

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
        const { text, grade = 1 } = req.body;
        
        // 入力検証
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: '有効なテキストを入力してください' });
        }
        
        if (text.length > 1000) {
            return res.status(400).json({ error: 'テキストが長すぎます（最大1000文字）' });
        }
        
        console.log(`🎯 Yahoo! API呼び出し開始: "${text.substring(0, 30)}..."`);
        
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
                    grade: parseInt(grade) // 1=小1以上, 2=小2以上, etc.
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
        const word = yahooData.result.word || [];
        let rubyHTML = '';
        
        for (const segment of word) {
            if (segment.furigana && segment.furigana !== segment.surface) {
                // ルビが必要な場合
                rubyHTML += `<ruby>${segment.surface}<rt>${segment.furigana}</rt></ruby>`;
            } else {
                // ルビ不要の場合（ひらがな・カタカナ・記号等）
                rubyHTML += segment.surface;
            }
        }
        
        console.log(`✅ Yahoo! API処理完了: ${word.length}セグメント`);
        
        res.json({
            success: true,
            rubyText: rubyHTML,
            segmentCount: word.length,
            inputLength: text.length,
            provider: 'Yahoo! Text Analytics API',
            grade: grade
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