import type { Group } from "./utils";
import { computeNetSettlementData } from "../settlements/NetSettlementTable";

interface Settlement {
  from: { name: string | null };
  to: { name: string | null };
  amount: number;
  settled: boolean;
}

export function formatExpensesForExport(group: Group) {
  const header = ["Date", "Description", "Amount (INR)", "Paid By", "Participants"];
  const rows = group.expenses.map((expense) => {
    const paidBy = expense.paidBy.name || "";

    let participants = "";
    if ("participants" in expense && Array.isArray(expense.participants)) {
      participants = expense.participants
        .map((p) => p.person?.name || "")
        .join(", ");
    } else if ("shares" in expense && Array.isArray(expense.shares)) {
      participants = expense.shares.map((p) => p.person?.name || "").join(", ");
    }

    let formattedDate = new Date().toLocaleDateString("en-IN");
    if ("createdAt" in expense && expense.createdAt) {
      try {
        formattedDate = new Date(
          expense.createdAt as string | number | Date,
        ).toLocaleDateString("en-IN");
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }

    return [
      formattedDate,
      expense.description,
      expense.amount.toFixed(2),
      paidBy,
      participants,
    ];
  });

  return [header, ...rows];
}

export function formatPeopleForExport(group: Group) {
  const header = ["Name", "Role"];
  const rows = [];

  // Add owner
  rows.push([group.createdBy.name || "", "Owner"]);

  if (group.members) {
    group.members.forEach((member) => {
      rows.push([member.name || "", "Member"]);
    });
  }

  return [header, ...rows];
}

export function formatSettlementsForExport(settlements: Settlement[]) {
  const header = ["From", "To", "Amount (INR)", "Status"];

  const rows = settlements.map((settlement) => [
    settlement.from.name || "",
    settlement.to.name || "",
    settlement.amount.toFixed(2),
    settlement.settled ? "Settled" : "Pending",
  ]);

  return [header, ...rows];
}

export function convertToCSV(data: any[][]) {
  return data
    .map((row) =>
      row
        .map((cell) => {
          if (
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
          ) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

export function generateAllGroupData(
  group: Group,
  settlements: Settlement[] = [],
) {
  const expenses = formatExpensesForExport(group);
  const people = formatPeopleForExport(group);
  const settlementsData = formatSettlementsForExport(settlements);

  const allData = [
    ["EquiShare - Group Report: " + group.name],
    ["Export Date: " + new Date().toLocaleDateString("en-IN")],
    [""],
    ["EXPENSES"],
    ...expenses,
    [""],
    ["PEOPLE"],
    ...people,
  ];

  if (settlements.length > 0) {
    allData.push([""], ["SETTLEMENTS"], ...settlementsData);
  }

  return allData;
}

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function generatePDF(
  csvData: string,
  title: string,
  group?: Group,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner styling
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  // EquiShare Branding in Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EquiShare", margin, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Expense & Settlement Summary Report", margin, 18);

  // Export Date on top right
  const exportDate = `Generated on ${new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
  doc.setFontSize(8.5);
  doc.text(exportDate, pageWidth - margin, 15, { align: "right" });

  // Group Title
  let currentY = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, currentY);

  // Group Stats Subtitle
  if (group) {
    currentY += 6;
    const totalExpenses = group.expenses.reduce((sum, e) => sum + e.amount, 0);
    const memberCount = group.people.length;
    const expenseCount = group.expenses.length;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Total Spend: Rs. ${totalExpenses.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}  •  ${memberCount} Participants  •  ${expenseCount} Expenses`,
      margin,
      currentY,
    );
  }

  currentY += 10;

  const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(currentValue);
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    result.push(currentValue);
    return result.map((val) => val.replace(/^"(.*)"$/, "$1"));
  };

  const rows = csvData.split("\n").map((row) => parseCsvRow(row));

  let tableData: string[][] = [];
  let tableHeader: string[] = [];

  const renderSectionTable = (sectionTitle: string) => {
    if (tableData.length === 0 || tableHeader.length === 0) return;

    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    // Section title with accent tag
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(sectionTitle, margin, currentY);
    currentY += 4;

    autoTable(doc, {
      head: [tableHeader],
      body: tableData,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      margin: { left: margin, right: margin },
    });

    const lastY = (doc as any).lastAutoTable?.finalY;
    currentY = (lastY || currentY) + 10;

    tableData = [];
    tableHeader = [];
  };

  let pendingSectionName = "";

  rows.forEach((row) => {
    if (
      row.length === 1 &&
      (row[0] === "EXPENSES" || row[0] === "PEOPLE" || row[0] === "SETTLEMENTS")
    ) {
      if (pendingSectionName && tableData.length > 0) {
        renderSectionTable(pendingSectionName);
      }
      pendingSectionName = row[0];
      tableData = [];
      tableHeader = [];
    } else if (
      row.length === 1 &&
      (row[0] === "" || row[0]?.startsWith("Group: ") || row[0]?.startsWith("EquiShare") || row[0]?.startsWith("Export Date:"))
    ) {
      // Skip meta rows
    } else if (row.length > 0 && row.some((cell) => cell.trim() !== "")) {
      if (tableHeader.length === 0) {
        tableHeader = row;
      } else {
        tableData.push(row);
      }
    }
  });

  if (pendingSectionName && tableData.length > 0) {
    renderSectionTable(pendingSectionName);
  }

  // Net Settlement Breakdown Table
  if (group && group.expenses.length > 0) {
    const { rows: netRows, expenses: netExpenses } = computeNetSettlementData(group);

    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("NET SETTLEMENT BREAKDOWN", margin, currentY);
    currentY += 4;

    const netTableHead = [
      "Person",
      ...netExpenses.map((e) =>
        e.description.length > 14
          ? e.description.slice(0, 14) + "..."
          : e.description,
      ),
      "Total Owes",
      "Paid",
      "Net Balance",
    ];

    const netTableBody = netRows.map((row) => [
      row.personName,
      ...netExpenses.map((e) => {
        const amt = row.expenseShares[e.id] ?? 0;
        return amt > 0 ? `Rs. ${amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "Rs. 0";
      }),
      `Rs. ${row.totalOwes.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      `Rs. ${row.paid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      row.net > 0
        ? `+ Rs. ${row.net.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
        : row.net < 0
          ? `- Rs. ${Math.abs(row.net).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
          : "Settled",
    ]);

    autoTable(doc, {
      head: [netTableHead],
      body: netTableBody,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: "bold" },
        [netTableHead.length - 1]: { fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Add Page Numbers and Footer to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `EquiShare • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" },
    );
  }

  return doc.output("blob");
}
