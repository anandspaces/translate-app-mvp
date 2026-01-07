import express from "express";
import cors from "cors";
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 9001;

/**
 * Proper CORS configuration
 */
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


app.use(express.json());

// Initialize Hugging Face client
const client = new InferenceClient(process.env.HF_TOKEN);

// Safety middleware (Express 5 compatibility)
app.use((req, res, next) => {
    if (!req.body) req.body = {};
    next();
});

async function getTranslation(text, fromLang, toLang) {
    const output = await client.chatCompletion({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        provider: "auto",
        messages: [
            {
                role: "system",
                content: `Translate from ${fromLang} to ${toLang}. Return ONLY the translated text.`,
            },
            { role: "user", content: text },
        ],
        max_tokens: 500,
        temperature: 0.1,
    });

    return output.choices[0].message.content.trim();
}

app.post("/translate", async (req, res) => {
    try {
        const { text, fromLang, toLang } = req.body;

        if (!text || !fromLang || !toLang) {
            return res.status(400).json({
                status: 0,
                message: "Missing fields",
            });
        }

        const translatedText = await getTranslation(text, fromLang, toLang);

        res.status(200).json({
            status: 1,
            data: {
                originalText: text,
                translatedText,
                sourceLanguage: fromLang,
                targetLanguage: toLang,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 0,
            message: error.message,
        });
    }
});

app.listen(PORT, () =>
    console.log(`🚀 API ready on port ${PORT}`)
);
