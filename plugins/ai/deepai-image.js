/**
 * DeepAI Image Generation Plugin
 * AI-powered image generation using DeepAI API
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

  async image({ prompt, version = "hd" }) {
    return await this.request("/api/text2img", {
      text: prompt,
      image_generator_version: version
    });
  }
}

const deepai = new DeepAI();

export default {
  name: "DeepAI Image Generator",
  description: "Generate AI images from text prompts using DeepAI's text-to-image API with HD quality support",
  category: "AI",
  method: "POST",
  path: "/api/ai/deepai-image",
  params: {
    prompt: "string (required) - Text description of the image to generate",
    version: "string (optional) - Image quality version: 'hd' for high definition or 'standard' (default: 'hd')"
  },
  handler: async (req, res) => {
    try {
      const { prompt, version = "hd" } = req.body;

      // Validate required parameters
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Parameter 'prompt' is required and must be a string",
          timestamp: new Date().toISOString()
        });
      }

      // Validate prompt length
      if (prompt.length < 3) {
        return res.status(400).json({
          success: false,
          error: "Prompt must be at least 3 characters long",
          timestamp: new Date().toISOString()
        });
      }

      if (prompt.length > 1000) {
        return res.status(400).json({
          success: false,
          error: "Prompt must be less than 1000 characters",
          timestamp: new Date().toISOString()
        });
      }

      // Validate version parameter
      const validVersions = ["hd", "standard"];
      if (version && !validVersions.includes(version)) {
        return res.status(400).json({
          success: false,
          error: `Invalid version. Must be one of: ${validVersions.join(", ")}`,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`🎨 DeepAI Image generation request: ${prompt.substring(0, 50)}...`);

      const result = await deepai.image({
        prompt,
        version
      });

      res.json({
        success: true,
        data: {
          image_url: result.output_url || result.url,
          prompt: prompt,
          version: version,
          generation_time: result.generation_time || "unknown",
          id: result.id || crypto.randomBytes(8).toString("hex"),
          full_response: result
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ DeepAI Image generation error:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to generate image: " + error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

