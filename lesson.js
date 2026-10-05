export default async function handler(req, res) {
    // Ensure only POST requests are allowed
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic, language } = req.body;

    if (!topic || !language) {
        return res.status(400).json({ error: 'Topic and language are required' });
    }

    const prompt = `Create a 10-level language course for learning ${language}. Topic: ${topic}. Return ONLY a valid JSON structure containing levels, sentences, and words. Do not include any extra text or conversational markdown outside the JSON.`;

    try {
        // שימוש ב-API הרשמי של Google Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${errorText}`);
        }

        const data = await response.json();
        const rawContent = data.candidates[0].content.parts[0].text;

        // ניקוי מעטפת ה-Markdown (במידה ו-Gemini החזיר ```json ... ```)
        const cleanJsonString = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(cleanJsonString);

        return res.status(200).json(parsedJson);

    } catch (error) {
        console.error("Server Error:", error.message);
        return res.status(500).json({ error: "Failed to generate lesson", details: error.message });
    }
}
