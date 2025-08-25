const OpenAI = require("openai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const rulesPath = path.resolve(__dirname, '../../rules.json');
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

exports.handler = async function(event, context) {
    if (!process.env.OPENAI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ recommendation: "치명적 오류: 서버에 OPENAI_API_KEY가 설정되지 않았습니다." }) };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
        const { x, y, age, purpose } = event.queryStringParameters;
        let groupName;
        if (parseFloat(y) < 0.5) {
            groupName = (parseFloat(x) < 0.5) ? "Soft + Dynamic" : "Soft + Static";
        } else {
            groupName = (parseFloat(x) < 0.5) ? "Hard + Dynamic" : "Hard + Static";
        }

        const group = rules.iri_color_system.groups.find(g => g.name === groupName);
        if (!group) throw new Error("해당 좌표의 그룹을 찾을 수 없습니다.");
        
        const primaryKeyword = group.keywords[0];
        const primaryColor = rules.iri_color_system.keyword_colors[primaryKeyword];

        const prompt = `
            당신은 수석 UI/UX 컨설턴트입니다. 다음 정보를 바탕으로 구체적인 웹사이트 디자인 시스템을 추천해주세요.
            <프로젝트 정보>
            - 핵심 타겟 연령: ${age || '모든 연령'}
            - 서비스 목적: ${purpose}
            - 추구하는 디자인 감성: ${group.description} (${group.name})
            <준수해야 할 규칙>
            1. '${group.description}' 분위기를 표현하기 위해, '${primaryKeyword}' 키워드의 대표 색상인 '${primaryColor}'를 중심으로 색상 조합을 구성해야 합니다.
            2. 모든 텍스트와 배경색 조합은 WCAG 2.1 지침에 따라 명도 대비가 4.5:1 이상이어야 합니다.
            <요청 사항>
            위 정보를 종합하여 Primary, Secondary, Accent 색상 시스템을 HEX 코드와 함께 추천하고, 각 색상의 역할과 선택 이유를 타겟 연령과 서비스 목적에 맞게 설명해주세요.
        `;
        
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }], model: 'gpt-3.5-turbo',
        });

        const recommendation = chatCompletion.choices[0].message.content;
        return { statusCode: 200, body: JSON.stringify({ recommendation }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ recommendation: 'AI 추천 생성 중 오류가 발생했습니다: ' + error.message }) };
    }
};