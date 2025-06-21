import type { Group } from "./utils";

interface Person {
  name: string | null;
  id: string;
}

interface Settlement {
  from: { name: string | null };
  to: { name: string | null };
  amount: number;
  settled: boolean;
}

export function formatExpensesForExport(group: Group) {
  const header = ["Date", "Description", "Amount", "Paid By", "Participants"];
  const rows = group.expenses.map((expense) => {
    const paidBy = expense.paidBy.name || "";

    let participants = "";
    if ('participants' in expense && Array.isArray(expense.participants)) {
      participants = expense.participants
        .map((p) => (p.person?.name || "")).join(", ");
    } else if ('shares' in expense && Array.isArray(expense.shares)) {
      participants = expense.shares
        .map((p) => (p.person?.name || "")).join(", ");
    }

    let formattedDate = new Date().toLocaleDateString();
    if ('createdAt' in expense && expense.createdAt) {
      try {
        formattedDate = new Date(expense.createdAt as string | number | Date).toLocaleDateString();
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }
    
    return [
      formattedDate,
      expense.description,
      expense.amount.toFixed(2),
      paidBy,
      participants
    ];
  });
  
  return [header, ...rows];
}

export function formatPeopleForExport(group: Group) {
  const header = ["Name", "Role"];
  const rows = [];
  
  // Add owner
  rows.push([
    group.createdBy.name || "",
    "Owner"
  ]);
  
  if (group.members) {
    group.members.forEach((member) => {
      rows.push([
        member.name || "",
        "Member"
      ]);
    });
  }
  
  return [header, ...rows];
}

export function formatSettlementsForExport(settlements: Settlement[]) {
  const header = ["From", "To", "Amount", "Status"];
  
  const rows = settlements.map((settlement) => [
    settlement.from.name || "",
    settlement.to.name || "",
    settlement.amount.toFixed(2),
    settlement.settled ? "Settled" : "Pending"
  ]);
  
  return [header, ...rows];
}

export function convertToCSV(data: any[][]) {
  return data
    .map((row) =>
      row
        .map((cell) => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');
}

export function generateAllGroupData(group: Group, settlements: Settlement[] = []) {
  const expenses = formatExpensesForExport(group);
  const people = formatPeopleForExport(group);
  const settlementsData = formatSettlementsForExport(settlements);
  
  const allData = [
    ["Group: " + group.name],
    [""],
    ["EXPENSES"],
    ...expenses,
    [""],
    ["PEOPLE"],
    ...people
  ];
  
  if (settlements.length > 0) {
    allData.push(
      [""],
      ["SETTLEMENTS"],
      ...settlementsData
    );
  }
  
  return allData;
}

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function generatePDF(csvData: string, title: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    result.push(currentValue);
    return result.map(val => val.replace(/^"(.*)"$/, '$1'));
  };
  
  const rows = csvData.split('\n').map(row => parseCsvRow(row));
  
  let currentY = 30;
  let currentSection = "";
  let tableData: string[][] = [];
  let tableHeader: string[] = [];
  
  rows.forEach(row => {
    if (row.length === 1 && (row[0] === "EXPENSES" || row[0] === "PEOPLE" || row[0] === "SETTLEMENTS")) {
      if (tableData.length > 0) {
        autoTable(doc, {
          head: [tableHeader],
          body: tableData,
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [100, 100, 255] }
        });
        
        const lastY = (doc as any).lastAutoTable?.finalY;
        currentY = lastY ? lastY + 10 : currentY + 10;
      }
      
      doc.setFontSize(14);
      doc.text(row[0], 14, currentY);
      currentY += 8;
      currentSection = row[0];
      tableData = [];
      tableHeader = [];
    }
    else if (row.length === 1 && row[0] === "") {
    }
    else if (row.length === 1 && row[0]?.startsWith("Group: ")) {
    }
    else if (row.length > 0) {
      if (tableHeader.length === 0) {
        tableHeader = row;
      } else {
        tableData.push(row);
      }
    }
  });
  
  if (tableData.length > 0) {
    autoTable(doc, {
      head: [tableHeader],
      body: tableData,
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 255] }
    });
  }
  
  return doc.output('blob');
}