import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;

    // Lấy API Key an toàn từ cài đặt của Vercel
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Đổi định dạng tin nhắn cho đúng với Gemini
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const lastMessage = messages[messages.length - 1].content;

    // Gọi Gemini 2.5 Flash
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
      },
      history: history
    });

    const response = await chat.sendMessage({ message: lastMessage });

    return res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error('Lỗi API:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới Bạn AI Mentor.' });
  }
}
