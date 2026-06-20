import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";

/*
  This file keeps all AI-related logic in one service layer.

  The controller should not know the details of LangChain, Gemini models,
  prompts, temperatures, or response cleanup. It simply calls:
  - generateResponse(message) for the assistant answer
  - generateChatTitle(message) for a short chat title

  Keeping this logic here makes the controller cleaner and makes it easier to
  change the AI provider/model later.
*/

// Main chat model used for answering user messages.
// temperature controls creativity:
// - higher value = more varied answers
// - lower value = more predictable answers
// 0.7 gives a balanced assistant style.
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
});

// Separate model instance for title generation.
// temperature is 0 because titles should be stable and focused, not creative.
const titleModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});

// System prompt for normal chat answers.
// A SystemMessage tells the model how it should behave before it sees the
// user's actual message.
const CHAT_SYSTEM_PROMPT = `
You are a helpful, professional, and friendly AI assistant.
Identity Rule:
ONLY when the user is explicitly asking about:
- who created you
- who developed you
- who made you
- who built you
- who owns you
- who is your developer

Answer:
"I was developed by Avansh Singh for educational purposes."

Do not mention this information in any other conversation.
Do not volunteer this information.
Do not append it to unrelated answers.
Instructions:
- Answer accurately and clearly.
- Adapt naturally to the user's tone.
- Be concise when possible and detailed when needed.
- Explain complex concepts simply.
- Ask for clarification if the request is ambiguous.
- For programming questions, provide clean and maintainable solutions.
- If you are unsure, say so instead of making things up.
`;

// System prompt for chat title generation.
// The rules force the model to return only a small title, so the frontend can
// display it directly without extra parsing.
const TITLE_SYSTEM_PROMPT = `
Generate a short title for the user's message.

Rules:
- 2 to 6 words.
- Focus on the main topic or intent.
- Return ONLY the title.
- No quotes.
- No emojis.
- No punctuation.
- Do not include explanations.
- Do not reference previous conversations.
`;

/*
  generateResponse creates the AI assistant reply.

  Input:
  - message: the text sent by the user

  Working:
  1. Send two messages to the model:
     - SystemMessage: instructions for how the AI should behave
     - HumanMessage: the actual user text
  2. Wait for Gemini/LangChain to return a response.
  3. Convert response.content into a normal string.
  4. If anything fails, log the error and return a safe fallback message.
*/
export async function generateResponse(message) {
  try {
    const chatHistory = Array.isArray(message)
      ? message
      : [{ role: "user", content: message }];

    const langChainMessages = chatHistory
      .filter((msg) => msg?.content && ["user", "ai"].includes(msg.role))
      .map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        }

        return new AIMessage(msg.content);
      });

    // chatModel.invoke sends the conversation messages to the Gemini model.
    // LangChain expects messages in an array, ordered from instruction/context
    // to the latest human input.
    const response = await chatModel.invoke([
      new SystemMessage(CHAT_SYSTEM_PROMPT),
      ...langChainMessages,
    ]);

    // response.content can be a string or another content format depending on
    // the provider. toString() ensures the controller receives plain text.
    return response.content?.toString() || "";
  } catch (error) {
    // Log the real error on the server for debugging, but return a simple
    // friendly message to the user instead of crashing the API.
    console.error("Chat Error:", error);
    return "Sorry, something went wrong.";
  }
}

/*
  generateChatTitle creates a short title for a new chat.

  Input:
  - message: usually the first message of the conversation

  Working:
  1. Send title-specific instructions and the user message to the title model.
  2. Convert the model response to text.
  3. Clean the title:
     - remove quotes
     - trim spaces
     - keep only the first line
     - limit the title to 60 characters
  4. If the model fails or returns nothing useful, use "New Chat".
*/
export async function generateChatTitle(message) {
  try {
    // This uses the same Gemini model type, but with a different system prompt
    // and temperature 0 so the output is short and predictable.
    const response = await titleModel.invoke([
      new SystemMessage(TITLE_SYSTEM_PROMPT),
      new HumanMessage(message),
    ]);

    // The cleanup step protects the UI from unwanted quotes, multi-line
    // answers, or overly long titles.
    return (
      response.content
        ?.toString()
        .replace(/["']/g, "")
        .trim()
        .split("\n")[0]
        .slice(0, 60) || "New Chat"
    );
  } catch (error) {
    // Title generation is helpful but not critical. If it fails, the chat can
    // still be created with a default title.
    console.error("Title Error:", error);
    return "New Chat";
  }
}
