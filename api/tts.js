export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 환경 변수 보안 호출
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: '서버 환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다.' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 제공되지 않았습니다.' });
    }

    // 최신 TTS 전용 모델 엔드포인트 구성
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: { 
                        voiceConfig: { 
                            prebuiltVoiceConfig: { voiceName: "Kore" } 
                        } 
                    }
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini TTS API Error:", data);
            return res.status(response.status).json({ error: data.error?.message || 'TTS 생성 중 오류 발생' });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: '내부 서버 오류가 발생했습니다.' });
    }
}
