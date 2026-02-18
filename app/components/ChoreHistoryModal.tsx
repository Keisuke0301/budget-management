"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChoreListCard } from "./ChoreListCard";

interface ChoreHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
  onDeleteSuccess?: () => void;
}

export function ChoreHistoryModal({ isOpen, onClose, refreshTrigger, onDeleteSuccess }: ChoreHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>家事ログ履歴</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ChoreListCard refreshTrigger={refreshTrigger} onDeleteSuccess={onDeleteSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
