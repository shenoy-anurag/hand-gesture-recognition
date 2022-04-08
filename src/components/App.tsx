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
import * as BABYLON from 'babylonjs';
import { Engine, Scene } from 'babylonjs';
import 'babylonjs-loaders';


let gScene: BABYLON.Scene | any

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
		console.log("in results")
		// let [pmatrix, vmatrix, mmatrix, i_buffer] = initGL(glCtx);
		// webGLCubeTracker.Pmatrix = pmatrix
		// webGLCubeTracker.Vmatrix = vmatrix
		// webGLCubeTracker.Mmatrix = mmatrix
		// webGLCubeTracker.index_buffer = i_buffer
		// findBoundingBox(gScene)
		findBoundingBox2(gScene)
		var projectedPosition = getProjectedPosition(gScene)
		console.log(projectedPosition);
		drawGLCanvas(glCtx, canvasCtx, results);
		// if (glCtx === null) drawCanvas(canvasCtx, results);
		// else drawGLCanvas(glCtx, canvasCtx, results);


	}, [])

	const getProjectedPosition = (scene: BABYLON.Scene) => {
		let engine = scene.getEngine();
        let globalViewport= scene.cameras[0].viewport.toGlobal(
            engine.getRenderWidth(),
            engine.getRenderHeight()
        );

        let projectedPosition = BABYLON.Vector3.Project(
            new BABYLON.Vector3(1,2,3), 
            BABYLON.Matrix.Identity(), 
            scene.getTransformMatrix(), 
            globalViewport
        );
		return projectedPosition
	}

	const findBoundingBox2 = (scene: BABYLON.Scene) => {
		var root_meshes = scene.meshes.filter((x) => {
			return x.parent == null
		})
		var root: any = root_meshes[0]
		let childMeshes = root.getChildMeshes();
		let min = childMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
		let max = childMeshes[0].getBoundingInfo().boundingBox.maximumWorld;
		for (let i = 0; i < childMeshes.length; i++) {
			let meshMin = childMeshes[i].getBoundingInfo().boundingBox.minimumWorld;
			let meshMax = childMeshes[i].getBoundingInfo().boundingBox.maximumWorld;

			min = BABYLON.Vector3.Minimize(min, meshMin);
			max = BABYLON.Vector3.Maximize(max, meshMax);
		}
		console.log(min)
		console.log(max)
		const size = max.subtract(min);

		const boundingInfo = new BABYLON.BoundingInfo(min, max);
		const bbCenterWorld = boundingInfo.boundingBox.centerWorld;

		const m = BABYLON.MeshBuilder.CreateBox("bounds", { size: 1 }, scene);
		m.scaling.copyFrom(size);
		m.position.copyFrom(bbCenterWorld);
		m.visibility = 0.1;

		console.log("Width: ", size.x);
		console.log("Height: ", size.y);
		console.log("Depth: ", size.z);
		console.log("Position: ", bbCenterWorld)
		return [size, bbCenterWorld]
	}

	const findBoundingBox = (scene: BABYLON.Scene) => {
		var root_meshes = scene.meshes.filter((x) => {
			return x.parent == null
		})
		var root: any = root_meshes[0]
		// console.log(root_meshes)
		// console.log(scene.meshes)

		var min: any = null;
		var max: any = null;
		scene.meshes.forEach(function (mesh) {
			const boundingBox = mesh.getBoundingInfo().boundingBox;
			if (min === null) {
				min = new BABYLON.Vector3();
				min.copyFrom(boundingBox.minimum);
			}

			if (max === null) {
				max = new BABYLON.Vector3();
				max.copyFrom(boundingBox.maximum);
			}

			min.x = boundingBox.minimum.x < min.x ? boundingBox.minimum.x : min.x;
			min.y = boundingBox.minimum.y < min.y ? boundingBox.minimum.y : min.y;
			min.z = boundingBox.minimum.z < min.z ? boundingBox.minimum.z : min.z;

			max.x = boundingBox.maximum.x > max.x ? boundingBox.maximum.x : max.x;
			max.y = boundingBox.maximum.y > max.y ? boundingBox.maximum.y : max.y;
			max.z = boundingBox.maximum.z > max.z ? boundingBox.maximum.z : max.z;
		})

		const size = max.subtract(min);

		const boundingInfo = new BABYLON.BoundingInfo(min, max);
		const bbCenterWorld = boundingInfo.boundingBox.centerWorld;

		const m = BABYLON.MeshBuilder.CreateBox("bounds", { size: 1 }, scene);
		m.scaling.copyFrom(size);
		m.position.copyFrom(bbCenterWorld);
		m.visibility = 0.12;

		console.log("Width: ", size.x);
		console.log("Height: ", size.y);
		console.log("Depth: ", size.z);
		console.log("Position: ", bbCenterWorld)
		return [size, bbCenterWorld]
	}


	useEffect(() => {
		const glCtx = canvasRef2.current!.getContext('webgl', { premultipliedAlpha: false })!
		var engine = new BABYLON.Engine(glCtx, true); // Generate the BABYLON 3D engine

		/******* Add the create scene function ******/
		var createScene = function () {
			// Create the scene space
			var scene = new BABYLON.Scene(engine);

			// scene.autoClear = false
			scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
			// Add a camera to the scene and attach it to the canvas
			var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, 15 * Math.PI / 32, 25, BABYLON.Vector3.Zero(), scene);
			camera.attachControl(glCtx, true);

			// Add lights to the scene
			var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
			var light2 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 1, -1), scene);

			// GLTFFileLoader.IncrementalLoading = false
			BABYLON.SceneLoader.Append("assets/gltf/honda_civic/scene.gltf", "", scene, function (scene) {
				console.log("loaded model!")
				// findBoundingBox(scene);
				findBoundingBox2(scene)
			}, null, null, ".gltf");

			scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

			return scene;
		};

		/******* End of the create scene function ******/
		var scene = createScene(); //Call the createScene function

		engine.runRenderLoop(function () { // Register a render loop to repeatedly render the scene
			gScene = scene
			scene.render();
		});

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

	// // Log to console
	// const OutputData = () => {
	// 	const results = resultsRef.current!
	// 	console.log(results.multiHandLandmarks)
	// 	// setResultsArr([
	// 	// 	...resultsArr.slice(1, 3),
	// 	// 	resultsRef.current?.multiHandLandmarks
	// 	// ]);
	// 	// console.log(resultsArr)
	// }

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
