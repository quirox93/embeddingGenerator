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

const createVector = async (rule_id, content) => {
  const cleanContent = preprocessText(`${content}`);
  const {
    data: [{ embedding }],
  } = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: cleanContent,
  });
  return { rule_id, content, embedding };
};
const getMatchs = async (embedding) =>
  await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 5,
  });

const deleteVectors = async (rule_id) => {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("rule_id", rule_id);
  console.log(error);
  return error;
};

export const insertRow = async (obj) => {
  // Inserto o actualizo la info principal
  const { data, error } = await supabase
    .from("main_rules")
    .upsert(obj)
    .select();
  if (error) return error;

  // Creo nuevos vectores y los guardo
  const insertionPromises = [];
  for (const { title, content, id } of data) {
    // Si actualice elimino los vectores asociados
    if (id) await deleteVectors(id);
    const allContents = content
      .split(/\n|\.\s/)
      .map((s) => s.trim())
      .filter((e) => e.length > 1);
    insertionPromises.push(createVector(id, title));
    for (const content of allContents) {
      const embeddingPromise = createVector(id, content);
      insertionPromises.push(embeddingPromise);
    }
  }
  const promises = await Promise.all(insertionPromises);
  const { data: embeddings, error: _error } = await supabase
    .from("documents")
    .insert(promises)
    .select();
  if (_error) return _error;

  return { data, embeddings: promises.map((e) => e.content) };
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
    temperature: 0,
  });
  const result = {
    question: question,
    answer: message.content,
    sources: matchs,
  };
  return result;
};
