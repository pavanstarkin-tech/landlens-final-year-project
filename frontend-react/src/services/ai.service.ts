import api from './api';
import { propertyService } from './property.service';

const NVIDIA_API_KEY = "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";
const MODEL_NAME = "meta/llama-3.2-11b-vision-instruct";

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export const aiService = {
  generateResponse: async (
    userPrompt: string, 
    systemContext?: string, 
    chatHistory?: ChatHistoryItem[],
    conversationId?: string | null
  ): Promise<string> => {
    // 1. Primary: Call live backend serverless AI endpoint
    try {
      const response = await api.post<any>('/api/ai/chat', {
        prompt: userPrompt,
        content: userPrompt,
        message: userPrompt,
        systemContext: systemContext || "You are LandLens AI (IBM Bob Citizen Assistant) for government land verification. Explain documents in clear, direct language.",
        history: chatHistory || []
      }, { timeout: 12000 });

      if (response.data?.content && typeof response.data.content === 'string' && response.data.content.trim()) {
        return response.data.content.trim();
      }
      if (response.data?.message && typeof response.data.message === 'string' && response.data.message.trim()) {
        return response.data.message.trim();
      }
    } catch (err) {
      console.warn("Primary /api/ai/chat endpoint unavailable, falling back to direct inference...", err);
    }

    // 2. Direct High-Speed Client Inference via NVIDIA Open Endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const recentHistory = (chatHistory || []).slice(-6);
      const messagesPayload = [
        { role: "system", content: systemContext || "You are LandLens AI (IBM Bob Citizen Assistant) for government land verification. Answer directly and concisely in the user's requested language." },
        ...recentHistory.map(h => ({ role: h.role, content: h.content })),
        { role: "user", content: userPrompt }
      ];

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: messagesPayload,
          temperature: 0.3,
          max_tokens: 450
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content.trim();
        }
      }
    } catch (error) {
      console.error("Direct inference fallback error:", error);
    }

    throw new Error("Unable to connect to live AI inference server.");
  }
};

