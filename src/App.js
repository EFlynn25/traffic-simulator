import { useEffect, useRef, useState } from "react";
import "./App.css";
import { step } from "./step";
import { useWindowSize } from "./functions";

function App() {
	const streets = [
		// { assignments: ["i", "l", "f"] },
		// { assignments: ["i", "f"] },
		// { assignments: ["i", "l", "f"] },
		// { assignments: ["i", "f"] },

		// { assignments: ["b", "i", "b", "f", "f", "fr"] },
		// { assignments: ["i", "l", "l", "l", "f", "r"] },
		// { assignments: ["i", "i", "i", "l", "f", "r"] },
		// { assignments: ["b", "i", "b", "b", "b", "f"] },

		// { assignments: ["b", "i", "b", "lf", "f", "fr"] },
		// { assignments: ["i", "l", "l", "l", "f", "r"] },
		// { assignments: ["i", "i", "i", "b", "lfr", "b"] },
		// { assignments: ["b", "i", "b", "b", "b", "lfr"] },

		// { assignments: ["b", "i", "l", "l", "f", "f", "r", "b", "b", "b"] },
		// { assignments: ["i", "i", "i", "l", "l", "f", "f", "f", "r"] },
		// { assignments: ["b", "b", "b", "b", "i", "i", "l", "l", "f", "r"] },
		// { assignments: ["b", "i", "i", "i", "b", "l", "f", "f", "fr"] },

		{ assignments: ["b", "i", "l", "l", "f", "f", "r"] },
		{ assignments: ["i", "i", "i", "l", "l", "f", "f", "f", "r"] },
		{ assignments: ["b", "i", "i", "l", "l", "f", "r"] },
		{ assignments: ["b", "i", "i", "i", "b", "l", "f", "f", "fr"] },
	];
	/*

	Phases
	VT, VTS/VST, VS, HT, HTS/HST, HS
	2, 0, HT, HTS/HST, HS

	*/

	// App States
	const [width, height] = useWindowSize();
	const initialStepsPerSec = 30;
	const [stepsPerSec, setStepsPerSec] = useState(initialStepsPerSec);
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
			step(currentStep.current, streets, lanes.current, cars, signalState.current, canvasRef.current);
			currentStep.current++;
		}, (1 / stepsPerSec) * 1000);
		return () => clearInterval(loop);
	});

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
				<h3 style={{ marginTop: 10 }}>Steps per sec</h3>
				<div style={{ display: "flex", alignItems: "center", gap: 5 }}>
					<input
						type="range"
						onInput={(e) => setStepsPerSec(e.target.value)}
						defaultValue={initialStepsPerSec}
						min={1}
						max={60}
						step={1}
					/>
					<p>{stepsPerSec}</p>
				</div>
			</div>
		</div>
	);
}

export default App;
