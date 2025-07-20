/**
 * DeepAI Chat Plugin
 * AI-powered chat using DeepAI API
 */

import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";

class DeepAI {
  constructor() {
    this.baseURL = "https://api.deepai.org";
    this.userAgent = this.genUA();
  }

  genUA() {
    const android = [10, 11, 12, 13, 14][Math.floor(Math.random() * 5)];
    const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    const chrome = [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131][Math.floor(Math.random() * 12)];
    return `Mozilla/5.0 (Linux; Android ${android}; ${letter}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome}.0.0.0 Mobile Safari/537.36`;
  }

  hashFunction(input) {
    return crypto.createHash("md5").update(input).digest("hex").split("").reverse().join("");
  }

  genKey() {
    const randomStr = Math.round(Math.random() * 1e11) + "";
    const secret = "hackers_become_a_little_stinkier_every_time_they_hack";
    const hash = this.hashFunction(this.userAgent + this.hashFunction(this.userAgent + this.hashFunction(this.userAgent + randomStr + secret)));
    return "tryit-" + randomStr + "-" + hash;
  }

  async request(endpoint, data, extraHeaders = {}) {
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
      }

      const ip = crypto.randomBytes(4).map(b => b % 256).join(".");
      const headers = {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "api-key": this.genKey(),
        origin: this.baseURL,
        referer: `${this.baseURL}/`,
        "user-agent": this.userAgent,
        "x-forwarded-for": ip,
        "x-real-ip": ip,
        "x-request-id": crypto.randomBytes(8).toString("hex"),
        ...extraHeaders,
        ...formData.getHeaders()
      };

      const res = await axios.post(`${this.baseURL}${endpoint}`, formData, { headers });
      return res.data;
    } catch (e) {
      throw new Error("Request error: " + e.message);
    }
  }

  async chat({ prompt, messages = [], chatStyle = "chat", model = "standard" }) {
    return await this.request("/hacking_is_a_serious_crime", {
      chat_style: chatStyle,
      chatHistory: messages.length ? messages : [{ role: "user", content: prompt }],
      model,
      hacker_is_stinky: "very_stinky"
    });
  }
}

const deepai = new DeepAI();

export default {
  name: "DeepAI Chat",
  description: "AI-powered chat conversation using DeepAI API with support for chat history and different models",
  category: "AI",
  method: "POST",
  path: "/api/ai/deepai-chat",
  params: {
    prompt: "string (required) - The message or question to send to the AI",
    messages: "array (optional) - Chat history array with role and content objects",
    chatStyle: "string (optional) - Chat style (default: 'chat')",
    model: "string (optional) - AI model to use (default: 'standard')"
  },
  handler: async (req, res) => {
    try {
      const { prompt, messages = [], chatStyle = "chat", model = "standard" } = req.body;

      // Validate required parameters
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Parameter 'prompt' is required and must be a string",
          timestamp: new Date().toISOString()
        });
      }

      // Validate messages format if provided
      if (messages && !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: "Parameter 'messages' must be an array",
          timestamp: new Date().toISOString()
        });
      }

      // Validate message format
      if (messages.length > 0) {
        for (const msg of messages) {
          if (!msg.role || !msg.content) {
            return res.status(400).json({
              success: false,
              error: "Each message must have 'role' and 'content' properties",
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      console.log(`🤖 DeepAI Chat request: ${prompt.substring(0, 50)}...`);

      const result = await deepai.chat({
        prompt,
        messages,
        chatStyle,
        model
      });

      res.json({
        success: true,
        data: {
          response: result,
          input: {
            prompt,
            messages,
            chatStyle,
            model
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ DeepAI Chat error:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to process chat request: " + error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

