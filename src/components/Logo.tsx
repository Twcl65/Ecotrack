import { Leaf } from "lucide-react";

type LogoProps = {
  size?: "sm" | "md";
  showTagline?: boolean;
};

export default function Logo({ size = "md", showTagline = true }: LogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${iconSize} flex shrink-0 items-center justify-center rounded-full bg-eco-primary text-white shadow-sm`}
      >
        <Leaf className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <div>
        <p className={`${textSize} font-bold leading-tight text-eco-primary`}>
          ECOTRACK
        </p>
        {showTagline && (
          <p className="text-[11px] leading-tight text-gray-500">
            Cleaner Jasaan, Greener Tomorrow
          </p>
        )}
      </div>
    </div>
  );
}
