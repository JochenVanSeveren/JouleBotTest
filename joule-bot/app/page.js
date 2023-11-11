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
		chatGptAnswer: "",
	});
	const [openFaqIndex, setOpenFaqIndex] = useState(-1);
	const isFaqOpen = (index) => openFaqIndex === index;
	const getDropdownIcon = (index) => (isFaqOpen(index) ? "▲" : "▼");
	const isMatchedQuestion = (index) => index === openFaqIndex;

	const fetchData = async () => {
		if (!inputValue.trim() || !password.trim()) {
			alert("Question and password cannot be empty.");
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
		} catch (error) {
			console.error("Failed to fetch data:", error);
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
				<h1>Joule faq bot</h1>
				<p>
					This bot tries to link your question to the questions found in our
					faq. I used{" "}
					<a
						href="https://clients.joule.be/knowledge/article/49"
						target="blank"
						className="underline">
						knowledge article
					</a>{" "}
					as my source and copied the questions in my server and beneath.
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
							if (e.key === "Enter") fetchData();
						}}
					/>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="flex-1 mr-2 p-2 border rounded text-black"
						placeholder="Enter password"
					/>
					<button
						onClick={fetchData}
						className="p-2 bg-[#60d9d1] text-white rounded hover:bg-[#014a7e] transition duration-300">
						{" "}
						Enter
					</button>
				</div>
				<div className="text-left w-full">
					{" "}
					<div className="my-2">
						<strong>Original question:</strong> {data.question || "N/A"}
					</div>
					<div className="my-2">
						<strong>Matched question:</strong> {data.matchedQuestion || "N/A"}
					</div>
					<div className="my-2">
						<strong>Matched answer:</strong> {data.matchedAnswer || "N/A"}
					</div>
					{data.matchedAnswer && (
						<button
							onClick={scrollToMatchedQuestion}
							className="p-1 bg-[#60d9d1] text-white rounded hover:bg-[#014a7e] transition duration-300">
							Go to Answer
						</button>
					)}
					<div className="my-2">
						<strong>ChatGPT Answer:</strong> {data.chatGptAnswer || "N/A"}
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