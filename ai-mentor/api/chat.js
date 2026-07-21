export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Chưa cấu hình API Key trên Vercel.' });
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    // Danh sách model miễn phí dự phòng tự động
    const freeModels = [
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-r1:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    let reply = null;
    let lastError = null;

    for (const modelName of freeModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: formattedMessages
          })
        });

        const data = await response.json();
        if (response.ok && data.choices?.[0]?.message?.content) {
          reply = data.choices[0].message.content;
          break; // Tìm thấy model chạy OK là dừng ngay!
        } else {
          lastError = data.error?.message || 'Endpoint unavailable';
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (reply) {
      return res.status(200).json({ reply });
    } else {
      throw new Error(lastError || 'Tất cả model miễn phí đều đang bận.');
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Không thể kết nối tới AI Mentor.' });
  }
}
