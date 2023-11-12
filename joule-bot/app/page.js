"use client";
import React, { useState } from "react";
import faq from "./api/answers/faq.json";

export default function Home() {
	const [inputValue, setInputValue] = useState("");
	const [password, setPassword] = useState("");
	const [data, setData] = useState({
		question: "",
		matchedQuestion: "",
		matchedAnswer: "",
		matchedIndex: "",
		secondBestMatchQuestion: "",
		secondBestMatchAnswer: "",
		secondBestMatchIndex: "",
		chatGptAnswer: "",
	});
	const [openFaqIndex, setOpenFaqIndex] = useState(-1);
	const isFaqOpen = (index) => openFaqIndex === index;
	const getDropdownIcon = (index) => (isFaqOpen(index) ? "▲" : "▼");
	const isMatchedQuestion = (index) => index === openFaqIndex;
	const [isLoading, setIsLoading] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		if (!inputValue.trim() || !password.trim()) {
			alert("Question and password cannot be empty.");
			setIsLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/answers", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-password": password.toLocaleLowerCase(),
				},
				body: JSON.stringify({ query: inputValue }),
			});

			if (response.ok) {
				const result = await response.json();
				setData({
					question: result.originalQuestion,
					matchedQuestion: result.matchedQuestion,
					matchedAnswer: result.matchedAnswer,
					matchedIndex: result.matchedIndex,
					secondBestMatchQuestion: result.secondBestMatchQuestion,
					secondBestMatchAnswer: result.secondBestMatchAnswer,
					secondBestMatchIndex: result.secondBestMatchIndex,
					chatGptAnswer: result.chatGptAnswer,
				});
				setOpenFaqIndex(result.matchedIndex);
			} else if (response.status === 401) {
				alert("Unauthorized access. Check your password.");
			} else if (response.status === 400) {
				alert("Bad request. Please check your input.");
			} else {
				throw new Error(`Error: ${response.status}`);
			}
			setIsLoading(false);
		} catch (error) {
			console.error("Failed to fetch data:", error);
			setIsLoading(false);
		}
	};

	const toggleFaq = (index) => {
		setOpenFaqIndex(openFaqIndex === index ? -1 : index);
	};
	const scrollToMatchedQuestion = () => {
		if (data.matchedIndex >= 0) {
			setOpenFaqIndex(data.matchedIndex);

			// Scroll to the element
			document.getElementById(`faq-${data.matchedIndex}`).scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	};

	return (
		<main className="flex min-h-screen justify-center items-center p-4 md:p-24 bg-[#effbfa]">
			<div className="flex flex-col items-start space-y-4 w-full max-w-7xl mx-auto bg-white p-4 shadow-lg rounded">
				<h1>Joule faq assistant</h1>
				<p>
					This chatbot utilizes AI technology to match user queries with the
					most relevant questions from our
					<a
						href="https://clients.joule.be/knowledge/article/49"
						target="blank"
						className="underline">
						knowledge article
					</a>{" "}
					. It uses embeddings, which are advanced AI techniques, to understand
					the context and meaning of words in user queries and FAQ questions.
					This allows the assistant to find the best matching FAQ entry for a
					given query. This assistant tries to link your question to the
					questions found in our faq.
				</p>
				<h2>Question</h2>
				<div className="flex flex-col md:flex-row w-full">
					{" "}
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						className="flex-1 mr-2 p-2 border rounded text-black"
						placeholder="Enter question"
						onKeyDown={(e) => {
							if (e.key === "Enter" && !isLoading) fetchData();
						}}
						disabled={isLoading}
					/>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="flex-1 mr-2 p-2 border rounded text-black"
						placeholder="Enter password"
						onKeyDown={(e) => {
							if (e.key === "Enter" && !isLoading) fetchData();
						}}
						disabled={isLoading}
					/>
					<button
						onClick={fetchData}
						className="p-2 bg-[#60d9d1] text-white rounded hover:bg-[#014a7e] transition duration-300"
						disabled={isLoading}>
						{isLoading ? "Loading..." : "Enter"}
					</button>
				</div>
				<div className="text-left w-full">
					<div className="my-2">
						<strong>Original question:</strong> {data.question || "N/A"}
						<p className="text-sm text-gray-500 italic">
							This is the question you asked.
						</p>
					</div>
					<div className="my-2">
						<strong>Matched question:</strong> {data.matchedQuestion || "N/A"}
						<p className="text-sm text-gray-500 italic">
							This is the most closely related question found in our FAQ.
						</p>
					</div>
					<div className="my-2">
						<strong>Matched answer:</strong> {data.matchedAnswer || "N/A"}
						<p className="text-sm text-gray-500 italic">
							This is the answer to the matched question.
						</p>
					</div>
					{data.matchedAnswer && (
						<button
							onClick={scrollToMatchedQuestion}
							className="p-1 bg-[#60d9d1] text-white rounded hover:bg-[#014a7e] transition duration-300">
							Go to best matched question
						</button>
					)}
					<div className="my-2">
						<strong>Second Best Matched Question:</strong>{" "}
						{data.secondBestMatchQuestion || "N/A"}
						<p className="text-sm text-gray-500 italic">
							This is the second most relevant question from our FAQ.
						</p>
					</div>
					<div className="my-2">
						<strong>Second Best Matched Answer:</strong>{" "}
						{data.secondBestMatchAnswer || "N/A"}
						<p className="text-sm text-gray-500 italic">
							This is the answer to the second best matched question.
						</p>
					</div>
					<div className="my-2">
						<strong>ChatGPT Answer:</strong> {data.chatGptAnswer || "N/A"}
						<p className="text-sm text-gray-500 italic">
							This is an AI-generated response that combines insights from the
							matched FAQ content and the user's query.
						</p>
					</div>
				</div>

				<h2>FAQ</h2>
				<div className="w-full">
					{" "}
					{faq.map((faq, index) => (
						<div key={index} id={`faq-${index}`} className="my-4">
							{" "}
							<div
								onClick={() => toggleFaq(index)}
								style={{ cursor: "pointer" }}
								className={`flex items-center justify-between border-b pb-2 rounded p-2
                                            ${
																							isMatchedQuestion(index)
																								? "bg-[#60d9d1]"
																								: ""
																						}`}>
								<span className="font-bold">{faq.question}</span>
								<span className="dropdown-icon">{getDropdownIcon(index)}</span>
							</div>
							{isFaqOpen(index) && <div className="p-2">{faq.answer}</div>}
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
