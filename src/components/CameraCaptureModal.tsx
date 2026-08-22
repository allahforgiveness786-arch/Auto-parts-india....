import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, X, Check, AlertCircle, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
  facingModePreference?: "environment" | "user";
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take Photo",
  facingModePreference = "environment",
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(facingModePreference);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping camera track", e);
        }
      });
      setStream(null);
    }
  }, [stream]);

  // Start live camera stream
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use the direct camera capture fallback.");
      }

      // Check available devices for flip button
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        setHasMultipleCameras(true);
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((err) => {
          console.warn("Video play interrupted:", err);
        });
      }
    } catch (err: any) {
      console.warn("Camera getUserMedia error:", err);
      let msg = "Could not access device camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in browser settings or use direct capture.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera found on this device.";
      }
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [stream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setFacingMode(facingModePreference);
      startCamera(facingModePreference);
    } else {
      stopStream();
      setCapturedImage(null);
      setCameraError(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingModePreference]);

  // Handle capture button click
  const handleSnapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 800;
    const height = video.videoHeight || 800;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror image for natural selfie result
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(base64);
    stopStream();
  };

  // Toggle between front and back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Confirm photo and send to parent
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Close modal
  const handleClose = () => {
    stopStream();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  // Native input fallback capture (e.g. on mobile browsers where getUserMedia is restricted in iframe)
  const handleNativeCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCapturedImage(reader.result);
        stopStream();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
        id="camera-capture-modal-root"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-blue-400" />
              <span className="text-sm font-bold text-white">{title}</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Camera"
              id="btn-close-camera-modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Viewfinder / Image Preview Area */}
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[340px] max-h-[500px] overflow-hidden">
            {/* Live Video */}
            {!capturedImage && !cameraError && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                />
                
                {/* Visual Viewfinder Overlay Grid */}
                <div className="absolute inset-0 pointer-events-none border border-white/20 m-6 rounded-2xl flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-white/80 absolute top-0 left-0 rounded-tl-xl" />
                  <div className="w-12 h-12 border-t-2 border-r-2 border-white/80 absolute top-0 right-0 rounded-tr-xl" />
                  <div className="w-12 h-12 border-b-2 border-l-2 border-white/80 absolute bottom-0 left-0 rounded-bl-xl" />
                  <div className="w-12 h-12 border-b-2 border-r-2 border-white/80 absolute bottom-0 right-0 rounded-br-xl" />
                </div>

                {isInitializing && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-2 text-white text-xs">
                    <RefreshCw size={24} className="animate-spin text-blue-400" />
                    <span>Opening Camera...</span>
                  </div>
                )}
              </>
            )}

            {/* Captured Photo Preview */}
            {capturedImage && (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="max-h-[460px] w-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} />
                  <span>Photo Captured</span>
                </div>
              </div>
            )}

            {/* Error Message & Native Fallback */}
            {cameraError && !capturedImage && (
              <div className="p-6 text-center text-slate-300 space-y-4 max-w-xs">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                </div>

                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  id="btn-trigger-native-camera"
                >
                  <Camera size={14} />
                  <span>Open System Camera</span>
                </button>
              </div>
            )}

            {/* Hidden canvas for taking snapshot */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden native input fallback */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleNativeCameraFileChange}
              className="hidden"
              id="native-camera-file-input"
            />
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
            {!capturedImage ? (
              <div className="flex items-center justify-between gap-3">
                {/* Switch Camera Button */}
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={!hasMultipleCameras && !cameraError}
                  className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-full transition-all disabled:opacity-30 cursor-pointer"
                  title="Switch Camera"
                  id="btn-switch-camera"
                >
                  <RefreshCw size={18} />
                </button>

                {/* Primary Shutter Button */}
                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  disabled={isInitializing || !!cameraError}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 active:scale-90 p-1 flex items-center justify-center shadow-lg transition-transform disabled:opacity-40 cursor-pointer"
                  title="Snap Photo"
                  id="btn-snap-photo"
                >
                  <div className="w-full h-full rounded-full border-2 border-slate-900 bg-blue-600 flex items-center justify-center text-white">
                    <Camera size={22} />
                  </div>
                </button>

                {/* Native Device Capture Fallback Button */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-full transition-all cursor-pointer"
                  title="System Camera"
                  id="btn-open-system-camera"
                >
                  <ImageIcon size={18} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-retake-photo"
                >
                  <RefreshCw size={14} />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  id="btn-confirm-use-photo"
                >
                  <Check size={14} />
                  <span>Use Photo</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
