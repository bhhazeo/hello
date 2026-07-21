import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sử dụng model chuẩn xác duy nhất: gemini-2.0-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const lastMessage = messages[messages.length - 1].content;
    let rawHistory = messages.slice(0, -1);

    if (rawHistory.length > 0 && rawHistory[0].role === 'assistant') {
      rawHistory = rawHistory.slice(1);
    }

    const history = rawHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;

    return res.status(200).json({ reply: response.text() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới Bạn AI Mentor Nghề Nghiệp.' });
  }
}
