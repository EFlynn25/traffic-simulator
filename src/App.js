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

		// { assignments: ["b", "i", "b", "f", "f", "f"] },
		// { assignments: ["i", "l", "l", "l", "f", "r"] },
		// { assignments: ["i", "i", "i", "l", "f", "r"] },
		// { assignments: ["b", "i", "b", "b", "b", "f"] },

		{ assignments: ["b", "i", "l", "l", "f", "f", "r"] },
		{ assignments: ["i", "i", "i", "l", "l", "f", "f", "f", "r"] },
		{ assignments: ["b", "i", "i", "l", "l", "f", "r"] },
		{ assignments: ["b", "i", "i", "i", "b", "l", "f", "f", "fr"] },
	];

	// App States
	const [width, height] = useWindowSize();
	const [secPerStep, setSecPerStep] = useState(1);
	const currentStep = useRef(0);
	const lanes = useRef({});

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
		// console.log(outLanes);

		lanes.current = outLanes.reduce((acc, lane) => {
			acc[lane] = { go: false };
			return acc;
		}, {});
		// console.log(lanes.current);
	}, []);

	// Loop effect
	useEffect(() => {
		const loop = setInterval(() => {
			step(currentStep.current, streets, canvasRef.current);
			currentStep.current++;
		}, secPerStep * 1000);
		// clearInterval(loop); // Turn off loop cause I'm working on other stuff
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
				<h3 style={{ marginTop: 10 }}>Sec per step</h3>
				<input
					type="range"
					onInput={(e) => setSecPerStep(e.target.value)}
					defaultValue={1}
					min={0.02}
					max={2}
					step={0.01}
				/>
				{secPerStep}
			</div>
		</div>
	);
}

export default App;
