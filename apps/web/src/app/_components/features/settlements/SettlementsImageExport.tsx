"use client";

import { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface SettlementsImageExportProps {
  groupName: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(parts[1] || "");
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isSafariBrowser(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
    isIOSDevice()
  );
}

export function SettlementsImageExport({
  groupName,
  contentRef,
}: SettlementsImageExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleExportImage = async () => {
    if (!contentRef.current) {
      toast.error("Could not find settlement content to export");
      return;
    }

    setIsExporting(true);
    toast.loading("Generating image...", { id: "export-image" });

    let styleEl: HTMLStyleElement | null = null;

    try {
      styleEl = document.createElement("style");
      styleEl.id = "settlements-export-mode-style";
      styleEl.textContent = `
        .export-mode * {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
        .export-mode [data-export-hide="true"] {
          display: none !important;
        }
        .export-mode .settlement-export-group-name {
          display: inline !important;
        }
        .export-mode {
          max-height: none !important;
          overflow: visible !important;
        }
        .export-mode, .export-mode * {
          box-shadow: none !important;
        }
        .export-mode .overflow-y-auto,
        .export-mode [data-scroll-fade="true"] {
          max-height: none !important;
          overflow: visible !important;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        .export-mode [data-scroll-overlay="true"] {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
      contentRef.current.classList.add("export-mode");

      // Small pause to allow reflow and font application
      await new Promise((resolve) => setTimeout(resolve, 150));

      const isDark = document.documentElement.classList.contains("dark");
      const exportOptions = {
        backgroundColor: isDark ? "#090d16" : "#ffffff",
        pixelRatio: 2,
        skipFonts: true,
        fontEmbedCSS: "",
        cacheBust: true,
        style: {
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        },
        filter: (node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (
              el.getAttribute?.("data-export-hide") === "true" ||
              el.dataset?.exportHide === "true" ||
              el.getAttribute?.("data-scroll-overlay") === "true"
            ) {
              return false;
            }
            if (el.tagName === "BUTTON") {
              return false;
            }
          }
          return true;
        },
      };

      // Safari/WebKit on iOS/macOS often renders blank SVG on first foreignObject draw
      if (isSafariBrowser()) {
        try {
          await toPng(contentRef.current, exportOptions);
        } catch {
          // Ignore warm-up error
        }
      }

      const dataUrl = await toPng(contentRef.current, exportOptions);
      const blob = dataUrlToBlob(dataUrl);
      const cleanGroupName = (groupName || "group").replace(/[^a-zA-Z0-9_-]/g, "-");
      const filename = `${cleanGroupName}-settlements.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const isIOS = isIOSDevice();
      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        typeof navigator.share === "function" &&
        navigator.canShare({ files: [file] });

      if (isIOS) {
        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: `${groupName} Settlements`,
              text: `Settlement summary for ${groupName}`,
            });
            toast.success("Image exported successfully!", { id: "export-image" });
            return;
          } catch (shareErr: any) {
            if (shareErr?.name === "AbortError") {
              // User dismissed the iOS Share Sheet
              toast.dismiss("export-image");
              return;
            }
            console.warn("navigator.share failed on iOS, opening fallback preview:", shareErr);
          }
        }

        // Fallback on iOS if share failed or file sharing is not supported
        setPreviewDataUrl(dataUrl);
        setPreviewFile(file);
        setShowPreview(true);
        toast.info("Image ready! Touch and hold to save to Photos.", {
          id: "export-image",
          duration: 4000,
        });
        return;
      }

      // Desktop and Android: programmatic download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

      toast.success("Image downloaded!", { id: "export-image" });
    } catch (error) {
      console.error("Settlement export error:", error);
      toast.error("Failed to generate image", { id: "export-image" });
    } finally {
      if (contentRef.current?.classList.contains("export-mode")) {
        contentRef.current.classList.remove("export-mode");
      }
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
      setIsExporting(false);
    }
  };

  const handleShareFromModal = async () => {
    if (!previewFile || typeof navigator === "undefined" || !navigator.share) return;
    try {
      if (navigator.canShare?.({ files: [previewFile] })) {
        await navigator.share({
          files: [previewFile],
          title: `${groupName} Settlements`,
          text: `Settlement summary for ${groupName}`,
        });
      } else {
        await navigator.share({
          title: `${groupName} Settlements`,
          url: window.location.href,
        });
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      toast.error("Sharing failed or not supported");
    }
  };

  const handleDownloadFromModal = () => {
    if (!previewDataUrl) return;
    const blob = dataUrlToBlob(previewDataUrl);
    const cleanGroupName = (groupName || "group").replace(/[^a-zA-Z0-9_-]/g, "-");
    const filename = `${cleanGroupName}-settlements.png`;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = blobUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportImage}
        disabled={isExporting}
        className="h-9 min-w-[118px] px-3.5 rounded-lg text-xs font-medium border-border/80 bg-background/80 hover:bg-accent active:scale-[0.96] transition-transform duration-150 gap-1.5 justify-center"
        aria-label="Export settlement image"
      >
        {isExporting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        <span>Export Image</span>
      </Button>

      {/* Fallback modal for iOS touch-and-hold saving or share dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
              Save Settlement Image
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Touch and hold the image below and select{" "}
              <strong className="text-foreground">Save to Photos</strong>, or tap Share Sheet.
            </DialogDescription>
          </DialogHeader>

          {previewDataUrl && (
            <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border/70 bg-muted/30 p-2 shadow-2xs flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewDataUrl}
                alt={`${groupName} settlement summary`}
                className="h-auto w-full rounded-lg shadow-xs select-auto"
              />
            </div>
          )}

          <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="h-9 border-border/80 active:scale-[0.96] transition-transform duration-150"
            >
              Close
            </Button>

            {previewFile && typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <Button
                size="sm"
                onClick={handleShareFromModal}
                className="h-9 gap-1.5 font-medium active:scale-[0.96] transition-transform duration-150"
              >
                <Share2 className="size-3.5" />
                <span>Share Sheet</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadFromModal}
              className="h-9 gap-1.5 font-medium active:scale-[0.96] transition-transform duration-150"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
