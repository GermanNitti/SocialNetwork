import HighlightsRow from "./HighlightsRow";
import ModePickerButton from "./ModePickerButton";
import { ReelsModeProvider } from "./ReelsModeProvider";

export default function MobileHighlightsSection() {
  return (
    <ReelsModeProvider>
      <div className="md:hidden space-y-3 mb-4 relative left-1/2 right-1/2 w-screen -translate-x-1/2 px-4">
        <HighlightsRow />
        <ModePickerButton />
      </div>
    </ReelsModeProvider>
  );
}
