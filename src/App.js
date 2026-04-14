import React, { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);

  useEffect(() => {
    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    // Handle results from MediaPipe
    hands.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Draw video feed
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        let x = indexTip.x * canvas.width;
        let y = indexTip.y * canvas.height;

        // Smooth fingertip movement
        const smoothFactor = 0.7;
        if (lastPointRef.current) {
          x = x * (1 - smoothFactor) + lastPointRef.current.x * smoothFactor;
          y = y * (1 - smoothFactor) + lastPointRef.current.y * smoothFactor;
        }

        // Pinch detection (draw only when thumb and index are close)
        const distance = Math.hypot(
          (indexTip.x - thumbTip.x) * canvas.width,
          (indexTip.y - thumbTip.y) * canvas.height
        );
        const drawMode = distance < 40; // threshold in pixels

        if (drawMode) {
          if (lastPointRef.current) {
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          lastPointRef.current = { x, y };
        } else {
          lastPointRef.current = null;
        }

        // Fingertip marker
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = drawMode ? "green" : "red";
        ctx.fill();
      } else {
        lastPointRef.current = null;
      }
    });

    // Set up camera
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
}

export default App;
