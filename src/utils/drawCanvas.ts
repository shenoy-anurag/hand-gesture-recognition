// import * as Kalidokit from "kalidokit";
import { Hand } from "kalidokit";
import { matrix, multiply, inv, transpose, im } from 'mathjs'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, NormalizedLandmarkListList, Results } from '@mediapipe/hands';
import { start } from "repl";

function calcDistance(x1: number, y1: number, x2: number, y2: number) {
	const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
	return dist
}

function calcCentroid(points: any[]) {
	let centerX = 0
	let centerY = 0
	let xSum = 0
	let ySum = 0
	for (let i = 0; i < points.length; i++) {
		xSum += points[i][0]
		ySum += points[i][1]
	}
	centerX = xSum / points.length
	centerY = ySum / points.length
	return [centerX, centerY]
}


class ResultsManager {
	resultsArr: any[]
	resultsWorldArr: any[]
	rotationMat: any

	constructor(resultsArr: any[], resultsWorldArr?: any[]) {
		this.resultsArr = resultsArr
		this.resultsWorldArr = resultsWorldArr ? resultsWorldArr : [undefined, undefined, undefined]
	}

	setResultsArr(currResults: any) {
		this.resultsArr = [...this.resultsArr.slice(1, 3), currResults]
	}

	setResultsWorldArr(currResults: any) {
		this.resultsWorldArr = [...this.resultsWorldArr.slice(1, 3), currResults]
	}
}

class CubeTracker {
	x: number
	y: number
	wx: number
	wy: number
	h: number
	color: string
	strokeColor: string
	// circum circle properties
	cx: number
	cy: number
	r: number
	r1: number
	r2: number

	constructor(x: number, y: number, wx: number, wy: number, h: number, color: string, strokeColor: string) {
		this.x = x
		this.y = y
		this.wx = wx
		this.wy = wy
		this.h = h
		this.color = color
		this.strokeColor = strokeColor
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + h
		this.r2 = r - h
	}

	translate(xDeviation: number, yDeviation: number) {
		this.x += xDeviation
		this.y += yDeviation
		this.cx += xDeviation
		this.cy += yDeviation
	}

	circumCircle() {
		const [x1, y1] = [this.x - this.wx, this.y - this.wx * 0.5]
		const [x2, y2] = [this.x + this.wy, this.y - this.h - this.wy * 0.5]
		const x = (x1 + x2) / 2
		const y = (y1 + y2) / 2
		const r = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 2
		return [x, y, r]
	}

	resetCubeTracker() {
		this.x = 300
		this.y = 300
		this.wx = 50
		this.wy = 50
		this.h = 50
		this.color = '#ff8200'
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + this.h
		this.r2 = r - this.h
	}
}

export const resetCubeTracker = () => {
	cubeTracker.resetCubeTracker()
}

let rsm = new ResultsManager([undefined, undefined, undefined])
let cubeTracker = new CubeTracker(300, 300, 50, 50, 50, '#ff8200', '#ff6000')


class CarTracker {
	x: number
	y: number
	z: number
	wx: number
	wy: number
	h: number
	// circum circle properties
	cx: number
	cy: number
	r: number
	r1: number
	r2: number
	position: any
	rotation: any
	// [xmin, ymin,zmin,xmax,ymax, zmax]

	constructor(x: number, y: number, z: number, wx: number, wy: number, h: number) {
		this.x = x
		this.y = y
		this.z = z
		this.wx = wx
		this.wy = wy
		this.h = h
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + h
		this.r2 = r - h
		this.position = null
		this.rotation = null
	}

	setValues(xmin: number, ymin: number, xmax: number, ymax: number, zmin: number, zmax: number) {
		this.x = xmin
		this.y = ymin
		this.z = zmin
		this.wx = xmax - xmin
		this.wy = ymax - ymin
		this.h = zmax - zmin
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + this.h
		this.r2 = r - this.h
	}

	translate(xDeviation: number, yDeviation: number) {
		this.x += xDeviation
		this.y += yDeviation
		this.cx += xDeviation
		this.cy += yDeviation
	}

	circumCircle() {
		const [x1, y1] = [this.x - this.wx, this.y - this.wx * 0.5]
		const [x2, y2] = [this.x + this.wy, this.y - this.h - this.wy * 0.5]
		const x = (x1 + x2) / 2
		const y = (y1 + y2) / 2
		const r = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 2
		return [x, y, r]
	}
}

let carTracker = new CarTracker(300, 300, 50, 50, 50, 50)


