import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
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

export const insertRow = async (content) => {
  const embedding = await createVector(content);
  const { data } = await supabase
    .from("documents")
    .insert([{ content, embedding }])
    .select();
  return data;
};

export const generateResponse = async (content) => {
  const embedding = await createVector(content);
  const { data: matchs } = await getMatchs(embedding);
  const context = matchs.map((e) => e.content).join("\n");
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `Eres un asistente que responde dudas sobre reglas del TCG de Digimon Card Game basandote solamente y exclusivamente en las siguientes reglas. No des respuestas a menos que este aclarado en las siguientes reglas:\nReglas=\n 
          ${context}\n ,en caso de que la pregunta no este respondida en las reglas responde: 'Perdona no puedo darte una respuesta certera' o 'No estoy preparado para responder eso'.`,
      },
      { role: "user", content },
    ],
  });
  return { response, matchs };
};
