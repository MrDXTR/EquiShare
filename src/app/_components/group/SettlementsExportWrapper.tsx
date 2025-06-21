"use client";

import { useRef } from "react";
import { SettlementsList } from "./SettlementsList";
import { SettlementsImageExport } from "./SettlementsImageExport";
import { api } from "~/trpc/react";

interface SettlementsExportWrapperProps {
  groupId: string;
}

export function SettlementsExportWrapper({ groupId }: SettlementsExportWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: group } = api.group.getById.useQuery(groupId);
  const groupName = group?.name || "Settlements";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SettlementsImageExport 
          groupName={groupName} 
          contentRef={contentRef} 
        />
      </div>
      
      <div ref={contentRef}>
        <SettlementsList groupId={groupId} />
      </div>
    </div>
  );
} 