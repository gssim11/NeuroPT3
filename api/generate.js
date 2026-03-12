export default async function handler(req, res) {
    // 1. CORS 설정 (모든 요청 허용)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 사전 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST 방식만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. 환경 변수에서 API 키 로드 (보안)
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: '서버 환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다.' });
        }

        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: '프롬프트가 제공되지 않았습니다.' });
        }

        // 3. 모델명을 명확한 'gemini-1.5-flash-latest' 로 변경하여 404 에러 방지
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
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

        // 4. 결과 반환
        return res.status(200).json(data);
        
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: '내부 서버 오류가 발생했습니다.' });
    }
}
