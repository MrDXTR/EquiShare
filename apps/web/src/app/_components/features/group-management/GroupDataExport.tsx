"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import {
  convertToCSV,
  generateAllGroupData,
  downloadCSV,
  generatePDF,
} from "./exportUtils";
import type { Group } from "./utils";

interface GroupDataExportProps {
  group: Group;
}

export function GroupDataExport({ group }: GroupDataExportProps) {
  const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);

  const { data: settlements } = api.settlement.list.useQuery(
    {
      groupId: group.id,
    },
    {
      enabled: !!group.id,
      staleTime: 5 * 60 * 1000,
    },
  );

  const handleExport = async (type: "csv" | "pdf") => {
    setIsExporting(type);

    try {
      const filename = `${group.name.replace(/\s+/g, "-")}-export`;
      const allData = generateAllGroupData(group, settlements || []);
      const csvData = convertToCSV(allData);

      if (type === "csv") {
        downloadCSV(csvData, `${filename}.csv`);
        toast.success("CSV file downloaded!");
      } else if (type === "pdf") {
        const pdfBlob = await generatePDF(csvData, group.name, group);
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("PDF file downloaded!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-lg border-border/80 bg-background/80 text-muted-foreground hover:text-foreground active:scale-[0.96] transition-[transform,border-color,background-color] duration-150"
          aria-label="Export options"
        >
          <Download className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/80 p-1.5">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          Export Group Data
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />

        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isExporting !== null}
          className="cursor-pointer rounded-lg py-2 text-xs font-medium"
        >
          {isExporting === "csv" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 size-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>Download as CSV</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isExporting !== null}
          className="cursor-pointer rounded-lg py-2 text-xs font-medium"
        >
          {isExporting === "pdf" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <FileText className="mr-2 size-4 text-primary" />
          )}
          <span>Download as PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
