import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    // 1. Tách tin nhắn cuối cùng (câu hỏi hiện tại của người dùng)
    const lastMessage = messages[messages.length - 1].content;

    // 2. Lấy danh sách tin nhắn trước đó (trừ tin nhắn cuối)
    let rawHistory = messages.slice(0, -1);

    // 3. Nếu tin nhắn đầu tiên là lời chào của AI, loại bỏ nó để history luôn bắt đầu bằng 'user'
    if (rawHistory.length > 0 && rawHistory[0].role === 'assistant') {
      rawHistory = rawHistory.slice(1);
    }

    // 4. Định dạng lại history theo chuẩn của Gemini SDK
    const history = rawHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // 5. Khởi tạo phiên Chat và gửi câu hỏi
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;

    return res.status(200).json({ reply: response.text() });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới Bạn AI Mentor Nghề Nghiệp.' });
  }
}
