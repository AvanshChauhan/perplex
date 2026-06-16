import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey:process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2048,
});
export async function testAi() {
    model.invoke("you are a helpful assistant").then((response)=>{
        console.log(response.text)
    })
}