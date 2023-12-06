import { getCarPos } from "./functions";

// Simulation coordinate scale... 1 V lane per x, and 1 H lane per y
export const pixelsPerSimUnit = 30;
export const simToScreen = (x, y) => {
	const centerX = (window.innerWidth - 300) / 2;
	const centerY = window.innerHeight / 2;
	return [centerX + x * pixelsPerSimUnit, centerY + y * pixelsPerSimUnit];
};

export function render(currentStep, streets, lanes, cars, canvas, showStats) {
	console.log("Rendering...");
	const context = canvas.getContext("2d");
	const markingWidth = pixelsPerSimUnit / 7.5;

	// Scale canvas for clarity
	context.scale(window.devicePixelRatio, window.devicePixelRatio);

	// Clear canvas
	context.beginPath();
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw title and stats
	context.fillStyle = "white";
	context.font = "bold 16px Montserrat";
	context.textBaseline = "top";
	context.fillText("Flynn Traffic Simulator", 10, 10);
	if (showStats) {
		context.fillText("Step: " + currentStep.toString(), 10, 30);
		context.fillText("Cars: " + cars.length.toString(), 10, 50);
	}

	// Draw streets
	const intersectionWidth = Math.max(streets[0].assignments.length, streets[2].assignments.length);
	const intersectionHeight = Math.max(streets[1].assignments.length, streets[3].assignments.length);
	const topLeftAnchor = simToScreen(-intersectionWidth / 2, -intersectionHeight / 2);
	const topRightAnchor = simToScreen(intersectionWidth / 2, -intersectionHeight / 2);
	const bottomLeftAnchor = simToScreen(-intersectionWidth / 2, intersectionHeight / 2);
	context.fillStyle = "hsl(220deg 5% 12%)";
	context.beginPath();
	context.rect(0, topLeftAnchor[1], window.innerWidth, intersectionHeight * pixelsPerSimUnit);
	context.fill();
	context.beginPath();
	context.rect(topLeftAnchor[0], 0, intersectionWidth * pixelsPerSimUnit, window.innerHeight);
	context.fill();

	context.fillStyle = "white";
	context.beginPath();
	context.rect(topLeftAnchor[0], topLeftAnchor[1] - markingWidth, intersectionWidth * pixelsPerSimUnit, markingWidth);
	context.fill();
	context.beginPath();
	context.rect(topRightAnchor[0], topRightAnchor[1], markingWidth, intersectionHeight * pixelsPerSimUnit);
	context.fill();
	context.beginPath();
	context.rect(bottomLeftAnchor[0], bottomLeftAnchor[1], intersectionWidth * pixelsPerSimUnit, markingWidth);
	context.fill();
	context.beginPath();
	context.rect(
		topLeftAnchor[0] - markingWidth,
		topLeftAnchor[1],
		markingWidth,
		intersectionHeight * pixelsPerSimUnit
	);
	context.fill();

	// Draw markings
	const markingCalculations = [
		// Street 0
		{
			vertical: true,
			originX: intersectionWidth / 2,
			originY: -intersectionHeight / 2,
			dotted: {
				xComp: -markingWidth / 2,
				yComp: -pixelsPerSimUnit,
			},
			solid: {
				xComp: 0,
				yComp: pixelsPerSimUnit - markingWidth - window.innerHeight / 2,
			},
			turn: {
				xComp: 0,
				yComp: -pixelsPerSimUnit * 3,
			},
			barrier: {
				xComp: -pixelsPerSimUnit,
				yComp: -markingWidth - window.innerHeight / 2,
			},
		},
		// Street 1
		{
			vertical: false,
			originX: intersectionWidth / 2,
			originY: intersectionHeight / 2,
			dotted: {
				xComp: pixelsPerSimUnit / 2,
				yComp: -markingWidth / 2,
			},
			solid: {
				xComp: markingWidth - pixelsPerSimUnit / 2,
				yComp: 0,
			},
			turn: {
				xComp: markingWidth - pixelsPerSimUnit / 2,
				yComp: 0,
			},
			barrier: {
				xComp: markingWidth,
				yComp: -pixelsPerSimUnit,
			},
		},
		// Street 2
		{
			vertical: true,
			originX: -intersectionWidth / 2,
			originY: intersectionHeight / 2,
			dotted: {
				xComp: -markingWidth / 2,
				yComp: pixelsPerSimUnit / 2,
			},
			solid: {
				xComp: 0,
				yComp: markingWidth - pixelsPerSimUnit / 2,
			},
			turn: {
				xComp: 0,
				yComp: markingWidth - pixelsPerSimUnit / 2,
			},
			barrier: {
				xComp: 0,
				yComp: markingWidth,
			},
		},
		// Street 3
		{
			vertical: false,
			originX: -intersectionWidth / 2,
			originY: -intersectionHeight / 2,
			dotted: {
				xComp: -pixelsPerSimUnit,
				yComp: -markingWidth / 2,
			},
			solid: {
				xComp: pixelsPerSimUnit - markingWidth - window.innerWidth / 2,
				yComp: 0,
			},
			turn: {
				xComp: -pixelsPerSimUnit * 3,
				yComp: 0,
			},
			barrier: {
				xComp: -markingWidth - window.innerWidth / 2,
				yComp: 0,
			},
		},
	];
	streets.forEach((street, index) => {
		const calc = markingCalculations[index];
		for (let x = 0; x < street.assignments.length; x++) {
			const currAssignment = street.assignments[x];
			const prevAssignment = street.assignments[x - 1];
			// Create barrier
			if (currAssignment === "b") {
				context.fillStyle = "#888";
				const coords = simToScreen(
					calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
					calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
				);
				context.beginPath();
				context.rect(
					coords[0] + calc.barrier.xComp,
					coords[1] + calc.barrier.yComp,
					calc.vertical ? pixelsPerSimUnit : window.innerWidth / 2,
					calc.vertical ? window.innerHeight / 2 : pixelsPerSimUnit
				);
				context.fill();
			}
			if (x === 0 || (prevAssignment === "b" && currAssignment === "b")) continue;
			// Lines
			if (
				(currAssignment !== "i" && prevAssignment === "i") ||
				(currAssignment !== "b" && prevAssignment === "b") ||
				(currAssignment === "b" && prevAssignment !== "i")
			) {
				// Solid line
				if (prevAssignment === "i" || (currAssignment !== "i" && prevAssignment === "b"))
					context.fillStyle = "hsl(50deg 70% 65%)";
				else context.fillStyle = "white";

				const coords = simToScreen(
					calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
					calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
				);
				context.beginPath();
				context.rect(
					coords[0] + calc.dotted.xComp + calc.solid.xComp,
					coords[1] + calc.dotted.yComp + calc.solid.yComp,
					calc.vertical ? markingWidth : window.innerWidth / 2,
					calc.vertical ? window.innerHeight / 2 : markingWidth
				);
				context.fill();
			} else {
				// Dotted white line
				context.fillStyle = "white";
				for (
					let y = 0;
					y * pixelsPerSimUnit < (calc.vertical ? window.innerHeight : window.innerWidth) / 2;
					y++
				) {
					const coords = simToScreen(
						calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : y),
						calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? y : x)
					);
					context.beginPath();
					context.rect(
						coords[0] + calc.dotted.xComp,
						coords[1] + calc.dotted.yComp,
						calc.vertical ? markingWidth : pixelsPerSimUnit / 2,
						calc.vertical ? pixelsPerSimUnit / 2 : markingWidth
					);
					context.fill();
				}
				// Turn line
				if (
					(prevAssignment !== "i" && prevAssignment !== "b" && !prevAssignment.includes("f")) ||
					(currAssignment !== "i" && currAssignment !== "b" && !currAssignment.includes("f"))
				) {
					const coords = simToScreen(
						calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
						calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
					);
					context.beginPath();
					context.rect(
						coords[0] + calc.dotted.xComp + calc.turn.xComp,
						coords[1] + calc.dotted.yComp + calc.turn.yComp,
						calc.vertical ? markingWidth : 4 * pixelsPerSimUnit - markingWidth,
						calc.vertical ? 4 * pixelsPerSimUnit - markingWidth : markingWidth
					);
					context.fill();
				}
			}
		}
	});

	// Render traffic lights
	const outLanes = Object.keys(lanes);
	outLanes.forEach((laneID) => {
		if (lanes[laneID].go) context.fillStyle = "hsl(100deg 50% 50%)";
		else context.fillStyle = "hsl(0deg 50% 50%)";
		const streetIndex = +laneID[0];
		const laneIndex = +laneID[1];
		const vertical = streetIndex % 2 === 0;
		const coords = simToScreen(
			(streetIndex < 2 ? 1 : -1) * (intersectionWidth / 2 + (vertical ? -laneIndex : 0)) +
				(streetIndex === 0 ? -1 : 0),
			(streetIndex % 3 === 0 ? -1 : 1) * (intersectionHeight / 2 + (vertical ? 0 : -laneIndex)) +
				(streetIndex === 1 ? -1 : 0)
		);
		context.beginPath();
		context.rect(
			coords[0] + (streetIndex === 3 ? -markingWidth : 0),
			coords[1] + (streetIndex === 0 ? -markingWidth : 0),
			vertical ? pixelsPerSimUnit : markingWidth,
			vertical ? markingWidth : pixelsPerSimUnit
		);
		context.fill();
	});

	// Render cars
	context.fillStyle = "white";
	cars.forEach((car) => {
		const carPos = getCarPos(streets, car);
		let coords = simToScreen(...carPos);
		context.beginPath();
		context.arc(coords[0], coords[1], pixelsPerSimUnit / 6, 0, 2 * Math.PI);
		context.fill();
	});

	// Reset canvas scaling
	context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
}
