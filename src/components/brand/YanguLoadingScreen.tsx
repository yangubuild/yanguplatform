// Global short-loading experience: Yangu atmosphere + spinning Yangu mark.
// Deliberately has no "Loading / Checking / Verifying" copy.

import { YanguPageBackground } from "./YanguPageBackground";
import { YanguSpinner } from "./YanguSpinner";

export function YanguLoadingScreen({ size = 64 }: { size?: number }) {
  return (
    <YanguPageBackground contentClassName="min-h-dvh flex items-center justify-center">
      <YanguSpinner size={size} />
    </YanguPageBackground>
  );
}
