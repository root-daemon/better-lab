import { useCallback, useEffect, useState } from "react";
import styles from "./QuestionDisplay.module.css";

import { CompileMsg } from "@/types/CompileMsg";
import { DataStream } from "@/types/DataStream";

import dynamic from "next/dynamic";
const CodeEditor = dynamic(
	() => import("../CodeEditor/Editor").then((mod) => mod.default),
	{ ssr: false },
);
const QuestionsProgress = dynamic(
	() =>
		import("@/components/QuestionsProgress/QuestionsProgress").then(
			(mod) => mod.default,
		),
	{ ssr: false },
);

import { FaAngleLeft, FaAngleRight, FaSquareCheck } from "react-icons/fa6";

import { Languages } from "@/types/Languages";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { useRouter } from "next/router";

const Question = () => {
	const router = useRouter();

	const [num, setNum] = useState<number>(75);
	const [user, setUser] = useState<string>();
	const [data, setData] = useState<DataStream | null>(null);
	const [res, setRes] = useState<CompileMsg | null>(null);
	const [nextQuestion, setNextQuestion] = useState(false);
	const [opn, setOpn] = useState(false);

	const [code, setCode] = useState("");
	const [language, setLanguage] = useState(loadLanguage("c" as Languages));

	const [page, setPage] = useState(0);
	const [testpage, setTest] = useState(0);
	const [courseData, setCourseData] = useState<any>(null);

	const onChange = useCallback((value: string) => {
		if (num) localStorage.setItem("code-" + num, String(value));
		setCode(value);
		return;
	}, []);

	async function run() {
		if (!data) return;
		const box = document.getElementById("result");
		fetch("/api/run?user=" + user, {
			method: "POST",
			body: JSON.stringify({
				qid: data?.studentData.Q_ID,
				code: code,
				language: "c",
				course: {
					name: data?.questionData.COURSE_NAME,
					id: data?.studentData.COURSE_ID,
				},
			}),
		})
			.then((d) => d.json())
			.then((a) => {
				setRes(a);
				box?.scrollIntoView({ behavior: "smooth" });
			});
		return true;
	}

	function handleNextQuestionOnClick() {
		getCourseInfo();
		setNextQuestion(true);
	}
	async function getCourseInfo() {
		fetch("/api/circle?user=" + user, {
			method: "POST",
			body: JSON.stringify({
				course: {
					name: "PYTHON",
					id: 14,
				},
			}),
		})
			.then((d) => d.json())
			.then((a) => {
				setCourseData(a);
			});
	}

	useEffect(() => {
		const us = localStorage.getItem("userid");
		if (!us) router.push("/login");
		else setUser(us);
	}, []);

	return (
		<>
			<dialog className={styles.dialog} open={opn}>
				<div className="container d-flex flex-column justify-content-around">
					<div className="row">
						<h1>Settings</h1>
					</div>
					<div className="row d-flex">
						<form
							style={{ padding: 0, gap: 8 }}
							method="dialog"
							className="container d-flex flex-column"
						>
							<div style={{ display: "flex", gap: 8 }}>
								<input
									style={{
										opacity: 0.9,
										color: "#b1b1b1",
										cursor: "not-allowed",
									}}
									disabled={true}
									className="col-12 p-2"
									pattern="[0-9]{12}"
									value={user}
									onChange={(e) => setUser(e.target?.value)}
								/>
								<button
									className={styles.logout}
									onClick={() => {
										localStorage.setItem("userid", "");
										router.push("/login");
									}}
								>
									Logout
								</button>
							</div>
						</form>
					</div>
					<div className="row d-flex justify-content-end mt-3">
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								padding: 0,
							}}
						>
							<button
								className=" btn btn-secondary"
								type="button"
								onClick={() => setOpn(false)}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</dialog>
			<dialog className={styles.dialog} open={nextQuestion}>
				{courseData && (
					<QuestionsProgress
						user={user}
						setData={setData}
						courseData={courseData}
					/>
				)}
			</dialog>
			<div className={styles.qna}>
				{data && <h2>{String(data?.questionData?.SESSION_NAME)}</h2>}
				{data && (
					<div
						dangerouslySetInnerHTML={{
							__html: String(data.questionData.Q_DESC),
						}}
					/>
				)}
			</div>
			<div
				className="row d-flex justify-content-between mb-2 sticky-bottom"
				style={{ bottom: "10px !important", zIndex: 3 }}
			>
				<div
					className="d-flex g-6 justify-content-end"
					style={{ gap: 8, bottom: "10px !important" }}
				>
					<button
						style={{ textAlign: "center" }}
						className={styles.closebutton}
						onClick={handleNextQuestionOnClick}
					>
						Next Question
					</button>
					<button
						className={styles.closebutton}
						type="button"
						onClick={() => setOpn(true)}
					>
						Settings
					</button>
				</div>
			</div>
			<div className={styles.grid}>
				<div className={styles.caseChild}>
					<div className={styles.sideContainer}>
						<div>
							<h3>Mandatory Case</h3>
							{data && (
								<>
									<div>
										<p>{data.questionData.MANDATORY[page]}</p>
									</div>
								</>
							)}
						</div>
						{data &&
							(data.questionData.MANDATORY.length > 1 ? (
								<div className={styles.moveButtons}>
									<button
										disabled={page <= 0}
										onClick={() => setPage((i) => i - 1)}
									>
										<FaAngleLeft />
									</button>
									<p>
										{page + 1}/{data.questionData.MANDATORY.length}
									</p>
									<button
										disabled={page >= data.questionData.MANDATORY.length - 1}
										onClick={() => setPage((i) => i + 1)}
									>
										<FaAngleRight />
									</button>
								</div>
							) : null)}
					</div>
					<div className={styles.sideContainer}>
						<div>
							<h3>Test Case</h3>
							{data && (
								<div className={styles.testCase}>
									<div>
										<p>Input</p>
										<code
											dangerouslySetInnerHTML={{
												__html: String(
													data.questionData.TESTCASES[testpage].INPUT,
												),
											}}
										></code>
									</div>
									<div>
										<p>Output</p>
										<code
											dangerouslySetInnerHTML={{
												__html: String(
													data.questionData.TESTCASES[testpage].OUTPUT,
												),
											}}
										></code>
									</div>
								</div>
							)}
						</div>
						{data &&
							(data.questionData.TESTCASES.length > 1 ? (
								<div className={styles.moveButtons}>
									<button
										disabled={testpage <= 0}
										onClick={() => setTest((i) => i - 1)}
									>
										<FaAngleLeft />
									</button>
									<p>
										{testpage + 1}/{data.questionData.TESTCASES.length}
									</p>
									<button
										disabled={
											testpage >= data.questionData.TESTCASES.length - 1
										}
										onClick={() => setTest((i) => i + 1)}
									>
										<FaAngleRight />
									</button>
								</div>
							) : null)}
					</div>
				</div>

				<div className={styles.codeWrapper}>
					<p>Code Editor</p>
					<button onClick={run} className={styles.run}>
						<FaSquareCheck /> Submit
					</button>
					<CodeEditor code={code} language={language} onChange={onChange} />
					<p
						style={{
							textAlign: "right",
							marginRight: "12px",
							marginBottom: 0,
							opacity: 0.7,
							position: "relative",
							bottom: "-4px",
						}}
					>
						Powered by{" "}
						<a
							href="https://execoder.vercel.app"
							target="_blank"
							style={{ color: "#a8aceb" }}
						>
							Execoder
						</a>
					</p>
				</div>
			</div>
			<div id="result">
				{res && (
					<div className={styles.result}>
						<h2
							style={
								res.result.statusCode != "200"
									? { color: "var(--red)" }
									: { color: "var(--green)" }
							}
						>
							{res.result.evalPercentage}%
						</h2>
						{res.result.errorMsg ? (
							<pre className={styles.error}>{res.result.errorMsg}</pre>
						) : (
							<div className={styles.resVar}>
								{res.result.statusArray.map((el, ind) => {
									return (
										<div className={el.color} key={ind}>
											<p>{el.msg}</p>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
};

export default Question;
