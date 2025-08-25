const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const tinycolor = require('tinycolor2');

const rulesPath = path.resolve(__dirname, '../../rules.json');
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const htmlContent = event.body;
        const $ = cheerio.load(htmlContent);

        let feedback = "✅ HTML 파일 접근성 분석 결과:\n\n";
        let errorsFound = 0;

        // --- 규칙 1: <h1> 태그 검사 ---
        const h1Count = $('h1').length;
        if (h1Count === 0) {
            feedback += `❌ [H1 제목] 페이지의 메인 제목인 <h1> 태그가 없습니다.\n`;
            errorsFound++;
        } else if (h1Count > 1) {
            feedback += `❌ [H1 제목] <h1> 태그는 페이지에 하나만 있어야 합니다. (현재 ${h1Count}개 발견)\n`;
            errorsFound++;
        }

        // --- 규칙 2: 폰트 크기 검사 ---
        const bodyFontSize = parseInt($('body').css('font-size'));
        const minSize = rules.wcag_rules.minimum_body_px;
        if (bodyFontSize && bodyFontSize < minSize) {
            feedback += `❌ [폰트 크기] 본문 폰트 크기가 ${bodyFontSize}px 입니다. 최소 기준인 ${minSize}px보다 작습니다.\n`;
            errorsFound++;
        }

        // --- 규칙 3: 명도 대비 검사 ---
        $('p, h1, h2, h3, h4, h5, h6, span, a, li, div').each((index, element) => {
            const el = $(element);
            const text = el.clone().children().remove().end().text().trim(); // 자식 요소 제외하고 순수 텍스트만 추출
            if (!text) return; // 텍스트가 없는 요소는 건너뛰기

            const textColor = el.css('color');
            const bgColor = el.css('background-color') || $('body').css('background-color') || '#FFFFFF';

            if (textColor && bgColor) {
                const ratio = tinycolor.readability(bgColor, textColor);
                const requiredRatio = rules.wcag_rules.contrast_ratio.AA_normal;

                if (ratio < requiredRatio) {
                    feedback += `❌ [명도 대비] "${text.substring(0, 15)}..." 텍스트의 명도 대비가 ${ratio.toFixed(2)}:1 입니다. 기준인 ${requiredRatio}:1 보다 낮습니다.\n`;
                    errorsFound++;
                }
            }
        });

        // --- 규칙 4: 이미지 alt 속성 검사 ---
        $('img').each((index, element) => {
            if (!$(element).attr('alt')) {
                feedback += `❌ [이미지] ${index + 1}번째 <img> 태그에 alt 속성이 없습니다.\n`;
                errorsFound++;
            }
        });

        if (errorsFound === 0) {
            feedback += "🎉 중요한 접근성 기준(H1, 폰트 크기, 명도 대비, 이미지 alt)을 모두 준수했습니다!";
        }

        return { statusCode: 200, body: JSON.stringify({ feedback }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ feedback: '파일 분석 중 오류가 발생했습니다: ' + error.message }) };
    }
};