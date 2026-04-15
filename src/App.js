// App.js
import React, { useEffect, useRef, useState } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        // ✅ Correct path for wasm/data files
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  const onResults = (results) => {
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw webcam feed
    ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 2 });

        // Track index fingertip (landmark #8)
        const indexTip = landmarks[8];
        const x = indexTip.x * canvasElement.width;
        const y = indexTip.y * canvasElement.height;

        // Append point to path
        setPoints((prev) => [...prev, { x, y }]);
      }
    }

    // Draw glowing writing path
    ctx.strokeStyle = "magenta";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "pink";
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    ctx.restore();
  };

  return (
    <div className="App" style={{ textAlign: "center" }}>
      <h2>MediaPipe Hands Demo – Air Writing</h2>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width="640" height="480" />
      <button
        onClick={() => setPoints([])}
        style={{
          marginTop: "10px",
          padding: "8px 16px",
          backgroundColor: "#ff00ff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Clear Writing
      </button>
    </div>
  );
}

export default App;
