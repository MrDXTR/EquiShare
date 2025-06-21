"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface SettlementsImageExportProps {
  groupName: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export function SettlementsImageExport({
  groupName,
  contentRef,
}: SettlementsImageExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async () => {
    if (!contentRef.current) {
      toast.error("Could not generate image");
      return;
    }

    setIsExporting(true);
    toast.loading("Generating image...", { id: "export-image" });

    try {
      const style = document.createElement('style');
      style.textContent = `
        .export-mode * {
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif !important;
        }
      `;
      document.head.appendChild(style);

      contentRef.current.classList.add('export-mode');

      await new Promise(resolve => setTimeout(resolve, 200));

      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: '#1f2937',
        pixelRatio: 2,
        skipFonts: true,
        style: {
          fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
        },
        filter: (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            if (element.tagName === 'BUTTON') {
              return false;
            }
            
            if (element.classList?.contains('flex') && 
                element.classList?.contains('items-center') && 
                element.classList?.contains('gap-4') &&
                element.querySelector('[role="switch"]')) {
              return false;
            }
          }
          
          return true;
        },
      });

      contentRef.current.classList.remove('export-mode');
      document.head.removeChild(style);

      const link = document.createElement('a');
      link.download = `${groupName.replace(/\s+/g, '-')}-settlements.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Image downloaded!", { id: "export-image" });
    } catch (error) {
      console.error('Export error:', error);
      
      if (contentRef.current?.classList.contains('export-mode')) {
        contentRef.current.classList.remove('export-mode');
      }
      const existingStyle = document.querySelector('head style:last-child');
      if (existingStyle?.textContent?.includes('export-mode')) {
        document.head.removeChild(existingStyle);
      }
      
      toast.error("Failed to generate image", { id: "export-image" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportImage}
      disabled={isExporting}
      className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-800/50"
    >
      {isExporting ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      Export Image
    </Button>
  );
}