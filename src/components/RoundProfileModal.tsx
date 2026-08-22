import React from "react";
import { X, ShieldCheck, MapPin, MessageSquare, ExternalLink, Calendar, Camera, ImageIcon, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarGradient, getInitials } from "./UserAvatar";

export interface RoundProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  name: string;
  photoURL?: string | null;
  location?: string;
  joinedDate?: string;
  followersCount?: number;
  followingCount?: number;
  partsCount?: number;
  onViewFullProfile?: () => void;
  onStartChat?: () => void;
  isVerified?: boolean;
  isOwnProfile?: boolean;
  onEditPhoto?: () => void;
  onSelectCamera?: () => void;
  onSelectGallery?: () => void;
  onRemovePhoto?: () => void;
}

export default function RoundProfileModal({
  isOpen,
  onClose,
  userId,
  name,
  photoURL,
  location,
  joinedDate,
  followersCount,
  followingCount,
  partsCount,
  onViewFullProfile,
  onStartChat,
  isVerified = true,
  isOwnProfile = false,
  onEditPhoto,
  onSelectCamera,
  onSelectGallery,
  onRemovePhoto
}: RoundProfileModalProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [photoURL]);

  if (!isOpen) return null;

  const initials = getInitials(name);
  const gradient = getAvatarGradient(userId || name);
  const effectivePhoto = photoURL && !imageError ? photoURL : null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-60 flex items-center justify-center p-4"
        id="round-profile-modal-root"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button at top right */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 sm:right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer"
            title="Close"
            id="close-round-profile-btn"
          >
            <X size={20} />
          </button>

          {/* Large Round Avatar Container */}
          <div className="relative group cursor-pointer" onClick={onClose}>
            {/* Ambient circular glow */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl transform scale-110 pointer-events-none" />

            <div className="w-56 h-56 sm:w-64 sm:h-64 aspect-square rounded-full overflow-hidden shrink-0 border-4 border-white/90 dark:border-slate-800 shadow-2xl ring-4 ring-blue-500/40 relative bg-slate-900 flex items-center justify-center">
              {effectivePhoto ? (
                <img
                  src={effectivePhoto}
                  alt={name}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full aspect-square object-cover object-center rounded-full select-none"
                />
              ) : (
                <div className={`w-full h-full aspect-square bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-black text-6xl sm:text-7xl tracking-wider select-none rounded-full`}>
                  <span>{initials}</span>
                </div>
              )}
            </div>

            {/* Verified badge on circle */}
            {isVerified && (
              <div 
                className="absolute bottom-3 right-3 bg-blue-600 text-white rounded-full p-2 shadow-lg border-2 border-white ring-2 ring-blue-400/40"
                title="Verified Member"
              >
                <ShieldCheck size={22} className="fill-blue-50" />
              </div>
            )}
          </div>

          {/* User Information Card */}
          <div className="mt-5 w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl text-white shadow-xl">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <h2 className="text-lg font-black text-white tracking-tight">{name}</h2>
              {isVerified && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-extrabold px-2 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wider">
                  Verified
                </span>
              )}
            </div>

            {location && (
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mt-1">
                <MapPin size={13} className="text-blue-400 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}

            {joinedDate && (
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] mt-0.5">
                <Calendar size={12} className="text-slate-500 shrink-0" />
                <span>Member since {joinedDate}</span>
              </div>
            )}

            {/* Followers / Listings stats if present */}
            {(followersCount !== undefined || partsCount !== undefined) && (
              <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950/60 rounded-xl p-2.5 mt-3 border border-slate-800/50">
                <div className="text-center px-1">
                  <span className="text-sm font-black text-white block leading-tight">{followersCount ?? 0}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Followers</span>
                </div>
                <div className="text-center px-1">
                  <span className="text-sm font-black text-white block leading-tight">{followingCount ?? 0}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Following</span>
                </div>
                <div className="text-center px-1">
                  <span className="text-sm font-black text-blue-400 block leading-tight">{partsCount ?? 0}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Listings</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {isOwnProfile ? (
              <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onSelectCamera) onSelectCamera();
                      else if (onEditPhoto) onEditPhoto();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    id="round-profile-camera-btn"
                  >
                    <Camera size={14} />
                    <span>Take Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onSelectGallery) onSelectGallery();
                      else if (onEditPhoto) onEditPhoto();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    id="round-profile-gallery-btn"
                  >
                    <ImageIcon size={14} />
                    <span>Gallery</span>
                  </button>
                </div>

                {onRemovePhoto && effectivePhoto && (
                  <button
                    onClick={() => {
                      onClose();
                      onRemovePhoto();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 active:scale-95 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-rose-500/30 cursor-pointer"
                    id="round-profile-remove-photo-btn"
                    title="Remove Profile Picture"
                  >
                    <Trash2 size={13} />
                    <span>Remove Profile Photo</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
                {onStartChat && (
                  <button
                    onClick={() => {
                      onClose();
                      onStartChat();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                    id="round-profile-chat-btn"
                  >
                    <MessageSquare size={15} />
                    <span>Chat</span>
                  </button>
                )}

                {onViewFullProfile && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewFullProfile();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-black flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                    id="round-profile-view-full-btn"
                  >
                    <ExternalLink size={15} />
                    <span>Full Profile</span>
                  </button>
                )}

                {!onStartChat && !onViewFullProfile && (
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-black transition-all border border-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
