// Simulation coordinate scale... 1 V lane per x, and 1 H lane per y
const pixelsPerSimUnit = 30;
export const simToScreen = (x, y) => {
	const centerX = (window.innerWidth - 300) / 2;
	const centerY = window.innerHeight / 2;
	return [centerX + x * pixelsPerSimUnit, centerY + y * pixelsPerSimUnit];
};

export function render(canvas, streets) {
	console.log("Rendering...");
	const context = canvas.getContext("2d");

	// Scale canvas for clarity
	context.scale(window.devicePixelRatio, window.devicePixelRatio);

	// Clear canvas
	context.beginPath();
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Draw streets
	const intersectionWidth = Math.max(streets[0].assignments.length, streets[2].assignments.length);
	const intersectionHeight = Math.max(streets[1].assignments.length, streets[3].assignments.length);
	const topLeftAnchor = simToScreen(-intersectionWidth / 2, -intersectionHeight / 2);
	const topRightAnchor = simToScreen(intersectionWidth / 2, -intersectionHeight / 2);
	const bottomLeftAnchor = simToScreen(-intersectionWidth / 2, intersectionHeight / 2);
	// const bottomRightAnchor = simToScreen(intersectionWidth / 2, intersectionHeight / 2);
	context.fillStyle = "hsl(220deg 5% 12%)";
	context.beginPath();
	context.rect(0, topLeftAnchor[1], window.innerWidth, intersectionHeight * pixelsPerSimUnit);
	context.fill();
	context.beginPath();
	context.rect(topLeftAnchor[0], 0, intersectionWidth * pixelsPerSimUnit, window.innerHeight);
	context.fill();

	context.fillStyle = "white";
	context.beginPath();
	context.rect(topLeftAnchor[0], topLeftAnchor[1] - 4, intersectionWidth * pixelsPerSimUnit, 4);
	context.fill();
	context.beginPath();
	context.rect(topRightAnchor[0], topRightAnchor[1], 4, intersectionHeight * pixelsPerSimUnit);
	context.fill();
	context.beginPath();
	context.rect(bottomLeftAnchor[0], bottomLeftAnchor[1], intersectionWidth * pixelsPerSimUnit, 4);
	context.fill();
	context.beginPath();
	context.rect(topLeftAnchor[0] - 4, topLeftAnchor[1], 4, intersectionHeight * pixelsPerSimUnit);
	context.fill();

	// Draw markings
	const markingCalculations = (street) => {
		if (street === 0)
			return {
				vertical: true,
				originX: intersectionWidth / 2,
				originY: -intersectionHeight / 2,
				dotted: {
					xComp: -2,
					yComp: -30,
				},
				solid: {
					xComp: 0,
					yComp: 26 - window.innerHeight / 2,
				},
				turn: {
					xComp: 0,
					yComp: -90,
				},
				barrier: {
					xComp: -30,
					yComp: -4 - window.innerHeight / 2,
				},
			};
		else if (street === 1)
			return {
				vertical: false,
				originX: intersectionWidth / 2,
				originY: intersectionHeight / 2,
				dotted: {
					xComp: 15,
					yComp: -2,
				},
				solid: {
					xComp: -11,
					yComp: 0,
				},
				turn: {
					xComp: -11,
					yComp: 0,
				},
				barrier: {
					xComp: 4,
					yComp: -30,
				},
			};
		else if (street === 2)
			return {
				vertical: true,
				originX: -intersectionWidth / 2,
				originY: intersectionHeight / 2,
				dotted: {
					xComp: -2,
					yComp: 15,
				},
				solid: {
					xComp: 0,
					yComp: -11,
				},
				turn: {
					xComp: 0,
					yComp: -11,
				},
				barrier: {
					xComp: 0,
					yComp: 4,
				},
			};
		else if (street === 3)
			return {
				vertical: false,
				originX: -intersectionWidth / 2,
				originY: -intersectionHeight / 2,
				dotted: {
					xComp: -30,
					yComp: -2,
				},
				solid: {
					xComp: 26 - window.innerWidth / 2,
					yComp: 0,
				},
				turn: {
					xComp: -90,
					yComp: 0,
				},
				barrier: {
					xComp: -4 - window.innerWidth / 2,
					yComp: 0,
				},
			};
	};
	streets.forEach((street, index) => {
		const calc = markingCalculations(index);
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
					calc.vertical ? 30 : window.innerWidth / 2,
					calc.vertical ? window.innerHeight / 2 : 30
				);
				context.fill();
			}
			if (x === 0 || (prevAssignment === "b" && currAssignment === "b")) continue;
			// Lines
			if (
				(currAssignment !== "i" && prevAssignment === "i") ||
				(currAssignment !== "b" && prevAssignment === "b")
			) {
				// Solid line
				if (prevAssignment === "i" || currAssignment !== "i") context.fillStyle = "hsl(50deg 70% 65%)";
				else context.fillStyle = "white";

				const coords = simToScreen(
					calc.originX + (index % 3 === 0 ? -1 : 1) * (calc.vertical ? x : 0),
					calc.originY + (index < 2 ? -1 : 1) * (calc.vertical ? 0 : x)
				);
				context.beginPath();
				context.rect(
					coords[0] + calc.dotted.xComp + calc.solid.xComp,
					coords[1] + calc.dotted.yComp + calc.solid.yComp,
					calc.vertical ? 4 : window.innerWidth / 2,
					calc.vertical ? window.innerHeight / 2 : 4
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
						calc.vertical ? 4 : 15,
						calc.vertical ? 15 : 4
					);
					context.fill();
				}
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
						calc.vertical ? 4 : 116,
						calc.vertical ? 116 : 4
					);
					context.fill();
				}
			}
		}
	});

	// Reset canvas scaling
	context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
}