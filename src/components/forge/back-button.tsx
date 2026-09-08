import { ChevronLeft } from "lucide-react";

type Props = {
  onClick: () => void;
  label?: string;
};

export function BackButton({ onClick, label = "Back" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 items-center gap-1 rounded-md px-2 text-sm text-muted"
    >
      <ChevronLeft className="size-5" />
      {label}
    </button>
  );
}
