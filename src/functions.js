import { useState, useLayoutEffect } from "react";
import { pixelsPerSimUnit } from "./render";

// Hooks

export function useWindowSize() {
	const [size, setSize] = useState([0, 0]);
	useLayoutEffect(() => {
		function updateSize() {
			setSize([window.innerWidth, window.innerHeight]);
		}
		window.addEventListener("resize", updateSize);
		updateSize();
		return () => window.removeEventListener("resize", updateSize);
	}, []);
	return size;
}

// Car Functions

export const pixelsPerPathStep = 5;
export const sortCarsByStep = (cars) => cars.sort((a, b) => a.pathStep - b.pathStep);
export const getDirection = (initialStreetIndex, finalStreetIndex) =>
	(initialStreetIndex + 2) % 4 === finalStreetIndex
		? "f"
		: (initialStreetIndex + 1) % 4 === finalStreetIndex
		? "l"
		: "r";
export const arcCalculations = (towardArcDelta, acrossArcDelta) => ({
	arcRadius: Math.min(acrossArcDelta, towardArcDelta),
	stepToStartArc:
		1 +
		(towardArcDelta > acrossArcDelta
			? (towardArcDelta - acrossArcDelta) * (pixelsPerSimUnit / pixelsPerPathStep)
			: 0),
	stepsPerArc: Math.min(acrossArcDelta, towardArcDelta) * (50 / pixelsPerPathStep) * (pixelsPerSimUnit / 30),
});

export function getFinalLane(streets, initialLane) {
	const initialStreetIndex = +initialLane[0];
	const initialLaneIndex = +initialLane[1];
	const initialStreet = streets[initialStreetIndex];
	let direction = initialStreet.assignments[initialLaneIndex];
	if (direction.length > 1) direction = direction[Math.floor(Math.random() * direction.length)];
	if (direction === "f") {
		const finalStreetIndex = (initialStreetIndex + 2) % 4;
		return finalStreetIndex.toString() + (initialStreet.assignments.length - initialLaneIndex - 1).toString();
	} else if (direction === "l") {
		const finalStreetIndex = (initialStreetIndex + 1) % 4;
		const finalStreet = streets[finalStreetIndex];
		let leftIndex = -1;
		for (let l = 0; l < initialStreet.assignments.length; l++) {
			if (initialStreet.assignments[l].includes("l")) leftIndex++;
			if (l === initialLaneIndex) break;
		}
		for (let l = finalStreet.assignments.length - 1; l >= 0; l--) {
			if (finalStreet.assignments[l] === "i") leftIndex--;
			if (leftIndex === -1) {
				return finalStreetIndex.toString() + l.toString();
			}
		}
	} else if (direction === "r") {
		const finalStreetIndex = (initialStreetIndex + 3) % 4;
		const finalStreet = streets[finalStreetIndex];
		return finalStreetIndex.toString() + finalStreet.assignments.indexOf("i").toString();
	}
}

