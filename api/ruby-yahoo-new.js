// 段落情報を保持するYahoo! API実装 
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
            isHeading: /[◆●▲■?]/.test(trimmed), 
            isEmpty: trimmed === '', 
            isSpacing: /\s*$/.test(line), 
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
            currentPosition += para.originalLength + 1; 
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
 
        currentPosition += para.originalLength + 1; 
    } 
    return result; 
} 
 
// 1行分のテキストをルビ付きHTMLに変換 
function processLineWithRuby(lineText, startPos, positionMap) { 
function processLineWithRuby(lineText, startPos, positionMap) { 
    if (!lineText.trim()) return ''; 
 
