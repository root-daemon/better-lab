import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import styles from "./QuestionDisplay.module.css";

import {
	Languages,
	QuestionData,
	CompilerResponse,
	RegisteredCourse,
	CourseInfo,
} from "@/types";

import { loadLanguage } from "@uiw/codemirror-extensions-langs";

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

import {
	FaAngleLeft,
	FaAngleRight,
	FaGear,
	FaSquareCheck,
} from "react-icons/fa6";
import { TbProgressBolt } from "react-icons/tb";
import { RiEmotionHappyFill } from "react-icons/ri";

const Question = () => {
	const router = useRouter();

	const [num, setNum] = useState<number>(); // Question number
	const [user, setUser] = useState<string>(); // UserID

	const [qData, setQData] = useState<QuestionData | null>(null); // Question Data
	const [regData, setRegData] = useState<RegisteredCourse | null>(null); // Registered Course
	const [compileData, setCompileData] = useState<CompilerResponse | null>(null); // Compiler Response

	const [courseId, setCourseId] = useState("11|C"); // The course they currently working on

	const [code, setCode] = useState(""); // The code
	const [language, setLanguage] = useState(
		loadLanguage(("c" as Languages) || "shell"),
	); // Language of such course in codeblock

	const [courseData, setCourseData] = useState<CourseInfo | null>(null); // All course data (the wheel)

	const [mandatoryPage, setMandatoryPage] = useState(0); // Mandatory case pagination
	const [tcasePage, setTCasePage] = useState(0); // Test case pagination

	// Changes happen in Codeblock happens here
	const onChange = useCallback((value: string) => {
		if (num && value)
			localStorage.setItem(
				"code-" + courseId.split("|")[1] + "-" + num,
				String(value),
			);
		setCode(value);
		return;
	}, []);

	// Initial Render
	useEffect(() => {
		const us = localStorage.getItem("userid");
		if (!us) router.push("/login");
		else setUser(us);

		const lan = localStorage.getItem("course");
		if (lan) setCourseId(lan);
	}, []);

	useEffect(() => {
		setMandatoryPage(0);
		setTCasePage(0);

		setTimeout(() => {
			setCode("");
			if (num) {
				const cd = localStorage.getItem(
					"code-" + courseId.split("|")[1] + "-" + num,
				);
				if (cd) setCode(cd);
			}
		}, 1000);

		if (user && num) {
			getQuestion(num);
			(document.getElementById("wheel") as HTMLDialogElement).close();
		}
		setCompileData(null);
	}, [num, courseId]);

	useEffect(() => {
		const l = courseId.split("|")[1];
		setLanguage(loadLanguage((l.toLowerCase() as Languages) || "shell"));
	}, [courseId]);

	useEffect(() => {
		if (user) {
			fetch("/api/getreg?user=" + user)
				.then((d) => d.json())
				.then((a) => {
					setRegData(a);
				});

			const wheel = document.getElementById("wheel") as HTMLDialogElement;
			const settings = document.getElementById("settings") as HTMLDialogElement;

			wheel?.addEventListener("click", (e: any) => {
				dialogHandler(e);
			});
			settings?.addEventListener("click", (e: any) => {
				dialogHandler(e);
			});
		}
	}, [user]);

	async function getQuestion(n: number) {
		const cid = courseId.split("|")[0];
		const reg = regData?.courses.find((a: any) => a.COURSE_ID == cid);

		fetch("/api/question?id=" + n + "&user=" + user, {
			method: "POST",
			body: JSON.stringify({
				course: {
					id: reg?.COURSE_ID,
					name: reg?.COURSE_NAME,
				},
			}),
		})
			.then((d) => d.json())
			.then((a: QuestionData) => {
				setQData(a);
				if (a.studentData.CODE[0]?.value) {
					setCode(a.studentData.CODE[0].value);
					localStorage.setItem(
						"code-" + courseId.split("|")[1] + "-" + n,
						String(a.studentData.CODE[0].value),
					);
				}
			});
		return true;
	}

	function handleNextQuestionOnClick() {
		getCourseInfo().then((a) => {
			(document.getElementById("wheel") as HTMLDialogElement).showModal();
		});
	}

	async function getCourseInfo() {
		return new Promise((resolve) => {
			const [id, l] = courseId.split("|");
			if (user) {
				fetch("/api/circle?user=" + user, {
					method: "POST",
					body: JSON.stringify({
						course: {
							name: l,
							id: Number(id),
						},
					}),
				})
					.then((d) => d.json())
					.then((a) => {
						setCourseData(a);
						resolve(true);
					});
			}
		});
	}

	async function run() {
		if (!qData) return;
		const box = document.getElementById("result");
		fetch("/api/run?user=" + user + "&id=" + num, {
			method: "POST",
			body: JSON.stringify({
				qid: qData?.studentData.Q_ID,
				code: code,
				language: courseId.split("|")[1].toLowerCase(),
				course: {
					name: qData?.questionData.COURSE_NAME,
					id: qData?.studentData.COURSE_ID,
				},
			}),
		})
			.then((d) => d.json())
			.then((a) => {
				setCompileData(a);
				box?.scrollIntoView({ behavior: "smooth" });
			});
		return true;
	}

	function dialogHandler(e: MouseEvent | any) {
		if (e.target?.tagName !== "DIALOG")
			//This prevents issues with forms
			return;

		const rect = e.target.getBoundingClientRect();

		const clickedInDialog =
			rect.top <= e.clientY &&
			e.clientY <= rect.top + rect.height &&
			rect.left <= e.clientX &&
			e.clientX <= rect.left + rect.width;

		if (clickedInDialog === false) e.target.close();
	}

	return (
		<main>
			<dialog className={styles.dialog} id="settings" style={{ paddingBottom: "24px !important" }}>
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
							<div className={styles.settingFlex}>
							
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
								<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
									<p style={{ margin: 0, color: "var(--level-text)" }}>Course: </p>
									<select value={courseId} onChange={(e) => {
										localStorage.setItem('course', e.target.value)
										setCourseId(e.target.value)
										}}>
										{regData &&
											regData.courses.map(
												(
													el: { COURSE_ID: number; COURSE_NAME: string },
													index: number,
												) => {
													return (
														<option
														style={{ textTransform: "capitalize" }}
															key={index}
															value={`${el.COURSE_ID}|${el.COURSE_NAME}`}
														>
															{el.COURSE_NAME.toLowerCase()}
														</option>
													);
												},
											)}
									</select>
								</div>
							</div>
						</form>
					</div>
					
				</div>
			</dialog>
			<dialog className={styles.dialog} id="wheel">
				<div id="wheel-div">
					{courseData && (
						<QuestionsProgress
							setNum={setNum}
							num={num}
							courseData={courseData}
						/>
					)}
				</div>
			</dialog>
			<div className={styles.qna}>
				{qData && <h2>{String(qData?.questionData?.SESSION_NAME)}</h2>}
				{qData && (
					<div
						dangerouslySetInnerHTML={{
							__html: String(qData.questionData.Q_DESC),
						}}
					/>
				)}
			</div>
			<div
				className="row d-flex justify-content-between mb-2"
				style={{ position: "sticky", bottom: "10px", zIndex: 3 }}
			>
				<div
					className="d-flex g-6 justify-content-end"
					style={{ gap: 8 }}
				>
					<button
						className={styles.closebutton}
						type="button"
						style={{
							display: "flex",
							alignItems: "center",
							borderWidth: 1.8,
							padding: "8px 12px",
							fontSize: 18,
						}}
						onClick={() =>
							(
								document.getElementById("settings") as HTMLDialogElement
							).showModal()
						}
						title="Settings"
					>
						<FaGear />
					</button>
					<button
						className={styles.closebutton}
						style={{
							display: "flex",
							alignItems: "center",
							borderWidth: 1.8,
							padding: "6px 10px",
							fontSize: 22,
						}}
						onClick={handleNextQuestionOnClick}
						title="Progress (Select Question)"
					>
						<TbProgressBolt />
					</button>
				</div>
			</div>
			{(qData?.studentData.STATUS == 2 || compileData?.result.evalPercentage == "100.0") && (
				<div className={styles.completed}>
					<RiEmotionHappyFill style={{fontSize: 18}} /><p> You have completed this exercise! YAY</p>
				</div>
			)}
			<div className={styles.grid}>
				<div className={styles.caseChild}>
					<div className={styles.sideContainer} style={(qData?.studentData.STATUS == 2 || compileData?.result.evalPercentage == "100.0") ? {borderColor: "var(--green)"} : {}}>
						<div>
							<h3>Mandatory Case</h3>
							{qData && (
								<>
									<div>
										<p>{qData.questionData.MANDATORY[mandatoryPage]}</p>
									</div>
								</>
							)}
						</div>
						{qData &&
							(qData.questionData.MANDATORY.length > 1 ? (
								<div className={styles.moveButtons}>
									<button
										disabled={mandatoryPage <= 0}
										onClick={() => setMandatoryPage((i) => i - 1)}
									>
										<FaAngleLeft />
									</button>
									<p>
										{mandatoryPage + 1}/{qData.questionData.MANDATORY.length}
									</p>
									<button
										disabled={mandatoryPage >= qData.questionData.MANDATORY.length - 1}
										onClick={() => setMandatoryPage((i) => i + 1)}
									>
										<FaAngleRight />
									</button>
								</div>
							) : null)}
					</div>
					<div className={styles.sideContainer} style={(qData?.studentData.STATUS == 2 || compileData?.result.evalPercentage == "100.0") ? {borderColor: "var(--green)"} : {}}>
						<div>
							<h3>Test Case</h3>
							{qData && (
								<div className={styles.testCase}>
									<div>
										<p>Input</p>
										<code
											dangerouslySetInnerHTML={{
												__html: String(
													qData.questionData.TESTCASES[tcasePage].INPUT,
												),
											}}
										></code>
									</div>
									<div>
										<p>Output</p>
										<code
											dangerouslySetInnerHTML={{
												__html: String(
													qData.questionData.TESTCASES[tcasePage].OUTPUT,
												),
											}}
										></code>
									</div>
								</div>
							)}
						</div>
						{qData &&
							(qData.questionData.TESTCASES.length > 1 ? (
								<div className={styles.moveButtons}>
									<button
										disabled={tcasePage <= 0}
										onClick={() => setTCasePage((i) => i - 1)}
									>
										<FaAngleLeft />
									</button>
									<p>
										{tcasePage + 1}/{qData.questionData.TESTCASES.length}
									</p>
									<button
										disabled={
											tcasePage >= qData.questionData.TESTCASES.length - 1
										}
										onClick={() => setTCasePage((i) => i + 1)}
									>
										<FaAngleRight />
									</button>
								</div>
							) : null)}
					</div>
				</div>

				<div className={styles.codeWrapper} style={(qData?.studentData.STATUS == 2 || compileData?.result.evalPercentage == "100.0") ? {borderColor: "var(--green)"} : {}}>
					<p>Code Editor</p>
					<button onClick={run} disabled={code == "" || qData?.studentData.STATUS == 2} className={styles.run}>
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
				{compileData && (
					<div className={styles.result} style={
						compileData.result.evalPercentage == "100.0"
							? { borderColor: "var(--green)" }
							: ( compileData.result.errorMsg ? { borderColor: "var(--red)" } : {})
					}>
						<h2
							style={
								compileData.result.statusCode != "200"
									? { color: "var(--red)" }
									: { color: "var(--green)" }
							}
						>
							{compileData.result.evalPercentage}%
						</h2>
						{compileData.result.errorMsg ? (
							<pre className={styles.error}>{compileData.result.errorMsg}</pre>
						) : (
							<div className={styles.resVar}>
								{compileData.result.statusArray.map((el, ind) => {
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
		</main>
	);
};

export default Question;
