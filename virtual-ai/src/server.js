import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";

  const GEMINI_API_KEY= "GEMINI_API_KEY"
  // const apiKey = process?.env?.GEMINI_API_KEY || api;
  const apiKey = GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192, // response output length
    responseMimeType: "text/plain",
  };
  
  async function run(prompt) {
    console.log(prompt);
    const chatSession = model.startChat({
      generationConfig,
      history: [
      ],
    });
  
    const result = await chatSession.sendMessage(prompt);
    return result
  }
  
  export default run;