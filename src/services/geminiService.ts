import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ParsedSchedule {
  title: string;
  date: string;
  startTime: string;
  location: string;
  host: string;
  participants: string;
  type: 'meeting' | 'fieldwork' | 'event' | 'other';
  priority: 'low' | 'medium' | 'high';
}

export async function parseScheduleWithAI(text: string): Promise<ParsedSchedule | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy phân tích đoạn văn bản sau và trích xuất thông tin lịch công tác. 
      Văn bản: "${text}"
      Ngày hôm nay là: ${today}. Nếu văn bản nói "thứ hai tuần tới" hoặc "ngày mai", hãy tính toán ngày chính xác (định dạng YYYY-MM-DD).
      Nếu không có năm, dùng năm hiện tại.
      Các loại công việc (type) chỉ được chọn 1 trong: meeting, fieldwork, event, other.
      Độ ưu tiên (priority) chỉ được chọn 1 trong: low, medium, high.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Nội dung cuộc họp hoặc công việc" },
            date: { type: Type.STRING, description: "Ngày diễn ra (YYYY-MM-DD)" },
            startTime: { type: Type.STRING, description: "Giờ bắt đầu (HH:mm)" },
            location: { type: Type.STRING, description: "Địa điểm" },
            host: { type: Type.STRING, description: "Người chủ trì" },
            participants: { type: Type.STRING, description: "Thành phần tham dự" },
            type: { type: Type.STRING, description: "Phân loại: meeting, fieldwork, event, other" },
            priority: { type: Type.STRING, description: "Độ ưu tiên: low, medium, high" },
          },
          required: ["title", "date", "startTime"]
        },
      },
    });

    if (!response.text) return null;
    return JSON.parse(response.text.trim()) as ParsedSchedule;
  } catch (error) {
    console.error("AI Parsing error:", error);
    return null;
  }
}
