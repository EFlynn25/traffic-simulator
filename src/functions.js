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
		const outLanes = Object.keys(lanes);
		outLanes.forEach((laneID) => (lanes[laneID].go = false));
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
