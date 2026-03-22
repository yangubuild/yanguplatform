import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FriendsPanel } from "../panels/FriendsPanel";

interface MobilePeopleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobilePeopleSheet({ open, onOpenChange }: MobilePeopleSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">People</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <FriendsPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
