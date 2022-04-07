// https://google.github.io/mediapipe/solutions/hands
// https://google.github.io/mediapipe/getting_started/javascript.html
// https://github.com/google/mediapipe
// https://stackoverflow.com/questions/67674453/how-to-run-mediapipe-facemesh-on-a-es6-node-js-environment-alike-react
// https://www.npmjs.com/package/react-webcam

import React, { useCallback, useEffect, useRef, VFC } from 'react';
import Webcam from 'react-webcam';
import { css } from '@emotion/css';
import { Camera } from '@mediapipe/camera_utils';
import { Hands, Results } from '@mediapipe/hands';
import { drawCanvas, drawGLCanvas, initGL, resetCubeTracker, webGLCubeTracker } from '../utils/drawCanvas';
import *  as utils from '../utils/drawCanvas';
import { Viewer, GLTFLoaderPlugin, STLLoaderPlugin, CameraControl } from "@xeokit/xeokit-sdk";

let viewer: any
// let viewer: Viewer

export const App: VFC = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const canvasRef2 = useRef<HTMLCanvasElement>(null)
	const resultsRef = useRef<Results>()

	/**
	 * @param results
	 */
	const onResults = useCallback((results: Results) => {
		resultsRef.current = results

		const canvasCtx = canvasRef.current!.getContext('2d')!
		const glCtx = canvasRef2.current!.getContext('webgl', { premultipliedAlpha: false })!
		if (glCtx === null) console.log("No WebGL context!")
		// let [pmatrix, vmatrix, mmatrix, i_buffer] = initGL(glCtx);
		// webGLCubeTracker.Pmatrix = pmatrix
		// webGLCubeTracker.Vmatrix = vmatrix
		// webGLCubeTracker.Mmatrix = mmatrix
		// webGLCubeTracker.index_buffer = i_buffer
		drawGLCanvas(glCtx, canvasCtx, results);
		// if (glCtx === null) drawCanvas(canvasCtx, results);
		// else drawGLCanvas(glCtx, canvasCtx, results);

		
	}, [])

	useEffect(() => {
		viewer = new Viewer({
			// canvasId: "glCanvas",
			canvasElement: canvasRef2.current!,
			transparent: true
		});

		// viewer.camera.eye = [-3.933, 2.855, 27.018];
		// viewer.camera.look = [4.400, 3.724, 8.899];
		// viewer.camera.up = [-0.018, 0.999, 0.039];

		viewer.camera.eye = [0, 0, 0];
		viewer.camera.look = [4.400, 3.724, 8.899];
		viewer.camera.up = [-0.018, 0.999, 0.039];
		viewer.scene.selectedMaterial.fillAlpha = 0.9;

		const gltfLoader = new GLTFLoaderPlugin(viewer);
		// const box_model = gltfLoader.load({
		// 	id: "assets/gltf/shapes/Box0.bin",
		// 	src: "assets/gltf/shapes/Box.gltf",
		// 	position: [25, 15, 5],
		// 	rotation: [0, 0, -90],
		// 	scale: [1, 1, 1],
		// 	edges: true,
		// });
		// box_model.on("loaded", () => {
		// 	viewer.cameraFlight.flyTo(box_model);
		// });
		// console.log("numPoints", box_model.visible)
		// box_model.destroy()

		const box_model = gltfLoader.load({
			id: "box1",
			src: "assets/gltf/shapes/BoxTextured.gltf",
			position: [25, 15, 5],
			rotation: [0, 0, -90],
			scale: [10, 10, 10],
			edges: true,
			performance: false
		});
		box_model.on("loaded", () => {
			viewer.cameraFlight.flyTo(box_model);
		});
		console.log("numPoints", box_model.visible)
		box_model.destroy()

		// const gltfLoader = new GLTFLoaderPlugin(viewer);
		// const avocado_model = gltfLoader.load({
		// 	id: "assets/gltf/Avocado/Avocado.gltf",
		// 	src: "assets/gltf/Avocado/Avocado.gltf",
		// });
		// avocado_model.on("loaded", () => {
		// 	viewer.cameraFlight.flyTo(avocado_model);
		// });
		// avocado_model.destroy()

		// const stlLoader = new STLLoaderPlugin(viewer);

		// const geometry_dash_model = stlLoader.load({
		// 	id: "assets/games/geo-dash.stl",
		// 	src: "assets/games/geo-dash.stl",
		// 	position: [0.5, -0.5, 0.2],
		// 	rotation: [0, 0, -90],
		// 	scale: [.05, .05, .05]
		// });
		// geometry_dash_model.on("loaded", function () { // Model is an Entity
		// 	viewer.cameraFlight.flyTo(geometry_dash_model);
		// });
		// geometry_dash_model.destroy();

		// const cube = stlLoader.load({
		// 	id: "assets/cube/perfect-cube.stl",
		// 	src: "assets/cube/perfect-cube.stl",
		// 	edges: true,
		// 	smoothNormals: true,
		// 	position: [25, 15, 5],
		// 	rotation: [0, 0, -90],
		// 	scale: [.05, .05, .05]
		// });
		// cube.on("loaded", function () { // Model is an Entity
		// 	viewer.cameraFlight.flyTo(cube);
		// });
		// cube.destroy()

		// const rotate = () => {
		// 	viewer.camera.orbitYaw(-0.2);
		// }
		// viewer.scene.on("tick", rotate);

		const hands = new Hands({
			locateFile: file => {
				return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
			}
		})

		hands.setOptions({
			maxNumHands: 2,
			modelComplexity: 1,
			minDetectionConfidence: 0.5,
			minTrackingConfidence: 0.5
		})

		hands.onResults(onResults)

		if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
			const camera = new Camera(webcamRef.current.video!, {
				onFrame: async () => {
					await hands.send({ image: webcamRef.current!.video! })
				},
				width: 1280,
				height: 720
			})
			camera.start()
		}
	}, [onResults])

	// Log to console
	const OutputData = () => {
		const results = resultsRef.current!
		console.log(results.multiHandLandmarks)
		// setResultsArr([
		// 	...resultsArr.slice(1, 3),
		// 	resultsRef.current?.multiHandLandmarks
		// ]);
		// console.log(resultsArr)
	}

	const ResetTask = () => {
		resetCubeTracker()
	}

	return (
		<div className={styles.container}>
			{/* capture */}
			<Webcam
				audio={false}
				style={{ visibility: 'hidden' }}
				width={1280}
				height={720}
				ref={webcamRef}
				screenshotFormat="image/jpeg"
				videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
			/>
			{/* draw */}
			<canvas ref={canvasRef} className={styles.canvas} width={1280} height={720} />
			<canvas ref={canvasRef2} className={styles.gl} width={1280} height={720} itemID="glCanvas" />
			{/* output */}
			<div className={styles.buttonContainer}>
				{/* <button className={styles.button} onClick={OutputData}>
					Output Data
				</button> */}
				<button className={styles.button} onClick={ResetTask}>
					Reset
				</button>
			</div>
		</div>
	)
}

// ==============================================
// styles

const styles = {
	container: css`
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	`,
	canvas: css`
		position: absolute;
		width: 1280px;
		height: 720px;
		background-color: #fff;
	`,
	gl: css`
		position: absolute;
		width: 1280px;
		height: 720px;
		border:0px #000000 none;
	`,
	buttonContainer: css`
		position: absolute;
		top: 10px;
		left: 10px;
	`,
	button: css`
		color: #fff;
		background-color: #0082cf;
		font-size: 1rem;
		border: none;
		border-radius: 5px;
		padding: 10px 10px;
		cursor: pointer;
	`
}
