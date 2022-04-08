// import * as Kalidokit from "kalidokit";
import { Hand } from "kalidokit";
import { matrix, multiply, inv, transpose, im } from 'mathjs'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, NormalizedLandmarkListList, Results } from '@mediapipe/hands';
import { Viewer, math } from "@xeokit/xeokit-sdk";
// import * as xeogl from "xeogl";
// import * as xeogl from "../../node_modules/xeogl/build/xeogl.js";
// const xeogl = require('xeogl');
// import * as xeogl from "xeogl";


// var box_model = new xeogl.GLTFModel({
//     id: "box",
//     src: "../../models/gltf/shapes/Box.gltf"
// });

// console.log(box_model)

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
	wx: number
	wy: number
	h: number
	// circum circle properties
	cx: number
	cy: number
	r: number
	r1: number
	r2: number
	// [xmin, ymin,zmin,xmax,ymax, zmax]

	constructor(x: number, y: number, wx: number, wy: number, h: number) {
		this.x = x
		this.y = y
		this.wx = wx
		this.wy = wy
		this.h = h
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + h
		this.r2 = r - h
	}

	setValues(xmin: number, ymin: number, xmax: number, ymax: number, zmin: number, zmax: number) {
		this.x = xmin
		this.y = ymin
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

let carTracker = new CarTracker(300, 300, 50, 50, 50)


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



const cubePositions = [
	// Front face
	-1.0, -1.0, 1.0,
	1.0, -1.0, 1.0,
	1.0, 1.0, 1.0,
	-1.0, 1.0, 1.0,

	// Back face
	-1.0, -1.0, -1.0,
	-1.0, 1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, -1.0, -1.0,

	// Top face
	-1.0, 1.0, -1.0,
	-1.0, 1.0, 1.0,
	1.0, 1.0, 1.0,
	1.0, 1.0, -1.0,

	// Bottom face
	-1.0, -1.0, -1.0,
	1.0, -1.0, -1.0,
	1.0, -1.0, 1.0,
	-1.0, -1.0, 1.0,

	// Right face
	1.0, -1.0, -1.0,
	1.0, 1.0, -1.0,
	1.0, 1.0, 1.0,
	1.0, -1.0, 1.0,

	// Left face
	-1.0, -1.0, -1.0,
	-1.0, -1.0, 1.0,
	-1.0, 1.0, 1.0,
	-1.0, 1.0, -1.0,
];



var vertices = [
	-1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
	-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
	-1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
	1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
	-1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
	-1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
];

var colors = [
	5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
	1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
	0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
	1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
	1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
	0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
];

var indices = [
	0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
	8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
	16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
];

function get_projection(angle: number, a: number, zMin: number, zMax: number) {
	var ang = Math.tan((angle * .5) * Math.PI / 180);//angle*.5
	return [
		0.5 / ang, 0, 0, 0,
		0, 0.5 * a / ang, 0, 0,
		0, 0, -(zMax + zMin) / (zMax - zMin), -1,
		0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
	];
}

var mo_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

class WebGLCubeTracker {
	cubePositions: any
	vertices: any
	colors: any
	indices: any
	Pmatrix: any
	Vmatrix: any
	Mmatrix: any
	index_buffer: any
	proj_matrix: any
	mo_matrix: number[]
	view_matrix: number[]

	constructor(cubePositions: any, vertices: any, colors: any, indices: any, mo_matrix: any, view_matrix: any, width: number, height: number) {
		this.cubePositions = cubePositions
		this.vertices = vertices
		this.colors = colors
		this.indices = indices
		this.proj_matrix = get_projection(40, width / height, 1, 100);
		this.mo_matrix = mo_matrix
		this.view_matrix = view_matrix
		this.view_matrix[14] = this.view_matrix[14] - 6;
	}
}

export let webGLCubeTracker = new WebGLCubeTracker(cubePositions, vertices, colors, indices, mo_matrix, view_matrix, 1280, 720)

export const initGL = (gl: WebGLRenderingContext) => {
	// Create and store data into vertex buffer
	var vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	// Create and store data into color buffer
	var color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	// Create and store data into index buffer
	var index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	/*=================== SHADERS =================== */

	var vertCode = 'attribute vec3 position;' +
		'uniform mat4 Pmatrix;' +
		'uniform mat4 Vmatrix;' +
		'uniform mat4 Mmatrix;' +
		'attribute vec3 color;' +//the color of the point
		'varying vec3 vColor;' +
		'void main(void) { ' +//pre-built function
		'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);' +
		'vColor = color;' +
		'}';

	var fragCode = 'precision mediump float;' +
		'varying vec3 vColor;' +
		'void main(void) {' +
		'gl_FragColor = vec4(vColor, 1.);' +
		'}';

	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	if (vertShader !== null) gl.shaderSource(vertShader, vertCode);
	if (vertShader !== null) gl.compileShader(vertShader);

	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	if (fragShader !== null) gl.shaderSource(fragShader, fragCode);
	if (fragShader !== null) gl.compileShader(fragShader);

	var shaderprogram = gl.createProgram();
	if (shaderprogram !== null && vertShader !== null) gl.attachShader(shaderprogram, vertShader);
	if (shaderprogram !== null && fragShader !== null) gl.attachShader(shaderprogram, fragShader);
	if (shaderprogram !== null) gl.linkProgram(shaderprogram);

	/*======== Associating attributes to vertex shader =====*/
	if (shaderprogram !== null) {
		var _Pmatrix = gl.getUniformLocation(shaderprogram, "Pmatrix");
		var _Vmatrix = gl.getUniformLocation(shaderprogram, "Vmatrix");
		var _Mmatrix = gl.getUniformLocation(shaderprogram, "Mmatrix");

		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
		var _position = gl.getAttribLocation(shaderprogram, "position");
		gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(_position);

		gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
		var _color = gl.getAttribLocation(shaderprogram, "color");
		gl.vertexAttribPointer(_color, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(_color);
		gl.useProgram(shaderprogram);
		return [_Pmatrix, _Vmatrix, _Mmatrix, index_buffer]
	}
	return [null, null, null, null]
}

export const drawGLCube = (gl: WebGLRenderingContext) => {
	/*==================== MATRIX ====================== */
	const width = gl.canvas.width
	const height = gl.canvas.height

	var proj_matrix = get_projection(40, width / height, 1, 100);
	/*=========================rotation================*/

	function rotateX(m: any, angle: number) {
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		var mv1 = m[1], mv5 = m[5], mv9 = m[9];

		m[1] = m[1] * c - m[2] * s;
		m[5] = m[5] * c - m[6] * s;
		m[9] = m[9] * c - m[10] * s;

		m[2] = m[2] * c + mv1 * s;
		m[6] = m[6] * c + mv5 * s;
		m[10] = m[10] * c + mv9 * s;
	}

	function rotateY(m: any, angle: number) {
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		var mv0 = m[0], mv4 = m[4], mv8 = m[8];

		m[0] = c * m[0] + s * m[2];
		m[4] = c * m[4] + s * m[6];
		m[8] = c * m[8] + s * m[10];

		m[2] = c * m[2] - s * mv0;
		m[6] = c * m[6] - s * mv4;
		m[10] = c * m[10] - s * mv8;
	}

	/*================= Mouse events ======================*/

	var AMORTIZATION = 0.95;
	var drag = false;
	var old_x: number;
	var old_y: number;
	var dX = 0, dY = 0;

	var mouseDown = function (e: any) {
		drag = true;
		old_x = e.pageX;
		old_y = e.pageY;
		e.preventDefault();
		return false;
	};

	var mouseUp = function (e: any) {
		drag = false;
	};

	var mouseMove = function (e: any) {
		if (!drag) return false;
		dX = (e.pageX - old_x) * 2 * Math.PI / width;
		dY = (e.pageY - old_y) * 2 * Math.PI / height;
		THETA += dX;
		PHI += dY;
		old_x = e.pageX
		old_y = e.pageY;
		e.preventDefault();
	};

	gl.canvas.addEventListener("mousedown", mouseDown, false);
	gl.canvas.addEventListener("mouseup", mouseUp, false);
	gl.canvas.addEventListener("mouseout", mouseUp, false);
	gl.canvas.addEventListener("mousemove", mouseMove, false);

	/*=================== Drawing =================== */

	var THETA = 0,
		PHI = 0;
	var time_old = 0;

	var animate = function (time: number) {
		var dt = time - time_old;

		if (!drag) {
			dX *= AMORTIZATION;
			dY *= AMORTIZATION;
			THETA += dX;
			PHI += dY;
		}

		//set model matrix to I4

		mo_matrix[0] = 1
		mo_matrix[1] = 0
		mo_matrix[2] = 0
		mo_matrix[3] = 0

		mo_matrix[4] = 0
		mo_matrix[5] = 1
		mo_matrix[6] = 0
		mo_matrix[7] = 0

		mo_matrix[8] = 0
		mo_matrix[9] = 0
		mo_matrix[10] = 1
		mo_matrix[11] = 0

		mo_matrix[12] = 0
		mo_matrix[13] = 0
		mo_matrix[14] = 0
		mo_matrix[15] = 1

		rotateY(mo_matrix, THETA);
		rotateX(mo_matrix, PHI);

		time_old = time;
		gl.enable(gl.DEPTH_TEST);

		// gl.depthFunc(gl.LEQUAL);

		// gl.clearColor(0.5, 0.5, 0.5, 0.9);
		gl.clearColor(0.0, 0, 0, 0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0.0, 0.0, width, height);

		gl.uniformMatrix4fv(webGLCubeTracker.Pmatrix, false, proj_matrix);
		gl.uniformMatrix4fv(webGLCubeTracker.Vmatrix, false, view_matrix);
		gl.uniformMatrix4fv(webGLCubeTracker.Mmatrix, false, mo_matrix);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webGLCubeTracker.index_buffer);
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
		window.requestAnimationFrame(animate);
	}
	return animate
}

let time = 0

/**
 * @param ctx canvas context
 * @param gl webgl context
 * @param results mediapipe model results
 */
export const drawGLCanvas = (gl: any, ctx: CanvasRenderingContext2D, results: Results, viewer: Viewer, model_aabb: any) => {
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

	// let [Pmatrix, Vmatrix, Mmatrix, index_buffer] = initGL(gl);
	// webGLCubeTracker.Pmatrix = Pmatrix
	// webGLCubeTracker.Vmatrix = Vmatrix
	// webGLCubeTracker.Mmatrix = Mmatrix
	// webGLCubeTracker.index_buffer = index_buffer
	// let animate = drawGLCube(gl);
	// animate(++time);


	// show hand landmarks
	if (results.multiHandLandmarks) {
		// show connectors and landmarks
		for (const landmarks of results.multiHandLandmarks) {
			drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 })
			drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 5 })
		}
		// show the circle based on landmarks
		// drawCircleBwHands(ctx, results.multiHandLandmarks);
		console.log(viewer.scene.modelIds)
		// console.log(model_aabb)
		// console.log("viewer scene aabb 2222", viewer.scene.getAABB(["car1"]))
		const car_model = viewer.scene.models["car1"];
		if (car_model) {
			// console.log("car highlighted: ", car_model.highlighted, car_model.pickable)
			console.log("car model", car_model.aabb)
			console.log("center", math.getAABB2Center(car_model.aabb))
			// console.log("full scene aabb", viewer.scene.aabb)
			const isGrabbingCar = detectGrabbingCar(ctx, results.multiHandLandmarks, car_model)
			console.log("grabbing car", isGrabbingCar)
			console.log(viewer.scene.highlightedObjectIds)
			if (isGrabbingCar === true) {
				let [xDev, yDev] = calcTranslation(width, height)
				console.log(xDev, yDev)
				carTracker.translate(xDev, yDev);
			}
			// car_model.destroy()
		}

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

/**
 * @param ctx
 * @param handLandmarks
 */
const drawCircleBwHands = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList) => {
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

