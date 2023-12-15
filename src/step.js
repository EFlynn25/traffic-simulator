import {
	arcCalculations,
	getFinalLane,
	pixelsPerPathStep,
	presetPhaseSignalStep,
	simpleDetectionSignalStep,
	sortCarsByStep,
} from "./functions";
import { pixelsPerSimUnit, render } from "./render";

const phases1 = [
	[
		// Phase 1
		[
			// Detection Sequence 1
			["02", "03"], // DGroup 1
			["25", "26"], // DGroup 2
		],
		[
			// Detection Sequence 2
			["23", "24"], // DGroup 1
			["04", "05", "06"], // DGroup 2
		],
	],
	[
		// Phase 2
		[
			// Detection Sequence 1
			["13", "14"], // DGroup 1
			["36", "37", "38"], // DGroup 2
		],
		[
			// Detection Sequence 2
			["35"], // DGroup 1
			["15", "16", "17", "18"], // DGroup 2
		],
	],
];

export function step(currentStep, streets, lanes, carsRef, signalState, canvas, showStats) {
	console.log("Stepping...", currentStep);

	// Randomize go lights
	const longestDimension = Math.max(streets[0].assignments.length, streets[1].assignments.length);
	const longestArcCalc = arcCalculations(longestDimension, longestDimension);
	const eachStreetPhases = [0, 1, 2, 3]
		.filter((streetIndex) =>
			streets[streetIndex].assignments.some((assignment) => assignment !== "i" && assignment !== "b")
		)
		.map((streetIndex) => Object.keys(lanes).filter((laneID) => +laneID[0] === streetIndex));
	const turnToStraightPhases = ["vt", "vs", "ht", "hs"].map((phaseID) =>
		Object.keys(lanes).filter((laneID) =>
			(phaseID[0] === "v" ? [0, 2] : [1, 3]).some((streetIndex) => {
				const assignment = streets[streetIndex].assignments[laneID[1]];
				return (
					streetIndex === +laneID[0] &&
					((phaseID[1] === "t" && assignment === "l") ||
						(phaseID[1] === "s" && (assignment === "f" || assignment.includes("r"))))
				);
			})
		)
	);
	presetPhaseSignalStep(currentStep, eachStreetPhases, lanes, signalState, longestArcCalc.stepsPerArc);
	// simpleDetectionSignalStep(currentStep, phases1, lanes, carsRef.current, signalState, longestArcCalc.stepsPerArc);

	// Remove old cars
	const longestStreetInPathSteps = Math.ceil(
		Math.max(
			window.innerWidth - 300 - streets[0].assignments.length * pixelsPerSimUnit,
			window.innerHeight - streets[1].assignments.length * pixelsPerSimUnit
		) /
			2 /
			pixelsPerPathStep
	);
	carsRef.current = carsRef.current.filter((car) => {
		return car.pathStep < longestArcCalc.stepsPerArc + longestStreetInPathSteps;
	});
	console.log("# of cars:", carsRef.current.length);

	// Step cars
	const sortedCars = sortCarsByStep(carsRef.current);
	sortedCars.forEach((car, index) => {
		if (
			(car.pathStep !== 0 || (car.pathStep === 0 && lanes[car.initialLane]?.go)) &&
			sortedCars
				.slice(index + 1)
				.every(
					(otherCar) =>
						car.initialLane !== otherCar.initialLane ||
						otherCar.pathStep - car.pathStep > 4 * (pixelsPerSimUnit / 30)
				)
		)
			car.pathStep++;
	});

	// Create new cars
	if (currentStep > 0 && currentStep % 6 === 0 && carsRef.current.length < 200) {
		for (let i = 0; i < 4; i++) {
			if (Math.random() >= streets[i].busyFactor) continue;
			const outLanes = Object.keys(lanes).filter((laneID) => +laneID[0] === i);
			if (outLanes.length === 0) continue;
			const initialLane = outLanes[Math.floor(Math.random() * outLanes.length)];
			const finalLane = getFinalLane(streets, initialLane);
			carsRef.current.push({
				initialLane,
				finalLane,
				pathStep: -longestStreetInPathSteps,
			});
		}
	}

	// Render canvas
	if (canvas) render(currentStep, streets, lanes, carsRef.current, canvas, showStats);
}
