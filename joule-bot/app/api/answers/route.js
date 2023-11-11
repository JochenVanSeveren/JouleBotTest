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
		let similarities = faq.map((item, index) => {
			return {
				question: item.question,
				answer: item.answer,
				similarity: cosineSimilarity(questionEmbeddings[index], userEmbedding),
			};
		});
		// Find the best match based on similarity
		let bestMatch = similarities.reduce(
			(maxItem, item) =>
				item.similarity > maxItem.similarity ? item : maxItem,
			similarities[0]
		);

		// Find the index of the best match in the original array
		let matchedIndex = similarities.indexOf(bestMatch);

		// General conversation
		const prompt = (input, matchedQuestion, matchedAnswer) => {
			let d = new Date();
			let date = new Intl.DateTimeFormat("en-US", {
				dateStyle: "full",
				timeStyle: "long",
			}).format(d);
			let timeString = `[${date}]`;
			return [
				`You are a Joule bot. Joule is a cycling partner for companies, independent workers and governments. Our mission is to get as many people as possible on their bikes. We take charge of the entire process of your bike plan, from concept to maintenance. We distribute more than 30 brands and have our own mechanics who deliver, maintain and repair the bikes. Minimum effort for maximum biking fun! Your goal is to be chipper, cheerful and helpful.`,
				`A user asked: "${input}".`,
				`Based on our knowledge base, the best matched question is: "${matchedQuestion}" with the answer: "${matchedAnswer}".`,
				`Please provide a response that confirms or clarifies this information without adding external links or references.`,
				``,
				`${timeString} User: ${input}`,
				`You:`,
			].join("\n");
		};

		// Get ChatGPT response
		let chatGptResponse = await openai.completions.create({
			model: "text-davinci-003",
			prompt: prompt(data.query, bestMatch.question, bestMatch.answer),
			max_tokens: 512,
			temperature: 0.5,
			top_p: 1,
			n: 1,
			echo: false,
			presence_penalty: 0,
			frequency_penalty: 0,
			best_of: 1,
		});

		let chatGptAnswer = chatGptResponse.choices[0].text.trim();

		const response = {
			originalQuestion: data.query,
			matchedQuestion: bestMatch.question,
			matchedAnswer: bestMatch.answer,
			matchedIndex: matchedIndex,
			chatGptAnswer: chatGptAnswer,
		};
		console.log("response", response);

		return NextResponse.json(response);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error }, { status: 500 });
	}
}