export function getCarPos(streets, car) {
	const initialStreetIndex = +car.initialLane[0];
	const initialLaneIndex = +car.initialLane[1];
	const finalStreetIndex = +car.finalLane[0];
	const finalLaneIndex = +car.finalLane[1];
	const initialStreet = streets[initialStreetIndex];
	const finalStreet = streets[finalStreetIndex];
	const direction = getDirection(initialStreetIndex, finalStreetIndex);
	let toward =
		-(streets[initialStreetIndex % 2 === 0 ? 1 : 0].assignments.length / 2) +
		(initialStreetIndex % 2 === 0 ? 1 : 0) -
		4 / 6;
	let across =
		initialLaneIndex -
		Math.floor(initialStreet.assignments.length / 2) +
		(initialStreet.assignments.length % 2 === 0 ? 0.5 : 0);

	if (direction === "f") {
		toward += car.pathStep * (pixelsPerPathStep / pixelsPerSimUnit);
	} else if (direction === "l" || direction === "r") {
		const acrossArcDelta =
			direction === "l" ? initialLaneIndex + 1 : initialStreet.assignments.length - initialLaneIndex;
		const towardArcDelta = direction === "l" ? finalStreet.assignments.length - finalLaneIndex : finalLaneIndex + 1;
		const arcCalc = arcCalculations(towardArcDelta, acrossArcDelta);
		const arcRadius = arcCalc.arcRadius;
		const stepToStartArc = arcCalc.stepToStartArc;
		const stepsPerArc = arcCalc.stepsPerArc;
		if (car.pathStep < stepToStartArc) {
			toward += car.pathStep * (pixelsPerPathStep / pixelsPerSimUnit);
		} else if (car.pathStep <= stepToStartArc + stepsPerArc) {
			toward +=
				stepToStartArc * (pixelsPerPathStep / pixelsPerSimUnit) +
				arcRadius * Math.sin(((car.pathStep - stepToStartArc) / stepsPerArc) * (Math.PI / 2));
			across +=
				(direction === "l" ? 1 : -1) *
				(arcRadius * Math.cos(((car.pathStep - stepToStartArc) / stepsPerArc) * (Math.PI / 2)) - arcRadius);
		} else {
			toward += stepToStartArc * (pixelsPerPathStep / pixelsPerSimUnit) + arcRadius;
			across +=
				(direction === "l" ? -1 : 1) *
				(arcRadius + (car.pathStep - stepToStartArc - stepsPerArc) * (pixelsPerPathStep / pixelsPerSimUnit));
		}
	}

	if (initialStreetIndex === 0) return [-across, toward - 1];
	else if (initialStreetIndex === 1) return [-toward, -across];
	else if (initialStreetIndex === 2) return [across, -toward + 1];
	else if (initialStreetIndex === 3) return [toward, across];
}

// Traffic Signal Algorithms

export function presetPhaseSignalStep(currentStep, phases, lanes, signalState, stepsPerArc) {
	const cycleDuration = 120 + stepsPerArc;
	if ((currentStep + stepsPerArc) % cycleDuration === 0) {
		console.log("Reset streets");

		// Set new street go index
		if (!signalState.nextPhase) signalState.nextPhase = 0;
		signalState.nextPhase = (signalState.nextPhase + 1) % phases.length;

		// Reset all streets
		// const outLanes = Object.keys(lanes);
		Object.keys(lanes).forEach((laneID) => (lanes[laneID].go = false));
	}
	if (currentStep % cycleDuration === 0) {
		console.log("Set new street");

		// Set new street go
		const nextPhase = signalState.nextPhase ?? 0;
		Object.keys(lanes).forEach((laneID) => {
			if (phases[nextPhase].includes(laneID)) {
				lanes[laneID].go = true;
			}
		});
	}
}

