import React from "react";

interface FeedTabsProps {
  active?: "forYou" | "squads" | "help" | "explore";
  onChange?: (tab: FeedTabsProps["active"]) => void;
  className?: string;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  active = "forYou",
  onChange,
  className,
}) => {
  const tabs: { id: FeedTabsProps["active"]; label: string }[] = [
    { id: "forYou", label: "Para vos" },
    { id: "squads", label: "Squads" },
    { id: "help", label: "Ayuda" },
    { id: "explore", label: "Explorar" },
  ];

  const cx = (...classes: (string | undefined | false)[]) =>
    classes.filter(Boolean).join(" ");

  return (
    <div className={cx("flex items-center border-b border-white/10", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange?.(tab.id)}
          className={cx(
            "relative px-3 pb-2 text-sm font-medium transition-colors",
            active === tab.id ? "text-emerald-300" : "text-white/45 hover:text-white"
          )}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-emerald-400" />
          )}
        </button>
      ))}
    </div>
  );
};
