import { useEffect, useRef, useState } from "react";
import "./App.css";
import { step } from "./step";
import { useWindowSize } from "./functions";

function App() {
	const [streets, setStreets] = useState([
		// Original
		{ assignments: ["b", "i", "l", "l", "f", "f", "r"], busyFactor: 0.25 },
		{ assignments: ["i", "i", "i", "l", "l", "f", "f", "f", "r"], busyFactor: 0.5 },
		{ assignments: ["b", "i", "i", "l", "l", "f", "r"], busyFactor: 0.25 },
		{ assignments: ["b", "i", "i", "i", "b", "l", "f", "f", "fr"], busyFactor: 0.5 },

		// Vertical street left lane, horizontal simple
		// { assignments: ["i", "l", "f"] },
		// { assignments: ["i", "f"] },
		// { assignments: ["i", "l", "f"] },
		// { assignments: ["i", "f"] },

		// For testing left turns? (messed with toward and across turn deltas)
		// { assignments: ["b", "i", "b", "f", "f", "fr"] },
		// { assignments: ["i", "l", "l", "l", "f", "r"] },
		// { assignments: ["i", "i", "i", "l", "f", "r"] },
		// { assignments: ["b", "i", "b", "b", "b", "f"] },

		// Left, forward, right turn lane
		// { assignments: ["b", "i", "b", "lf", "f", "fr"] },
		// { assignments: ["i", "l", "l", "l", "f", "r"] },
		// { assignments: ["i", "i", "i", "b", "lfr", "b"] },
		// { assignments: ["b", "i", "b", "b", "b", "lfr"] },

		// For testing left turns (messed with toward and across turn deltas)
		// { assignments: ["b", "i", "l", "l", "f", "f", "r", "b", "b", "b"] },
		// { assignments: ["i", "i", "i", "l", "l", "f", "f", "f", "r"] },
		// { assignments: ["b", "b", "b", "b", "i", "i", "l", "l", "f", "r"] },
		// { assignments: ["b", "i", "i", "i", "b", "l", "f", "f", "fr"] },

		// Simple one way
		// { assignments: ["i", "lf"], busyFactor: 0.25 },
		// { assignments: ["i", "i", "i"], busyFactor: 0.5 },
		// { assignments: ["i", "fr"], busyFactor: 0.25 },
		// { assignments: ["lf", "f", "fr"], busyFactor: 0.5 },

		// One way with dedicated turn lanes onto it
		// { assignments: ["b", "i", "l", "f"], busyFactor: 0.25 },
		// { assignments: ["i", "i", "i"], busyFactor: 0.5 },
		// { assignments: ["i", "b", "f", "r"], busyFactor: 0.25 },
		// { assignments: ["lf", "f", "fr"], busyFactor: 0.5 },
	]);
	/*

	Phases
	VT, VTS/VST, VS, HT, HTS/HST, HS
	2, 0, HT, HTS/HST, HS

	*/

	// const phases2 = [["23", "24", "25", "26"], ["02", "03", "04", "05", "06"], []];

	// App States
	const [width, height] = useWindowSize();
	const initialStepsPerSec = 30;
	const [stepsPerSec, setStepsPerSec] = useState(initialStepsPerSec);
	const [showStats, setShowStats] = useState(true);
	const currentStep = useRef(0);
	const signalState = useRef({});
	const lanes = useRef({});
	const cars = useRef([]);

	// Canvas States
	const canvasRef = useRef(null);

	// Setup effect (might run twice)
	useEffect(() => {
		const outLanes = streets.reduce((acc, street, laneIndex) => {
			const myOutLanes = street.assignments.reduce((acc, lane, index) => {
				if (lane === "i" || lane === "b") return acc;
				return [...acc, laneIndex.toString() + index.toString()];
			}, []);

			return [...acc, ...myOutLanes];
		}, []);

		lanes.current = outLanes.reduce((acc, lane) => {
			acc[lane] = { go: false };
			return acc;
		}, {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Loop effect
	useEffect(() => {
		const loop = setInterval(() => {
			step(currentStep.current, streets, lanes.current, cars, signalState.current, canvasRef.current, showStats);
			currentStep.current++;
		}, (1 / stepsPerSec) * 1000);
		return () => clearInterval(loop);
	});

	const sliderOption = (title, value, min, max, step, defaultValue, onInput) => (
		<>
			<h3 style={{ marginTop: 10 }}>{title}</h3>
			<div style={{ display: "flex", alignItems: "center", gap: 5 }}>
				<input type="range" onInput={onInput} defaultValue={defaultValue} min={min} max={max} step={step} />
				<p>{value}</p>
			</div>
		</>
	);

	return (
		<div className="App">
			<canvas
				ref={canvasRef}
				style={{ backgroundColor: "#555" }}
				width={Math.floor((width - 300) * window.devicePixelRatio)}
				height={Math.floor(height * window.devicePixelRatio)}
			/>
			<div className="sidePanel">
				<h1>Options</h1>
				{sliderOption("Steps Per Sec", stepsPerSec, 1, 60, 1, initialStepsPerSec, (e) =>
					setStepsPerSec(e.target.value)
				)}
				{sliderOption(
					"Vertical Street Busy Factor",
					streets[0].busyFactor,
					0,
					1,
					0.05,
					streets[0].busyFactor,
					(e) => {
						const streetsCopy = JSON.parse(JSON.stringify(streets));
						streetsCopy[0].busyFactor = e.target.value;
						streetsCopy[2].busyFactor = e.target.value;
						setStreets(streetsCopy);
					}
				)}
				{sliderOption(
					"Horizontal Street Busy Factor",
					streets[1].busyFactor,
					0,
					1,
					0.05,
					streets[1].busyFactor,
					(e) => {
						const streetsCopy = JSON.parse(JSON.stringify(streets));
						streetsCopy[1].busyFactor = e.target.value;
						streetsCopy[3].busyFactor = e.target.value;
						setStreets(streetsCopy);
					}
				)}
				<div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
					<h3>Show stats</h3>
					<input type="checkbox" onChange={(e) => setShowStats(e.target.checked)} checked={showStats} />
				</div>
			</div>
		</div>
	);
}

export default App;
