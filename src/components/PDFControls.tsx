import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface PDFControlsProps {
  files: File[];
  quality: number[];
  pdfName: string;
  onQualityChange: (value: number[]) => void;
  onPdfNameChange: (value: string) => void;
  onGeneratePDF: () => void;
}

export const PDFControls = ({
  files,
  quality,
  pdfName,
  onQualityChange,
  onPdfNameChange,
  onGeneratePDF
}: PDFControlsProps) => {
  const [estimatedSize, setEstimatedSize] = useState<number>(0);

  useEffect(() => {
    // Calculate estimated PDF size based on input images and quality
    const calculateEstimatedSize = async () => {
      let totalSize = 0;
      for (const file of files) {
        // Base size of the image
        const baseSize = file.size;
        // Approximate size after quality compression
        const compressedSize = baseSize * quality[0];
        totalSize += compressedSize;
      }
      // Convert to MB and add some overhead for PDF structure
      const estimatedMB = (totalSize / (1024 * 1024)) * 1.1; // 10% overhead
      setEstimatedSize(Math.round(estimatedMB * 100) / 100);
    };

    calculateEstimatedSize();
  }, [files, quality]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">PDF Quality</label>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Smaller file</span>
          <Slider
            value={quality}
            onValueChange={onQualityChange}
            min={0.1}
            max={1}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm text-gray-500">Better quality</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <p>{Math.round(quality[0] * 100)}% quality</p>
          <p>Estimated size: {estimatedSize} MB</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            value={pdfName}
            onChange={(e) => onPdfNameChange(e.target.value)}
            placeholder="Enter PDF name"
            className="w-full"
          />
        </div>
        <Button onClick={onGeneratePDF} className="w-full sm:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
      </div>
    </div>
  );
};