import { MassHeader } from "./MassHeader";

export function SecondaryPageHeaderShell() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10 py-6 pt-8">
      <MassHeader hideTrends showLogo />
    </div>
  );
}
