import kuromoji from 'kuromoji';
import { readdir, access } from 'fs/promises';

let tokenizer = null;

function katakanaToHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, function(match) {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
}

function tokensToRubyHTML(tokens) {
    let result = '';
    
    for (const token of tokens) {
        const surface = token.surface_form;
        const reading = token.reading;
        
        if (!reading || 
            reading === surface || 
            /^[ひらがな\u3040-\u309f]+$/.test(surface) || 
            /^[カタカナ\u30a0-\u30ff]+$/.test(surface) ||
            /^[0-9０-９a-zA-Zａ-ｚＡ-Ｚ]+$/.test(surface) ||
            /^[^\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff\w]+$/.test(surface)) {
            result += surface;
        } else {
            const hiraganaReading = katakanaToHiragana(reading);
            result += `<ruby>${surface}<rt>${hiraganaReading}</rt></ruby>`;
        }
    }
    
    return result;
}

export default async function handler(req, res) {
    console.log('🚀 API関数が呼び出されました');
    console.log('📝 リクエストメソッド:', req.method);
    console.log('📝 リクエストURL:', req.url);
    
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
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: '有効なテキストを入力してください' });
        }
        
        if (text.length > 2000) {
            return res.status(400).json({ error: 'テキストが長すぎます（最大2000文字）' });
        }
        
        if (!tokenizer) {
            try {
                console.log('🔍 デバッグ開始');
                console.log('📁 process.cwd():', process.cwd());
                
                // publicフォルダの確認
                const publicFiles = await readdir('./public');
                console.log('📂 public フォルダ内容:', publicFiles);
                
                // dictフォルダの確認
                const dictFiles = await readdir('./public/dict');
                console.log('📚 dict フォルダ内容:', dictFiles);
                
                // base.dat.gzの存在確認
                await access('./public/dict/base.dat.gz');
                console.log('✅ base.dat.gz 見つかりました');
                
            } catch (error) {
                console.error('❌ ファイル確認エラー:', error);
            }
            
            console.log('🔍 kuromoji初期化開始');
            console.log('📁 dicPath:', process.cwd() + '/public/dict/');
            
            tokenizer = await new Promise((resolve, reject) => {
                kuromoji.builder({ 
                    dicPath: process.cwd() + '/public/dict/'
                }).build((err, _tokenizer) => {
                    if (err) {
                        console.error('❌ kuromoji初期化エラー:', err);
                        reject(err);
                    } else {
                        console.log('✅ kuromoji初期化成功');
                        resolve(_tokenizer);
                    }
                });
            });
        }
        
        const tokens = tokenizer.tokenize(text);
        const rubyText = tokensToRubyHTML(tokens);
        
        res.json({
            success: true,
            rubyText: rubyText,
            tokenCount: tokens.length,
            processingTime: 50
        });
        
    } catch (error) {
        console.error('Ruby processing error:', error);
        res.status(500).json({ 
            error: 'ルビ振り処理中にエラーが発生しました',
            details: error.message
        });
    }
}