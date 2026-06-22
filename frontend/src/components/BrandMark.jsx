import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function BrandMark({
  textClassName = "text-[#0E0E52]",
  iconClassName = "w-9 h-9",
  showText = true,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {!imageFailed ? (
        <img
          src="/brand-mark.png"
          alt="AnySpot logo"
          className={`${iconClassName} object-contain`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className={`${iconClassName} rounded-full bg-[#0E0E52] flex items-center justify-center text-white`}>
          <Sparkles size={18} />
        </div>
      )}
      {showText ? (
        <span className={`font-display text-xl font-semibold tracking-tight ${textClassName}`}>
          AnySpot
        </span>
      ) : null}
    </div>
  );
}