/*
signalState:
	currentPhase: int
	phaseTimer: int
	betweenPhaseClearTimer: int
	detectionStates: int[]
	betweenDetectionClearTimers: int[]
	lanes:
		[laneID]:
			detectionTimer: int
*/
const maxLaneTime = 150;
const minLaneTime = 40;
export function simpleDetectionSignalStep(currentStep, phases, lanes, cars, signalState, stepsPerArc) {
	if (Object.keys(signalState).length === 0) {
		console.log("Initializing signalState...");
		signalState.currentPhase = -1;
		signalState.phaseTimer = 0;
		signalState.phaseTimeElapsed = 0;
		signalState.betweenPhaseClearTimer = 0;
		signalState.detectionStates = [];
		signalState.betweenDetectionClearTimers = [];
		signalState.lanes = Object.keys(lanes).reduce((acc, lane) => {
			acc[lane] = { detectionTimer: 0 };
			return acc;
		}, {});
		console.log(JSON.parse(JSON.stringify(signalState)));
	}

	if (signalState.phaseTimer > 0) {
		// -- STEP PHASE --
		console.log("Stepping current phase...");
		signalState.phaseTimer--;
		signalState.phaseTimeElapsed++;

		// Decrement detection timers
		Object.keys(lanes).forEach((laneID) => {
			if (signalState.lanes[laneID].detectionTimer > 0) signalState.lanes[laneID].detectionTimer--;
		});

		// Detect lanes
		cars.forEach((car) => {
			if (car.pathStep >= -30 && car.pathStep <= 0) {
				if (Object.keys(lanes).some((laneID) => laneID === car.initialLane && lanes[laneID].go))
					console.log("Detected", car.initialLane);
				signalState.lanes[car.initialLane].detectionTimer = minLaneTime;
			}
		});

		// Prepare lane switches
		phases[signalState.currentPhase].forEach((detectionSequence, index) => {
			const myDetectionState = signalState.detectionStates[index];
			const elapsedTimeCap = (myDetectionState + 1) * maxLaneTime + myDetectionState * stepsPerArc;
			console.log(index, myDetectionState, elapsedTimeCap);
			if (signalState.phaseTimeElapsed === elapsedTimeCap) console.log("Max time reached for detection lane");
			if (
				myDetectionState < detectionSequence.length - 1 &&
				signalState.betweenDetectionClearTimers[index] === -1 &&
				(detectionSequence[myDetectionState].every(
					(laneID) => signalState.lanes[laneID].detectionTimer === 0
				) ||
					signalState.phaseTimeElapsed === elapsedTimeCap)
			) {
				// ** Detection time limit reached **
				console.log("Preparing lanes switches due to detection...");

				// Turn off current lights
				detectionSequence[signalState.detectionStates[index]].forEach((laneID) => (lanes[laneID].go = false));

				// Set clear timer
				signalState.betweenDetectionClearTimers[index] = stepsPerArc;
			}
		});

		// Check between detection clear timers
		signalState.betweenDetectionClearTimers.forEach((clearTimer, index) => {
			if (clearTimer === 0) {
				// Increment detection state
				signalState.detectionStates[index]++;

				// Turn on new lights
				phases[signalState.currentPhase][index][signalState.detectionStates[index]].forEach((laneID) => {
					lanes[laneID].go = true;
					signalState.lanes[laneID].detectionTimer = minLaneTime;
				});
			}

			if (clearTimer >= 0) {
				signalState.betweenDetectionClearTimers[index]--;
			}
		});
		console.log(signalState.betweenDetectionClearTimers);

		console.log(JSON.parse(JSON.stringify(signalState)));
	} else if (signalState.betweenPhaseClearTimer > 0) {
		// -- CLEAR INTERSECTION --
		console.log("Waiting for intersection to clear...");

		// Reset all lanes
		if (signalState.betweenPhaseClearTimer === stepsPerArc)
			Object.keys(lanes).forEach((laneID) => (lanes[laneID].go = false));

		// Decrement clear timer
		signalState.betweenPhaseClearTimer--;
	} else {
		// -- NEXT PHASE --
		console.log("Setting next phase...");

		// Reset all lanes
		Object.keys(lanes).forEach((laneID) => (lanes[laneID].go = false));

		// Set next phase
		const nextPhase = (signalState.currentPhase + 1) % phases.length;
		const longestDetectionSequenceLength = Math.max(...phases[nextPhase].map((detectList) => detectList.length));
		signalState.currentPhase = nextPhase;
		signalState.phaseTimer = longestDetectionSequenceLength * (maxLaneTime + stepsPerArc);
		signalState.phaseTimeElapsed = 0;
		signalState.betweenPhaseClearTimer = stepsPerArc;
		signalState.detectionStates = phases[nextPhase].map(() => 0);
		signalState.betweenDetectionClearTimers = phases[nextPhase].map(() => -1);
		phases[nextPhase].forEach((detectionSequence) => {
			detectionSequence[0].forEach((laneID) => {
				lanes[laneID].go = true;
				signalState.lanes[laneID].detectionTimer = minLaneTime;
			});
		});

		console.log(JSON.parse(JSON.stringify(signalState)));
	}
}
