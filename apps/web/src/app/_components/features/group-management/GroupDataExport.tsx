"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, File, Loader2 } from "lucide-react";
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
        const pdfBlob = await generatePDF(csvData, group.name);
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
          className="h-8 w-8 rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Group Data</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isExporting !== null}
          className="cursor-pointer"
        >
          {isExporting === "csv" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 h-4 w-4" />
          )}
          <span>Download CSV</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isExporting !== null}
          className="cursor-pointer"
        >
          {isExporting === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <File className="mr-2 h-4 w-4" />
          )}
          <span>Download PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
