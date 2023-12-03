import { render } from "./render";

export function step(currentStep, streets, canvas) {
	console.log("Stepping...", currentStep);

	// Render canvas
	if (canvas) render(canvas, streets);
}