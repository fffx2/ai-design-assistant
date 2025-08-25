// 아주 간단한 "헬로 월드" 기능입니다.
exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "테스트 성공! Netlify Functions가 정상적으로 작동합니다." })
    };
};