function calcTranslation(width: number, height: number) {
	if (rsm.resultsArr !== undefined && rsm.resultsArr.length > 2) {
		// console.log(rsm.resultsWorldArr)
		let curr: any = rsm.resultsArr[2]
		let prev: any = rsm.resultsArr[1]

		// console.log(curr, prev)
		if (curr !== undefined && prev !== undefined) {
			if (curr.length > 0 && prev.length > 0) {
				let mat1 = [
					[prev[0][4].x * width, prev[0][4].y * height, prev[0][4].z * height],
					[prev[0][8].x * width, prev[0][8].y * height, prev[0][8].z * height],
					[prev[0][12].x * width, prev[0][12].y * height, prev[0][12].z * height],
					[prev[0][20].x * width, prev[0][20].y * height, prev[0][20].z * height]
				]

				let mat2 = [
					[curr[0][4].x * width, curr[0][4].y * height, curr[0][4].z * height],
					[curr[0][8].x * width, curr[0][8].y * height, curr[0][8].z * height],
					[curr[0][12].x * width, curr[0][12].y * height, curr[0][12].z * height],
					[curr[0][20].x * width, curr[0][20].y * height, curr[0][20].z * height]
				]

				const [cxPrev, cyPrev] = calcCentroid(mat1)
				const [cxCurr, cyCurr] = calcCentroid(mat2)

				let xDeviation = cxCurr - cxPrev
				let yDeviation = cyCurr - cyPrev
				return [xDeviation, yDeviation]
			}
		}
		return [0, 0]
	}
	return [0, 0]
}


function calcRotation() {
	let curr: any = rsm.resultsArr[2]
	let prev: any = rsm.resultsArr[2]

	let mat1 = matrix(
		[
			[prev[0][4].x, prev[0][4].y, prev[0][4].z],
			[prev[0][8].x, prev[0][8].y, prev[0][8].z],
			[prev[0][12].x, prev[0][12].y, prev[0][12].z],
			[prev[0][20].x, prev[0][20].y, prev[0][20].z]
		]
	)

	let mat2 = matrix(
		[
			[curr[0][4].x, curr[0][4].y, curr[0][4].z],
			[curr[0][8].x, curr[0][8].y, curr[0][8].z],
			[curr[0][12].x, curr[0][12].y, curr[0][12].z],
			[curr[0][20].x, curr[0][20].y, curr[0][20].z]
		]
	)

	// R = np.random.randn(3,3)
	// print(R)
	// Vectors = np.random.randn(3,10)

	// Rotated_vectors = np.matmul(R,Vectors)

	// (np.matmul(np.matmul(np.linalg.inv(np.matmul(Vectors,Vectors.T)),Vectors),Rotated_vectors.T)).T

	let mulVal: any = multiply(transpose(mat1), mat1)
	let inverseMat: any = inv(mulVal)
	mulVal = multiply(inverseMat, transpose(mat1))
	mulVal = multiply(mulVal, mat2)
	rsm.rotationMat = transpose(mulVal)
}

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, linewidth?: number, color?: string) => {
	ctx.strokeStyle = color ? color : '#0082cf'
	ctx.lineWidth = linewidth ? linewidth : 5
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2, true)
	ctx.stroke()
}

const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, wx: number, wy: number, h: number, color: string, strokeColor?: string, stroke?: boolean, fill?: boolean) => {
	// const canvasRef = useRef<HTMLCanvasElement>(null)
	// canvasRef.current!.getContext("experimental-webgl")
	// LINE MODE
	ctx.lineJoin = "round";

	if (stroke === undefined) stroke = true
	if (fill === undefined) fill = true
	if (strokeColor === undefined) strokeColor = '#FFFFFF'

	// left face
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x - wx, y - wx * 0.5);
	ctx.lineTo(x - wx, y - h - wx * 0.5);
	ctx.lineTo(x, y - h * 1);
	ctx.closePath();
	// ctx.fillStyle = "#838357"
	ctx.fillStyle = color;
	// ctx.strokeStyle = "#7a7a51";
	ctx.strokeStyle = strokeColor;
	if (stroke === true) ctx.stroke();
	if (fill === true) ctx.fill();

	// right face
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + wy, y - wy * 0.5);
	ctx.lineTo(x + wy, y - h - wy * 0.5);
	ctx.lineTo(x, y - h * 1);
	ctx.closePath();
	// ctx.fillStyle = "#6f6f49";
	ctx.fillStyle = color;
	// ctx.strokeStyle = "#676744";
	ctx.strokeStyle = strokeColor;
	if (stroke === true) ctx.stroke();
	if (fill === true) ctx.fill();

	// center face
	ctx.beginPath();
	ctx.moveTo(x, y - h);
	ctx.lineTo(x - wx, y - h - wx * 0.5);
	ctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
	ctx.lineTo(x + wy, y - h - wy * 0.5);
	ctx.closePath();
	// ctx.fillStyle = "#989865";
	ctx.fillStyle = color;
	// ctx.strokeStyle = "#8e8e5e";
	ctx.strokeStyle = strokeColor;
	if (stroke === true) ctx.stroke();
	if (fill === true) ctx.fill();

	// let [x1, y1, r1] = cubeTracker.circumCircle();
	// drawCircle(ctx, x1, y1, r1);
}

