import { useState, useRef, TouchEvent } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, GripVertical } from "lucide-react";
import { jsPDF } from "jspdf";
import { PDFControls } from "@/components/PDFControls";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pdfName, setPdfName] = useState("snapToPDF");
  const [isDragging, setIsDragging] = useState(false);
  const [quality, setQuality] = useState([0.75]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchedElement = useRef<HTMLDivElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (droppedFiles.length === 0) {
      toast.error("Please drop only image files!");
      return;
    }
    
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null) return;
    
    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    
    setFiles(newFiles);
    setDraggedIndex(index);
  };

  // New Touch Event Handlers
  const handleTouchStart = (e: TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchedElement.current = e.currentTarget as HTMLDivElement;
    setDraggedIndex(index);
    e.currentTarget.classList.add('opacity-50', 'z-50', 'shadow-lg', 'scale-105');
    
    // Optional: Add vibration feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTouchMove = (e: TouchEvent, index: number) => {
    if (!touchedElement.current || draggedIndex === null) return;

    const touch = e.touches[0];
    const element = touchedElement.current;
    
    element.style.position = 'fixed';
    element.style.left = `${touch.clientX - element.offsetWidth / 2}px`;
    element.style.top = `${touch.clientY - element.offsetHeight / 2}px`;

    const elementsBelow = document.elementsFromPoint(touch.clientX, touch.clientY);
    const droppableBelow = elementsBelow.find(
      (el) => el.hasAttribute('data-image-index')
    ) as HTMLElement;

    if (droppableBelow && droppableBelow !== element) {
      const belowIndex = parseInt(droppableBelow.getAttribute('data-image-index') || '0');
      if (belowIndex !== draggedIndex) {
        const newFiles = [...files];
        const draggedFile = newFiles[draggedIndex];
        newFiles.splice(draggedIndex, 1);
        newFiles.splice(belowIndex, 0, draggedFile);
        setFiles(newFiles);
        setDraggedIndex(belowIndex);
      }
    }

    e.preventDefault();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchedElement.current) return;
    
    const element = touchedElement.current;
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.classList.remove('opacity-50', 'z-50', 'shadow-lg', 'scale-105');
    
    setDraggedIndex(null);
    touchStartY.current = null;
    touchedElement.current = null;
  };

  const generatePDF = async () => {
    if (files.length === 0) {
      toast.error("Please add at least one image!");
      return;
    }

    const pdf = new jsPDF();
    let currentPage = 0;

    toast.promise(
      (async () => {
        for (const file of files) {
          if (currentPage > 0) {
            pdf.addPage();
          }

          const img = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          
          const imgData = canvas.toDataURL('image/jpeg', quality[0]);
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
          const width = imgProps.width * ratio;
          const height = imgProps.height * ratio;
          const x = (pdfWidth - width) / 2;
          const y = (pdfHeight - height) / 2;
          
          pdf.addImage(imgData, 'JPEG', x, y, width, height);
          currentPage++;
        }

        pdf.save(`${pdfName}.pdf`);
      })(),
      {
        loading: 'Generating PDF...',
        success: 'PDF generated successfully!',
        error: 'Failed to generate PDF',
      }
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">SnapToPDF</h1>
          <p className="text-lg text-gray-600">Convert your photos to PDF in seconds</p>
        </div>

        <Card className="p-6 space-y-6">
          <div
            className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-xl font-medium">Drag and drop your photos here</p>
                <p className="text-sm text-gray-500">or</p>
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Browse files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    data-image-index={index}
                    className="relative group cursor-move transition-all duration-200 hover:scale-105 touch-none select-none active:scale-105"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragEnter={() => handleDragEnter(index)}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={(e) => handleTouchMove(e, index)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity rounded-lg">
                      <GripVertical className="w-6 h-6 text-white" />
                    </div>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg pointer-events-none"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-700" />
                    </button>
                    {/* Mobile drag indicator */}
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-active:opacity-100 md:hidden rounded-b-lg">
                      <div className="flex justify-center items-center h-full">
                        <div className="w-10 h-1 bg-white/70 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <PDFControls
                files={files}
                quality={quality}
                pdfName={pdfName}
                onQualityChange={setQuality}
                onPdfNameChange={setPdfName}
                onGeneratePDF={generatePDF}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;