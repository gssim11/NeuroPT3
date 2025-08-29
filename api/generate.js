// /api/generate.js

// Vercel 환경에서 서버리스 함수로 작동하도록 설정합니다.
export default async function handler(request, response) {
    // 보안을 위해 POST 요청만 허용합니다.
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'POST 요청만 허용됩니다.' });
    }

    try {
        // 클라이언트(index.html)에서 보낸 프롬프트(요청 내용)를 받습니다.
        const { prompt } = request.body;
        if (!prompt) {
             return response.status(400).json({ error: '프롬프트가 필요합니다.' });
        }

        // Vercel에 저장된 비밀 API 키를 안전하게 불러옵니다.
        // 이 키는 절대로 외부에 노출되지 않습니다.
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return response.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
        }

        // Google AI에 보낼 요청 주소와 내용을 준비합니다.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        // 우리 서버에서 Google AI 서버로 직접 요청을 보냅니다. (서버 대 서버 통신)
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Google AI로부터 받은 응답에 문제가 있는지 확인합니다.
        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Google API 오류: ${geminiResponse.status} ${errorText}`);
        }

        // 성공적인 응답 데이터를 받아옵니다.
        const data = await geminiResponse.json();

        // 받아온 데이터를 원래 요청했던 클라이언트(index.html)에게 그대로 전달합니다.
        response.status(200).json(data);

    } catch (error) {
        // 중간에 문제가 생기면 에러를 기록하고 클라이언트에게 알려줍니다.
        console.error('Vercel 함수 오류:', error);
        response.status(500).json({ error: error.message });
    }
}
