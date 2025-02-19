import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { Ollama } from "ollama";  // Import the Ollama class
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://en.wikipedia.org/wiki/2023 Formula One World Championship",
  "https://en.wikipedia.org/wiki/2022 Formula One World Championship",
  "https://en.wikipedia.org/wiki/List of Formula One World Drivers%27 Champions",
  "https://en.wikipedia.org/wiki/2024_Formula One World Championship",
  "https://www.formula1.com/en/results.html/2024/races.html",
  "https://www.formula1.com/en/racing/2024.html",
  "https://www.formula1.com/en/latest/all",
  "https://www.formula1.com/en/results.html/2024/drivers.html",
  "https://www.formula1.com/en/results.html/2024/team.html",
  "https://www.formula1.com/en/racing/2024/Saudi_Arabia.html",
  "https://www.formula1.com/en/racing/2024/Australia.html",
  "https://www.formula1.com/en/latest/article.explained-every-2024-f1-car-launch-and-livery-release-date.1d6qEjZzH5ZJdZbC6Z2j6O.html",
  "https://www.formula1.com/en/latest/article.the-key-technical-changes-to-the-2024-f1-car.4D5q4qZ4V4nJ4x5Z5Z5Z5Z.html",
  "https://www.formula1.com/en/championship/history.html",
  "https://en.wikipedia.org/wiki/List_of_Formula_One_constructors",
  "https://en.wikipedia.org/wiki/Formula_One_engines",
  "https://en.wikipedia.org/wiki/Formula_One_regulations",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

// Instantiate the Ollama client for local usage
const ollama = new Ollama({
  host: "http://localhost:11434", // Connects to your local Ollama server
});

const createCollection = async (similarityMetric: "dot_product" | "cosine" | "euclidean" = "dot_product") => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 768,
      metric: similarityMetric,
    },
  });
  console.log(res);
};

const scrapePage = async (url) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: { headless: true },
    gotoOptions: { waitUntil: "domcontentloaded" },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);
  for await (const url of f1Data) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    for await (const chunk of chunks) {
      // Call the local Ollama embed endpoint
      const embeddingResponse = await ollama.embed({
        model: "nomic-embed-text",
        input: chunk,
      });
      const vector = embeddingResponse.embeddings[0]; // Get first embedding array from response

      await collection.insertOne({
        $vector: vector,
        text: chunk,
      });
    }
  }
};

createCollection().then(() => loadSampleData());
