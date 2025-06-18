// �i������ێ�����Yahoo! API���� 
// api/ruby-yahoo.js 
 
// �i���\����͊֐� 
function analyzeParagraphStructure(text) { 
    const lines = text.split('\n'); 
    const structure = []; 
 
    for (let i = 0; i < lines.length; i++) { 
        const line = lines[i]; 
        const trimmed = line.trim(); 
 
        structure.push({ 
            content: line, 
            trimmed: trimmed, 
            isHeading: /[��������?]/.test(trimmed), 
            isEmpty: trimmed === '', 
            isSpacing: /\s*$/.test(line), 
            lineNumber: i, 
            originalLength: line.length 
        }); 
    } 
    return structure; 
} 
 
// �i���\���t���Ńe�L�X�g���č\�z 
function reconstructWithParagraphs(yahooSegments, originalText) { 
    const paragraphStructure = analyzeParagraphStructure(originalText); 
 
    // Yahoo!�̃Z�O�����g���當���ʒu�}�b�v���쐬 
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
 
    // �i�����Ƃ�HTML�\�z 
    let result = ''; 
    let currentPosition = 0; 
 
    for (const para of paragraphStructure) { 
        if (para.isEmpty || para.isSpacing) { 
            // ��s�͂��̂܂� 
            result += '<div class="paragraph-break"></div>'; 
            currentPosition += para.originalLength + 1; 
            continue; 
        } 
 
        if (para.isHeading) { 
            // ���o���s 
            const headingHTML = processLineWithRuby(para.trimmed, currentPosition, positionMap); 
            result += `<div class="paragraph-heading">${headingHTML}</div>`; 
        } else { 
            // �ʏ�̒i�� 
            const paragraphHTML = processLineWithRuby(para.trimmed, currentPosition, positionMap); 
            result += `<div class="paragraph-content">${paragraphHTML}</div>`; 
        } 
 
        currentPosition += para.originalLength + 1; 
    } 
    return result; 
} 
 
// 1�s���̃e�L�X�g�����r�t��HTML�ɕϊ� 
function processLineWithRuby(lineText, startPos, positionMap) { 
function processLineWithRuby(lineText, startPos, positionMap) { 
    if (!lineText.trim()) return ''; 
 
