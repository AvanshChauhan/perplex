import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  tool,
  createAgent,
} from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
});

const titleModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});

const CHAT_SYSTEM_PROMPT = `
You are a helpful, professional, and friendly AI assistant.

Identity Rule:
ONLY when the user explicitly asks:
- who created you
- who developed you
- who made you
- who built you
- who owns you
- who is your developer

Answer exactly:
"I was developed by Avansh Singh for educational purposes."

Do not mention this information in any other conversation.

Instructions:
- Answer accurately and clearly.
- Adapt naturally to the user's tone.
- Be concise when possible and detailed when needed.
- Explain complex concepts simply.
- Ask for clarification if the request is ambiguous.
- For programming questions, provide clean and maintainable solutions.
- If you are unsure, say so instead of making things up.
- Use tools whenever current or external information is required.
`;

const TITLE_SYSTEM_PROMPT = `
Generate a short title for the user's message.

Rules:
- 2 to 6 words.
- Focus on the main topic.
- Return ONLY the title.
- No quotes.
- No emojis.
- No punctuation.
- No explanations.
`;

const searchInternetTool = tool(
  async ({ query }) => {
    try {
      const result = await searchInternet(query);

      if (typeof result === "string") {
        return result;
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      console.error("Search Tool Error:", error);
      return "Failed to retrieve search results.";
    }
  },
  {
    name: "search_internet",
    description: `
Search the internet and return relevant information.

Use this tool when:
- User asks for latest news
- Current events
- Documentation
- Company information
- Product information
- Technical references
- Research
- Fact checking

Do NOT use for:
- Simple reasoning
- Math calculations
- Coding tasks that don't require external data
`,
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);

const agent = createAgent({
  model: chatModel,
  tools: [searchInternetTool],
  systemPrompt: CHAT_SYSTEM_PROMPT,
});

export async function generateResponse(message) {
  try {
    const chatHistory = Array.isArray(message)
      ? message
      : [{ role: "user", content: message }];

    const messages = chatHistory
      .filter(
        (msg) =>
          msg &&
          msg.content &&
          ["user", "ai", "assistant"].includes(msg.role)
      )
      .map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        }

        return new AIMessage(msg.content);
      });

    const result = await agent.invoke({
      messages,
    });

    const finalMessage =
      result.messages?.[result.messages.length - 1];

    if (!finalMessage) {
      return "No response generated.";
    }

    if (typeof finalMessage.content === "string") {
      return finalMessage.content;
    }

    if (Array.isArray(finalMessage.content)) {
      return finalMessage.content
        .map((item) => item.text || "")
        .join("\n");
    }

    return String(finalMessage.content);
  } catch (error) {
    console.error("Generate Response Error:", error);
    return "Sorry, something went wrong.";
  }
}

export async function generateChatTitle(message) {
  try {
    const response = await titleModel.invoke([
      new SystemMessage(TITLE_SYSTEM_PROMPT),
      new HumanMessage(message),
    ]);

    const title =
      response.content
        ?.toString()
        .replace(/["']/g, "")
        .trim()
        .split("\n")[0]
        .slice(0, 60) || "New Chat";

    return title;
  } catch (error) {
    console.error("Title Generation Error:", error);
    return "New Chat";
  }
}