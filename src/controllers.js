import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { preprocessText } from "./utils.js";
dotenv.config();

const { SECRET_OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY } = process.env;
const openai = new OpenAI({
  apiKey: SECRET_OPENAI_API_KEY,
});
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const createVector = async (text) => {
  const {
    data: [{ embedding }],
  } = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return embedding;
};
const getMatchs = async (embedding) =>
  await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 2,
  });

export const insertRow = async (arr) => {
  const processed = arr.map((e) => {
    const res = { content: e, token: preprocessText(e) };
    return res;
  });
  const insertionPromises = [];

  for (const { content, token } of processed) {
    const embeddingPromise = createVector(token).then((embedding) => {
      return supabase
        .from("documents")
        .insert([{ content, embedding }])
        .select();
    });
    insertionPromises.push(embeddingPromise);
  }
  await Promise.all(insertionPromises);
  const result = { length: processed.length, result: processed };
  return result;
};

export const generateResponse = async (question) => {
  const embedding = await createVector(preprocessText(question));
  const { data: matchs } = await getMatchs(embedding);
  const context = matchs.map((e, i) => `${i + 1}. ${e.content}`).join("\n");
  const {
    choices: [{ message }],
  } = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Eres un asistente que responde dudas sobre reglas del TCG de Digimon Card Game basandote solamente y exclusivamente en las siguientes reglas. No des respuestas a menos que este aclarado en las siguientes reglas:\nReglas=\n 
          ${context}\nSi tu pregunta no se encuentra cubierta por estas reglas, responderé con una de las siguientes respuestas: "Perdona, no puedo proporcionar una respuesta precisa" o "No estoy preparado para responder eso".`,
      },
      { role: "user", content: question },
    ],
  });
  const result = {
    question: question,
    answer: message.content,
    sources: matchs,
  };
  return result;
};
