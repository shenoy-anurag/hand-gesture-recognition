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
import { drawCanvas, drawGLCanvas, initGL, resetCubeTracker, Pmatrix, _Vmatrix, _Mmatrix, index_buffer } from '../utils/drawCanvas';
import *  as utils from '../utils/drawCanvas';

export const App: VFC = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const canvasRef2 = useRef<HTMLCanvasElement>(null)
	const resultsRef = useRef<Results>()

	// const [resultsArr, setResultsArr] = useState([resultsRef.current?.multiHandLandmarks, resultsRef.current?.multiHandLandmarks, resultsRef.current?.multiHandLandmarks]);

	const glCtx = canvasRef2.current!.getContext('webgl')!
	let [pmatrix, vmatrix, mmatrix, i_buffer] = initGL(glCtx);

	/**
	 * @param results
	 */
	const onResults = useCallback((results: Results) => {
		resultsRef.current = results

		const canvasCtx = canvasRef.current!.getContext('2d')!
		const glCtx = canvasRef2.current!.getContext('webgl')!
		if (glCtx === null) console.log("No WebGL context!")
		drawGLCanvas(glCtx, canvasCtx, results);
		// if (glCtx === null) drawCanvas(canvasCtx, results);
		// else drawGLCanvas(glCtx, canvasCtx, results);
	}, [])

	useEffect(() => {
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
			<canvas ref={canvasRef2} className={styles.canvas} width={1280} height={720} />
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
