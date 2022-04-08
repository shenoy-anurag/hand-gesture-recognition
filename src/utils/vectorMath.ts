import { matrix, multiply, inv, transpose, im } from 'mathjs'

export function degrees_to_radians(degrees: number) {
    return degrees * (Math.PI / 180);
}

export function calcDistance(x1: number, y1: number, x2: number, y2: number) {
	const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
	return dist
}

export function calcCentroid(points: any[]) {
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