const detectGrabbingCube = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList) => {
	if (handLandmarks.length === 1 && handLandmarks[0] !== undefined) {
		if (handLandmarks.length === 1 && handLandmarks[0].length > 8) {
			const width = ctx.canvas.width
			const height = ctx.canvas.height
			const [x1, y1] = [handLandmarks[0][8].x * width, handLandmarks[0][8].y * height]
			const [x2, y2] = [handLandmarks[0][4].x * width, handLandmarks[0][4].y * height]
			const dist1 = Math.abs(calcDistance(x1, y1, cubeTracker.cx, cubeTracker.cy))
			const dist2 = Math.abs(calcDistance(x2, y2, cubeTracker.cx, cubeTracker.cy))
			// console.log(dist1, dist2, cubeTracker.r1, cubeTracker.r2, cubeTracker.cx, cubeTracker.cy)
			if (dist1 < cubeTracker.r1 && dist2 < cubeTracker.r1 && dist1 > cubeTracker.r2 && dist2 > cubeTracker.r2) {
				return true
			} else return false
		}
	}
	return false
}

const detectGrabbingCar = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList, car_model: any) => {
	if (handLandmarks.length === 1 && handLandmarks[0] !== undefined) {
		if (handLandmarks.length === 1 && handLandmarks[0].length > 8) {
			const width = ctx.canvas.width
			const height = ctx.canvas.height
			const [x1, y1] = [handLandmarks[0][8].x * width, handLandmarks[0][8].y * height]
			const [x2, y2] = [handLandmarks[0][4].x * width, handLandmarks[0][4].y * height]
			const [xmin, ymin, zmin, xmax, ymax, zmax] = car_model.aabb
			carTracker.setValues(xmin, ymin, xmax, ymax, zmin, zmax)
			const dist1 = Math.abs(calcDistance(x1, y1, carTracker.cx, carTracker.cy))
			const dist2 = Math.abs(calcDistance(x2, y2, carTracker.cx, carTracker.cy))
			// console.log(dist1, dist2, carTracker.r1, carTracker.r2, carTracker.cx, carTracker.cy)
			if (dist1 < carTracker.r1 && dist2 < carTracker.r1 && dist1 > carTracker.r2 && dist2 > carTracker.r2) {
				return true
			} else return false
		}
	}
	return false
}

export const translateCar = (parent_mesh: any, scene: BABYLON.Scene, carTracker: CarTracker, deviations: number[]) => {
	// var startPoint = new BABYLON.Vector3(1, 3, 2);
	// parent_mesh.position = startPoint;
	// var translateVector = new BABYLON.Vector3(2, 1, 4);
	// var endPoint = startPoint.add(translateVector);
	// var distance = translateVector.length();
	// var direction = new BABYLON.Vector3(translateVector.x, translateVector.y, translateVector.z);

	var startPoint = parent_mesh.position;
	console.log("position", startPoint)
	parent_mesh.movePOV(deviations[0] / 10, - deviations[1] / 10, 0)
	parent_mesh.alwaysSelectAsActiveMesh = true

	// scene.onBeforeRenderObservable.add(() => {
	// 	//code to execute
	// 	parent_mesh.movePOV(deviations[0], deviations[1], 0)
	// });

	// var startPoint = parent_mesh.position;
	// console.log("position", startPoint)
	// var translateVector = new BABYLON.Vector3(startPoint.x + deviations[0], startPoint.y + deviations[1], startPoint.z + deviations[2]);
	// var distance = translateVector.length();
	// var direction = new BABYLON.Vector3(deviations[0], deviations[1], deviations[2]);
	// direction.normalize();
	// scene.registerAfterRender(function () {
	// 	// parent_mesh.translate(direction, distance, BABYLON.Space.WORLD)
	// 	parent_mesh.translate(BABYLON.Axis.Y, deviations[1], BABYLON.Space.LOCAL);
	// 	parent_mesh.translate(BABYLON.Axis.X, deviations[0], BABYLON.Space.LOCAL);
	// })
	// carTracker.x = startPoint.x
	// carTracker.y = startPoint.y
	// carTracker.z = startPoint.z
	carTracker.position = parent_mesh.position
}

export const rotateCar = (parent_mesh: any, scene: BABYLON.Scene, carTracker: CarTracker, angles: number[]) => {
	parent_mesh.rotation.x = angles[0]; //rotation around x axis
	parent_mesh.rotation.y = angles[1];  //rotation around y axis
	parent_mesh.rotation.z = angles[2]; //rotation around z axis
	carTracker.rotation = parent_mesh.rotation
}

/**
 * @param ctx canvas context
 * @param gl webgl context
 * @param results mediapipe model results
 */
