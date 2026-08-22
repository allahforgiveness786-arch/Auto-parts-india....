import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import RoundProfileModal from "./RoundProfileModal";

export interface UserAvatarProps {
  userId?: string;
  name?: string;
  photoURL?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  isOnline?: boolean;
  showOnlineBadge?: boolean;
  showVerifiedBadge?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  interactive?: boolean;
  enablePreview?: boolean;
  location?: string;
  title?: string;
  id?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 min-w-6 min-h-6 text-[10px]",
  sm: "w-8 h-8 min-w-8 min-h-8 text-xs",
  md: "w-10 h-10 min-w-10 min-h-10 text-sm",
  lg: "w-12 h-12 min-w-12 min-h-12 text-base",
  xl: "w-16 h-16 min-w-16 min-h-16 text-xl",
  "2xl": "w-20 h-20 min-w-20 min-h-20 text-2xl",
  "3xl": "w-24 h-24 min-w-24 min-h-24 text-3xl"
};

const badgeSizeClasses = {
  xs: "w-2 h-2 border-[1px]",
  sm: "w-2.5 h-2.5 border-[1.5px]",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
  "2xl": "w-5 h-5 border-2",
  "3xl": "w-6 h-6 border-2"
};

const avatarGradients = [
  "from-blue-600 via-indigo-600 to-indigo-800",
  "from-indigo-600 via-purple-600 to-purple-800",
  "from-teal-600 via-emerald-600 to-emerald-800",
  "from-sky-600 via-blue-600 to-indigo-700",
  "from-slate-700 via-slate-800 to-slate-950",
  "from-amber-600 via-orange-600 to-red-600",
  "from-rose-600 via-pink-600 to-purple-700"
];

export function getAvatarGradient(idOrName?: string): string {
  if (!idOrName) return avatarGradients[0];
  const charCodeSum = idOrName
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarGradients[charCodeSum % avatarGradients.length];
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "U";
  const clean = name.trim().replace(/@.+/, ""); // remove email domain if present
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

export default function UserAvatar({
  userId,
  name = "User",
  photoURL,
  size = "md",
  isOnline = false,
  showOnlineBadge = false,
  showVerifiedBadge = false,
  onClick,
  className = "",
  interactive = false,
  enablePreview = false,
  location,
  title,
  id
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [photoURL]);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const badgeClass = badgeSizeClasses[size] || badgeSizeClasses.md;
  const initials = getInitials(name);
  const gradient = getAvatarGradient(userId || name);

  const isClickable = interactive || enablePreview || !!onClick;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(e);
      return;
    }
    if (enablePreview) {
      e.stopPropagation();
      setShowPreviewModal(true);
    }
  };

  const effectivePhoto = photoURL && !imageError ? photoURL : null;

  return (
    <>
      <div
        id={id}
        title={title || (isClickable ? `View ${name}'s Profile` : name)}
        onClick={isClickable ? handleClick : undefined}
        className={`relative inline-flex shrink-0 select-none rounded-full ${
          isClickable
            ? "cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 group focus:outline-none"
            : ""
        } ${className}`}
      >
        <div
          className={`${sizeClass} aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-white shadow-xs border border-white/40 ring-1 ring-slate-200/50 relative bg-slate-900`}
        >
          {effectivePhoto ? (
            <img
              key={effectivePhoto}
              src={effectivePhoto}
              alt={name}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full aspect-square object-cover object-center rounded-full block"
            />
          ) : (
            <div
              className={`w-full h-full aspect-square bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-extrabold tracking-wider rounded-full`}
            >
              <span>{initials}</span>
            </div>
          )}
        </div>

        {/* Online presence indicator */}
        {showOnlineBadge && isOnline && (
          <span
            className={`absolute bottom-0 right-0 ${badgeClass} bg-emerald-500 rounded-full border-white shadow-xs`}
            title="Online"
          />
        )}

        {/* Verified Shield Overlay */}
        {showVerifiedBadge && (
          <span
            className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white rounded-full p-0.5 shadow-xs border border-white"
            title="Verified Member"
          >
            <ShieldCheck size={size === "3xl" ? 18 : size === "2xl" ? 16 : size === "xl" ? 14 : 10} />
          </span>
        )}
      </div>

      {enablePreview && showPreviewModal && (
        <RoundProfileModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          userId={userId}
          name={name}
          photoURL={effectivePhoto}
          location={location}
          isVerified={showVerifiedBadge}
        />
      )}
    </>
  );
}
