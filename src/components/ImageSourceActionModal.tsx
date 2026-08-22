import React, { useRef } from "react";
import { Camera, Image as ImageIcon, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageSourceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera?: () => void;
  onSelectFiles: (files: FileList | null) => void;
  onRemovePhoto?: () => void;
  title?: string;
  subtitle?: string;
  hasExistingPhoto?: boolean;
  multiple?: boolean;
  captureFacing?: "user" | "environment";
}

export default function ImageSourceActionModal({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectFiles,
  onRemovePhoto,
  title = "Add Photo",
  subtitle = "Choose an option to upload image",
  hasExistingPhoto = false,
  multiple = false,
  captureFacing = "user",
}: ImageSourceActionModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectFiles(e.target.files);
    e.target.value = "";
    onClose();
  };

  const handleCameraTrigger = () => {
    onClose();
    if (onSelectCamera) {
      onSelectCamera();
    } else if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-65 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs"
        id="image-source-action-modal-root"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Action Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pull Bar on mobile */}
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              id="btn-close-source-modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Options Grid / List */}
          <div className="space-y-2 pt-1">
            {/* 1. Direct Native Camera Option */}
            <button
              type="button"
              onClick={handleCameraTrigger}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-all cursor-pointer text-left group active:scale-[0.99]"
              id="opt-camera-source"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Camera size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Take Photo (Open Camera)</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Launch mobile camera directly</div>
              </div>
            </button>

            {/* 2. Gallery / File Picker */}
            <button
              type="button"
              onClick={() => {
                onClose();
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer text-left group active:scale-[0.99]"
              id="opt-gallery-source"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-700 dark:bg-slate-700 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <ImageIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Choose from Gallery / Files</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Select images from your device storage</div>
              </div>
            </button>

            {/* 3. Remove Photo Option (if provided and existing photo is present) */}
            {onRemovePhoto && hasExistingPhoto && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRemovePhoto();
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-all cursor-pointer text-left group active:scale-[0.99]"
                id="opt-remove-photo-source"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Trash2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Remove Profile Picture</div>
                  <div className="text-[10px] text-rose-500/80 dark:text-rose-400/80">Revert to default initials avatar</div>
                </div>
              </button>
            )}
          </div>

          {/* Hidden Direct Native Camera Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture={captureFacing}
            onChange={handleFileChange}
            className="hidden"
            id="source-modal-camera-input"
          />

          {/* Hidden File / Gallery Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            id="source-modal-file-input"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