export const drawGLCanvas = (gl: any, ctx: CanvasRenderingContext2D, results: Results, scene: BABYLON.Scene, parent_mesh: any) => {
	rsm.setResultsArr(results.multiHandLandmarks)
	rsm.setResultsWorldArr(results.multiHandWorldLandmarks)
	// console.log(rsm.resultsArr)

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
		// drawCircleBwHands(ctx, results.multiHandLandmarks);

		// const isGrabbingCar = detectGrabbingCar(ctx, results.multiHandLandmarks, car_model)
		// 	console.log("grabbing car", isGrabbingCar)
		// 	if (isGrabbingCar === true) {
		// 		let [xDev, yDev] = calcTranslation(width, height)
		// 		console.log(xDev, yDev)
		// 		carTracker.translate(xDev, yDev);
		// 	}
		// }
		let [xDev, yDev] = calcTranslation(width, height)
		let deviations = [xDev, yDev, 0]
		console.log("deviations", deviations)
		translateCar(parent_mesh, scene, carTracker, deviations)


		const isGrabbing = detectGrabbingCube(ctx, results.multiHandLandmarks)
		console.log(isGrabbing)
		if (isGrabbing === true) {
			let [xDev, yDev] = calcTranslation(width, height)
			console.log(xDev, yDev)
			cubeTracker.translate(xDev, yDev);
		}

		if (results.multiHandLandmarks !== undefined && results.multiHandLandmarks.length > 0) {
			let rightHandRig = Hand.solve(results.multiHandLandmarks[0], "Right")
			console.log(rightHandRig)
			var angles = [
				rightHandRig?.RightWrist.x ? rightHandRig?.RightWrist.x : 0, 
				rightHandRig?.RightWrist.y ? rightHandRig?.RightWrist.y : 0, 
				rightHandRig?.RightWrist.z ? rightHandRig?.RightWrist.z : 0
			]
			rotateCar(parent_mesh, scene, carTracker, angles)
		}
		drawCube(ctx, cubeTracker.x, cubeTracker.y, cubeTracker.wx, cubeTracker.wy, cubeTracker.h, cubeTracker.color) // green: #8fce00 red: #cc0000 orange: #ff8200 dark-blue: #2A385B
		drawCube(ctx, 1000, 200, 100, 100, 100, '#cc0000', '#ffffff', true, false) // green: #8fce00 red: #cc0000 orange: #ff8200 dark-blue: #2A385B
	}
	ctx.restore()
}

/**
 * @param ctx webgl context
 * @param results mediapipe model results
 */
export const drawCanvas = (ctx: CanvasRenderingContext2D, results: Results) => {
	rsm.setResultsArr(results.multiHandLandmarks)
	rsm.setResultsWorldArr(results.multiHandWorldLandmarks)
	// console.log(rsm.resultsArr)

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
		// drawCircleBwHands(ctx, results.multiHandLandmarks);
		const isGrabbing = detectGrabbingCube(ctx, results.multiHandLandmarks)
		console.log(isGrabbing)
		if (isGrabbing === true) {
			let [xDev, yDev] = calcTranslation(width, height)
			console.log(xDev, yDev)
			cubeTracker.translate(xDev, yDev);
		}
		if (results.multiHandLandmarks !== undefined && results.multiHandLandmarks.length > 0) {
			let rightHandRig = Hand.solve(results.multiHandLandmarks[0], "Right")
			console.log(rightHandRig)
		}
		drawCube(ctx, cubeTracker.x, cubeTracker.y, cubeTracker.wx, cubeTracker.wy, cubeTracker.h, cubeTracker.color) // green: #8fce00 red: #cc0000 orange: #ff8200 dark-blue: #2A385B
		drawCube(ctx, 1000, 200, 100, 100, 100, '#cc0000', '#ffffff', true, false) // green: #8fce00 red: #cc0000 orange: #ff8200 dark-blue: #2A385B
	}
	ctx.restore()
}

// /**
//  * @param ctx
//  * @param handLandmarks
//  */
// const drawCircleBwHands = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList) => {
// 	if (handLandmarks.length === 2 && handLandmarks[0].length > 8 && handLandmarks[1].length > 8) {
// 		const width = ctx.canvas.width
// 		const height = ctx.canvas.height
// 		const [x1, y1] = [handLandmarks[0][8].x * width, handLandmarks[0][8].y * height]
// 		const [x2, y2] = [handLandmarks[1][8].x * width, handLandmarks[1][8].y * height]
// 		const x = (x1 + x2) / 2
// 		const y = (y1 + y2) / 2
// 		const r = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 2

// 		ctx.strokeStyle = '#0082cf'
// 		ctx.lineWidth = 5
// 		ctx.beginPath()
// 		ctx.arc(x, y, r, 0, Math.PI * 2, true)
// 		ctx.stroke()
// 	}
// }

