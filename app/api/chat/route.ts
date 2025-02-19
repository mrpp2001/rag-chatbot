import { Ollama } from "ollama";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextRequest } from "next/server";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const ollama = new Ollama({
  host: "http://localhost:11434",
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;
    let docContent = "";

    try {
      const embeddingResponse = await ollama.embed({
        model: "nomic-embed-text",
        input: latestMessage,
      });
      const vector = embeddingResponse.embeddings[0];

      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: vector,
        },
        limit: 10,
      });

      const documents = await cursor.toArray();

      const docsMap = documents?.map((doc) => doc.text);
      docContent = JSON.stringify(docsMap);
    } catch (err) {
      console.log("Error querying db...", err);
    }

    const template = {
      role: "system",
      content: `You are an AI assistant who knows everything about Formula One. 
            Use the below context to augment what you know about Formula One racing. 
            The context will provide you with the most recent page data from wikipedia, the official F1 website and others. 
            If the context doesn't include the information you need answer based on your 
            existing knowledge and don't mention the source of your information or 
            what the context does or doesn't include. 
            Format responses using markdown where applicable and don't return images. 
            -------------------
            START CONTEXT 
            ${docContent} 
            END CONTEXT
            -------------------
            QUESTION: ${latestMessage}
            -------------------
            `,
    };

    const response = await ollama.chat({
      model: "llama2",
      stream: true,
      messages: [template, ...messages],
    }).catch(error => {
      console.error("Chat completion error:", error);
      throw new Error("Failed to generate chat response");
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of response) {
          const text = chunk.message?.content || "";
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("Ollama connection error:", error);
    return new Response(JSON.stringify({
      error: "Failed to connect to Ollama. Make sure it's running on port 11434."
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
