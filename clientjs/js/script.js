// global variables
let horizontalEyesPosition = { 'left': 0, 'center': 0, 'right': 0 };
const verticalEyesPositionsInTime = [];

if (window.location.pathname == '/clientjs/index.html') {
	// Video display variables
	const videoElement = document.getElementsByClassName('input_video')[0];
	const canvasElement = document.getElementsByClassName('output_canvas')[0];
	const canvasCtx = canvasElement.getContext('2d');
	const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
	const grid = new LandmarkGrid(landmarkContainer);

	// Data variables
	const landmarksToFilter = [3, 6, 7, 8, 11, 12, 13, 14, 15, 16] // Landmarks we want to extract each second
	const indexToLocation = {
		leftEyeOuter : 0,
		rightEyeOuter : 1,
		leftEar : 2,
		rightEar : 3,
		leftShoulder: 4,
		rightShoulder: 5,
		leftElbow : 6, 
		rightElbow : 7, 
		leftWrist : 8, 
		rightWrist : 9, 
	} // index position of the landmarks we want to extract in the above array
	let elapsedTime = 0
	let startedRecording = false
	let baselineSaved = false
	let baselineLandmarks = []
	const savedData = []


	// Handle landmark tracking and updating
	function onResults(results) {
		if (!results.poseLandmarks) {
			grid.updateLandmarks([]);
			return;
		}

		document.getElementById("loader").className = "loader_remove";

		if (document.getElementById("slider").className == "slide_before") {
			document.getElementById("slider").className = "slide";
		}

		canvasCtx.save();
		canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
		canvasCtx.drawImage(results.segmentationMask, 0, 0,
			canvasElement.width, canvasElement.height);

		// Only overwrite existing pixels.
		canvasCtx.globalCompositeOperation = 'source-in';
		canvasCtx.fillStyle = 'rgba(255,255,255,0)';
		canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

		// Only overwrite missing pixels.
		canvasCtx.globalCompositeOperation = 'destination-atop';
		canvasCtx.drawImage(
			results.image, 0, 0, canvasElement.width, canvasElement.height);

		canvasCtx.globalCompositeOperation = 'source-over';
		drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
			{ color: 'rgba(237,230,242,0.7)', lineWidth: 3 });
		drawLandmarks(canvasCtx, results.poseLandmarks,
			{ color: 'rgba(237,230,242,0.4)', lineWidth: 1 });
		canvasCtx.restore();
		grid.updateLandmarks(results.poseWorldLandmarks);

		// Save data once the user starts the recording
		if (startedRecording) {
			if (!baselineSaved) {
				baselineLandmarks = landmarksToFilter.map(element => grid.landmarks[element]);
				baselineSaved = true;
			}

			// Each second, fetch relevant data for futur processing and visualisation
			const currentRotation = Math.floor(grid.rotation);
			if (currentRotation > elapsedTime) {
				elapsedTime = currentRotation;

				// Filter landmarks
				const filteredLandmarks = landmarksToFilter.map(element => grid.landmarks[element]);

				// Eye horizontal data
				switch (eyeHorizontalDelta(filteredLandmarks)) {
					case ('left'):
						horizontalEyesPosition['left'] += 1;
						sessionStorage.setItem("eyesLeft", horizontalEyesPosition['left']);
						break;
					case ('center'):
						horizontalEyesPosition['center'] += 1;
						sessionStorage.setItem("eyesCenter", horizontalEyesPosition['center']);
						console.log(sessionStorage.getItem("eyesCenter"))
						break;
					case ('right'):
						horizontalEyesPosition['right'] += 1;
						sessionStorage.setItem("eyesRight", horizontalEyesPosition['right']);
						break;
				}

				// Eye vertical data
				verticalEyesPositionsInTime.push(eyeVerticalDelta);
				sessionStorage.setItem("verticalEyesPositionsInTime", verticalEyesPositionsInTime);

				// arms crossed
				armCrossed(filteredLandmarks);

				// posture
				posture(filteredLandmarks);
			}
		}
	}

	// Determine if arms are crossed
	function posture(filteredLandmarks) {
		const baselineShoulderWidthSquared = (baselineLandmarks[indexToLocation.leftShoulder].x - baselineLandmarks[indexToLocation.rightShoulder].x) ** 2 + 
			(baselineLandmarks[indexToLocation.leftShoulder].y - baselineLandmarks[indexToLocation.rightShoulder].y) ** 2 +
			(baselineLandmarks[indexToLocation.leftShoulder].z - baselineLandmarks[indexToLocation.rightShoulder].z) ** 2;
		const currentShoulderWidthSquared = (filteredLandmarks[indexToLocation.leftShoulder].x - filteredLandmarks[indexToLocation.rightShoulder].x) ** 2 + 
			(filteredLandmarks[indexToLocation.leftShoulder].y - filteredLandmarks[indexToLocation.rightShoulder].y) ** 2 +
			(filteredLandmarks[indexToLocation.leftShoulder].z - filteredLandmarks[indexToLocation.rightShoulder].z) ** 2;
		// console.log("baselineShoulderWidthSquared");
		// console.log(baselineShoulderWidthSquared);
		// console.log("currentShoulderWidthSquared");
		// console.log(currentShoulderWidthSquared);
	}

	// Determine if arms are crossed
	function armCrossed(filteredLandmarks) {
		const leftElbowRightWristDist = (filteredLandmarks[indexToLocation.leftElbow].x - filteredLandmarks[indexToLocation.rightWrist].x) ** 2 + 
			(filteredLandmarks[indexToLocation.leftElbow].y - filteredLandmarks[indexToLocation.rightWrist].y) ** 2;
		const rightElbowLeftWristDist = (filteredLandmarks[indexToLocation.rightElbow].x - filteredLandmarks[indexToLocation.leftWrist].x) ** 2 + 
			(filteredLandmarks[indexToLocation.rightElbow].y - filteredLandmarks[indexToLocation.leftWrist].y) ** 2;
		// console.log("leftElbowRightWristDist")
		// console.log(leftElbowRightWristDist)
		// console.log("leftElbow visibility")
		// console.log(filteredLandmarks[indexToLocation.leftElbow].visibility)
		// console.log("rightWrist visibility")
		// console.log(filteredLandmarks[indexToLocation.rightWrist].visibility)

		// console.log("rightElbowRightWristDist")
		// console.log(rightElbowLeftWristDist)
		// console.log("rightElbow visibility")
		// console.log(filteredLandmarks[indexToLocation.rightElbow].visibility)
		// console.log("leftWrist visibility")
		// console.log(filteredLandmarks[indexToLocation.leftWrist].visibility)
	}


	// Determine the eye position horizontally
	function eyeHorizontalDelta(filteredLandmarks) {
		const leftEyeEarDelta = filteredLandmarks[indexToLocation.leftEar].x - filteredLandmarks[indexToLocation.leftEyeOuter].x;
		const leftEyeEarBaselineDelta = baselineLandmarks[indexToLocation.leftEar].x - baselineLandmarks[indexToLocation.leftEyeOuter].x;
		const rightEyeEarDelta = filteredLandmarks[indexToLocation.rightEyeOuter].x - filteredLandmarks[indexToLocation.rightEar].x;
		const rightEyeEarBaselineDelta = baselineLandmarks[indexToLocation.rightEyeOuter].x - baselineLandmarks[indexToLocation.rightEar].x;

		const leftEyeRatio = Math.round(leftEyeEarDelta / leftEyeEarBaselineDelta * 100)
		const rightEyeRatio = Math.round(rightEyeEarDelta / rightEyeEarBaselineDelta * 100)

		let headPosition = "center"
		if (rightEyeRatio < 60) {
			headPosition = "right";
		} else if (leftEyeRatio < 60) {
			headPosition = "left";
		}

		return headPosition;
	}

	// Determine the eye position vertically
	function eyeVerticalDelta(filteredLandmarks) {
		const leftEyeBaselineDelta = baselineLandmarks[indexToLocation.leftEyeOuter].y - filteredLandmarks[indexToLocation.leftEyeOuter].y;
		const rightEyeBaselineDelta = baselineLandmarks[indexToLocation.rightEyeOuter].y - filteredLandmarks[indexToLocation.rightEyeOuter].y;

		let headPosition = 1; // 1 = up
		if (leftEyeBaselineDelta < -0.008 && rightEyeBaselineDelta < -0.008)
			console.log("down");
			headPosition = -1; // -1 = down

		return headPosition;
	}

	// Function to handle logic onclick of start/stop button
	function clickRecording() {
		const slider = document.getElementById("slider");
		if (startedRecording) {
			//Green
			slider.className = "slide";
			slider.innerHTML = "Start";
			console.log(savedData)
		} else {
			//Red
			slider.className = "slide2";
			slider.innerHTML = "Stop";
		}
		startedRecording = !startedRecording;
	}

	const pose = new Pose({
		locateFile: (file) => {
			return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
		}
	});
	pose.setOptions({
		modelComplexity: 1,
		smoothLandmarks: true,
		enableSegmentation: true,
		smoothSegmentation: true,
		minDetectionConfidence: 0.75,
		minTrackingConfidence: 0.75
	});
	pose.onResults(onResults);

	const camera = new Camera(videoElement, {
		onFrame: async () => {
			await pose.send({ image: videoElement });
		},
		width: 720,
		height: 405
	});
	camera.start();
}
else if (window.location.pathname == '/clientjs/pages/results1.html') {
	// chart js
	const ctx1 = document.getElementById('chart1');
	console.log(sessionStorage.getItem("eyesCenter"));
	new Chart(ctx1, {
		type: 'doughnut',
		data: {
			labels: ['Left', 'Center', 'Right'],
			datasets: [{
				label: 'Seconds',
				backgroundColor: [
					'#FA8889',
					'rgb(54, 162, 235)',
					'#731DD8'
				],

				data: [sessionStorage.getItem("eyesLeft"), sessionStorage.getItem("eyesCenter"), sessionStorage.getItem("eyesRight")],
				borderWidth: 1
			}]
		},
		options: {

			plugins: {
				legend: {
					display: false
				},
				customCanvasBackgroundColor: {
					color: '#ede6f2',
				}
			}
		}
	});
} else if (window.location.pathname == '/clientjs/pages/results2.html'){
	const ctx2 = document.getElementById('chart2');

		new Chart(ctx2, {
			type: 'bar',
			data: {
				labels: ['Crossed', 'Gestures'],
				datasets: [{
					label: 'Percentage',
					backgroundColor: [
						'#731DD8',
						'#FA8889'
					],
					data: [90, 10],
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					display: false

				},
				plugins: {
					legend: {
						display: false
					},
					customCanvasBackgroundColor: {
						color: '#ede6f2',
					}
				}
			}
		});
}
