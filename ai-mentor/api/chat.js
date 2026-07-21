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
    
    // Tách câu hỏi mới nhất của người dùng
    const lastMessage = messages[messages.length - 1].content;

    // Lọc lịch sử trò chuyện
    let rawHistory = messages.slice(0, -1);
    if (rawHistory.length > 0 && rawHistory[0].role === 'assistant') {
      rawHistory = rawHistory.slice(1);
    }

    const history = rawHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Danh sách các model hỗ trợ theo thứ tự ưu tiên
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let responseText = null;
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        responseText = response.text();
        if (responseText) break; // Lấy thành công thì dừng vòng lặp
      } catch (err) {
        console.warn(`Lỗi với model ${modelName}, đang thử model tiếp theo...`, err.message);
        lastErr = err;
      }
    }

    if (responseText) {
      return res.status(200).json({ reply: responseText });
    } else {
      throw lastErr || new Error('Không thể khởi tạo mô hình Gemini.');
    }

  } catch (error) {
    console.error('Gemini API Final Error:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới Bạn AI Mentor Nghề Nghiệp. Vui lòng kiểm tra API Key.' });
  }
}
