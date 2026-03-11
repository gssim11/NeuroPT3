export default async function handler(req, res) {
    // 1. CORS 처리 (다른 도메인에서 호출하는 것을 방지할 수 있습니다)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청에 대한 빠른 응답
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Vercel 환경 변수에서 API 키 불러오기 (보안 유지)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: '서버 환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다.' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 제공되지 않았습니다.' });
    }

    // 3. 최신 Gemini 2.5 Flash 모델 엔드포인트 구성
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return res.status(response.status).json({ error: data.error?.message || 'AI 요청 중 오류 발생' });
        }

        // 4. 성공 시 클라이언트로 데이터 전달
        return res.status(200).json(data);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: '내부 서버 오류가 발생했습니다.' });
    }
}
