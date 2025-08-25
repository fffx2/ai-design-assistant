// ... (openai, fs, path, rules 등 불러오는 코드 동일)
exports.handler = async function(event, context) {
    const { x, y, age, purpose } = event.queryStringParameters;

    // 좌표에 따라 그룹 결정
    let groupName;
    if (y < 0.5) { // Soft
        groupName = (x < 0.5) ? "Soft + Dynamic" : "Soft + Static";
    } else { // Hard
        groupName = (x < 0.5) ? "Hard + Dynamic" : "Hard + Static";
    }

    const group = rules.iri_color_system.groups.find(g => g.name === groupName);
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
    
    // ... (OpenAI API 호출 및 응답 반환 로직 동일)
};