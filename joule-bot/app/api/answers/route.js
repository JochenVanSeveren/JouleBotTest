import OpenAI from "openai";
import cosineSimilarity from "compute-cosine-similarity";
import faq from "./faq.json"; // Adjust the path as necessary
import { headers } from "next/headers";

import { NextResponse } from "next/server";

export async function POST(req) {
	try {
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
		});
		const data = await req.json();

		if (headers().get("x-password") !== process.env.PASSWORD) {
			return NextResponse.json({ error: "Invalid password" }, { status: 401 });
		}

		// Get embedding for user's query
		let userEmbeddingResult = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: data.query,
		});
		let userEmbedding = userEmbeddingResult.data[0].embedding;
		// TODO: question storing
		// TODO: question embedding storing
		// TODO: add internal questions because for example the question: Can Joule come repair my bike, fails!
		// Compute or fetch embeddings for each question in JSON data
		let questionEmbeddings = await Promise.all(
			faq.map(async (item) => {
				if (item.embedding) {
					return item.embedding;
				} else {
					let embeddingResult = await openai.embeddings.create({
						model: "text-embedding-ada-002",
						input: item.question,
					});
					let embedding = embeddingResult.data[0].embedding;
					item.embedding = embedding; // Cache the embedding
					return embedding;
				}
			})
		);

		// Find the closest question based on cosine similarity
		let similarities = faq.map((item, index) => ({
			question: item.question,
			answer: item.answer,
			similarity: cosineSimilarity(questionEmbeddings[index], userEmbedding),
		}));

		// Sort similarities by similarity score
		similarities.sort((a, b) => b.similarity - a.similarity);

		// Get the best and second-best matches
		let bestMatch = similarities[0];
		let secondBestMatch = similarities[1];

		// Find the indices of the best and second-best matches
		let bestMatchIndex = faq.findIndex(
			(item) => item.question === bestMatch.question
		);
		let secondBestMatchIndex = faq.findIndex(
			(item) => item.question === secondBestMatch.question
		);

		// Prepare messages for ChatGPT
		const messages = [
			{
				role: "system",
				content: `You are a Joule virtual assistant here to answer questions about Joule. Joule is a cycling partner for companies, independent workers and governments. Our mission is to get as many people as possible on their bikes. We take charge of the entire process of your bike plan, from concept to maintenance. We distribute more than 30 brands and have our own mechanics who deliver, maintain and repair the bikes. Minimum effort for maximum biking fun! Your goal is to be chipper, cheerful and helpful.`,
			},
			{ role: "user", content: data.query },
			{
				role: "assistant",
				content: `The best matched question is: "${bestMatch.question}" with the answer: "${bestMatch.answer}". The second best match is: "${secondBestMatch.question}" with the answer: "${secondBestMatch.answer}".`,
			},
		];

		// Get ChatGPT response
		let chatGptResponse = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: messages,
			max_tokens: 512,
			temperature: 0.5,
			top_p: 1,
			n: 1,
			presence_penalty: 0,
			frequency_penalty: 0,
		});

		let chatGptAnswer = chatGptResponse.choices[0].message.content;

		const response = {
			originalQuestion: data.query,
			matchedQuestion: bestMatch.question,
			matchedAnswer: bestMatch.answer,
			matchedIndex: bestMatchIndex,
			secondBestMatchQuestion: secondBestMatch.question,
			secondBestMatchAnswer: secondBestMatch.answer,
			secondBestMatchIndex: secondBestMatchIndex,
			chatGptAnswer: chatGptAnswer,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error }, { status: 500 });
	}
}
