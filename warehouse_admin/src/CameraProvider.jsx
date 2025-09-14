// CameraProvider.jsx
import React, { createContext, useRef, useState, useEffect } from "react";

export const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let isMounted = true;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(mediaStream => { if (isMounted) setStream(mediaStream); })
      .catch(err => console.error("Failed to access webcam:", err));
    return () => {
      isMounted = false;
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <CameraContext.Provider value={{ stream }}>
      {children}
    </CameraContext.Provider>
  );
};
