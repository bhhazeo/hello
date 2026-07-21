export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Hoặc OPENROUTER_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'Chưa cấu hình API Key trên Vercel.' });
    }

    // Biến đổi format tin nhắn cho chuẩn OpenAI/OpenRouter
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    // Gọi OpenRouter API (Dùng model Gemini Flash hoàn toàn miễn phí)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001', // Hoặc 'meta-llama/llama-3.3-70b-instruct:free'
        messages: formattedMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Lỗi từ OpenRouter API');
    }

    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới Bạn AI Mentor Nghề Nghiệp.' });
  }
}
