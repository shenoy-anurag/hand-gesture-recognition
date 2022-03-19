import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, NormalizedLandmarkListList, Results } from '@mediapipe/hands';

/**
 * @param ctx canvas context
 * @param results mediapipe model results
 */
export const drawCanvas = (ctx: CanvasRenderingContext2D, results: Results) => {
	const width = ctx.canvas.width
	const height = ctx.canvas.height

	ctx.save()
	ctx.clearRect(0, 0, width, height)
	ctx.scale(-1, 1)
	ctx.translate(-width, 0)
	// show image
	ctx.drawImage(results.image, 0, 0, width, height)
	// show hand landmarks
	if (results.multiHandLandmarks) {
		// show connectors and landmarks
		for (const landmarks of results.multiHandLandmarks) {
			drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 })
			drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 5 })
		}
		// show the circle based on landmarks
		drawCircle(ctx, results.multiHandLandmarks)
		drawCube(ctx, 300, 300, 50, 50, 50, '#ff8200') // green: #8fce00 red: #cc0000 orange: #ff8200 dark-blue: #2A385B
	}
	ctx.restore()
}

/**
 * @param ctx
 * @param handLandmarks
 */
const drawCircle = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList) => {
	if (handLandmarks.length === 2 && handLandmarks[0].length > 8 && handLandmarks[1].length > 8) {
		const width = ctx.canvas.width
		const height = ctx.canvas.height
		const [x1, y1] = [handLandmarks[0][8].x * width, handLandmarks[0][8].y * height]
		const [x2, y2] = [handLandmarks[1][8].x * width, handLandmarks[1][8].y * height]
		const x = (x1 + x2) / 2
		const y = (y1 + y2) / 2
		const r = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 2

		ctx.strokeStyle = '#0082cf'
		ctx.lineWidth = 5
		ctx.beginPath()
		ctx.arc(x, y, r, 0, Math.PI * 2, true)
		ctx.stroke()
	}
}

const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, wx: number, wy: number, h: number, color: string) => {
	// LINE MODE
	ctx.lineJoin = "round";

	// left face
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x - wx, y - wx * 0.5);
	ctx.lineTo(x - wx, y - h - wx * 0.5);
	ctx.lineTo(x, y - h * 1);
	ctx.closePath();
	// ctx.fillStyle = "#838357"
	ctx.fillStyle = color;
	ctx.strokeStyle = "#7a7a51";
	ctx.stroke();
	ctx.fill();

	// right face
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + wy, y - wy * 0.5);
	ctx.lineTo(x + wy, y - h - wy * 0.5);
	ctx.lineTo(x, y - h * 1);
	ctx.closePath();
	// ctx.fillStyle = "#6f6f49";
	ctx.fillStyle = color;
	ctx.strokeStyle = "#676744";
	ctx.stroke();
	ctx.fill();

	// center face
	ctx.beginPath();
	ctx.moveTo(x, y - h);
	ctx.lineTo(x - wx, y - h - wx * 0.5);
	ctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
	ctx.lineTo(x + wy, y - h - wy * 0.5);
	ctx.closePath();
	// ctx.fillStyle = "#989865";
	ctx.fillStyle = color;
	ctx.strokeStyle = "#8e8e5e";
	ctx.stroke();
	ctx.fill();
}
