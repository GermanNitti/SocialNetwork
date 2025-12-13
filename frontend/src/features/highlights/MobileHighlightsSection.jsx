import HighlightsRow from "./HighlightsRow";
import ModePickerButton from "./ModePickerButton";
import { ReelsModeProvider } from "./ReelsModeProvider";

export default function MobileHighlightsSection() {
  return (
    <ReelsModeProvider>
      <div className="md:hidden space-y-3 mb-4 w-screen max-w-none -mx-6 px-6">
        <HighlightsRow />
        <ModePickerButton />
      </div>
    </ReelsModeProvider>
  );
}
