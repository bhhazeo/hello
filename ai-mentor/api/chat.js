import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 1. Tách câu hỏi mới nhất của người dùng
    const lastMessage = messages[messages.length - 1].content;

    // 2. Lấy lịch sử chat
    let rawHistory = messages.slice(0, -1);

    // Lọc bỏ tin nhắn chào ban đầu của AI nếu có
    if (rawHistory.length > 0 && rawHistory[0].role === 'assistant') {
      rawHistory = rawHistory.slice(1);
    }

    // 3. Format history chuẩn cho SDK mới
    const contents = [
      ...rawHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      {
        role: 'user',
        parts: [{ text: lastMessage }]
      }
    ];

    // 4. Gọi Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới Bạn AI Mentor Nghề Nghiệp.' });
  }
}
