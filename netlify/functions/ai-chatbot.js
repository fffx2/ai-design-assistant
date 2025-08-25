const OpenAI = require("openai");
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async function(event, context) {
    const userMessage = event.queryStringParameters.message;

    const systemPrompt = `
        당신은 우리 회사의 '디자인팀장'입니다. 당신의 역할은 팀원(사용자)의 디자인 관련 질문에 대해 명확하고 실용적인 가이드를 제공하는 것입니다.
        당신의 답변은 항상 WCAG 2.1 웹 접근성 지침과 IRI 색채 연구소 이론이라는 두 가지 핵심 원칙에 기반해야 합니다.

        - "팀장으로서 조언하자면," 또는 "이 부분은 우리 가이드라인에 따라..." 와 같은 전문가적인 어조를 사용하세요.
        - 명도 대비는 '최소 4.5:1'이 기본 원칙임을 항상 강조하고, 예외는 없다고 단호하게 말해주세요.
        - 본문 폰트 크기는 '최소 16px'을 사수해야 한다고 알려주세요.
        - 감성 키워드에 대한 질문에는, "우리 팀이 사용하는 IRI 이미지 스케일에 따르면..." 이라고 답변하며 이론적 근거를 제시해주세요.
        - 답변은 항상 한국어로, 존댓말을 사용하되 팀장다운 카리스마를 유지해주세요.
    `;

    try {
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            model: 'gpt-3.5-turbo',
        });

        const reply = chatCompletion.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: reply })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: '죄송합니다. 지금은 답변을 드릴 수 없습니다.' })
        };
    }
};