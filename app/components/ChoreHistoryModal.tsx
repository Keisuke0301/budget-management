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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>家事ログ履歴</DialogTitle>
        </DialogHeader>
        <ChoreListCard refreshTrigger={refreshTrigger} onDeleteSuccess={onDeleteSuccess} />
      </DialogContent>
    </Dialog>
  );
}
