import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploadProps {
  onUpload: (files: Array<{ file: File; caption?: string }>) => void;
  isLoading?: boolean;
  maxFiles?: number;
}

export default function ImageUpload({
  onUpload,
  isLoading = false,
  maxFiles = 10,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<Array<{ file: File; preview: string; caption: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    addFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (newFiles: File[]) => {
    if (previews.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const newPreviews = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));

    setPreviews([...previews, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setPreviews((prev) => {
      const updated = [...prev];
      updated[index].caption = caption;
      return updated;
    });
  };

  const handleSubmit = () => {
    if (previews.length === 0) return;

    const filesToUpload = previews.map((p) => ({
      file: p.file,
      caption: p.caption || undefined,
    }));

    onUpload(filesToUpload);
    setPreviews([]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-colors p-8 text-center cursor-pointer ${
          dragActive
            ? "border-accent bg-accent/5"
            : "border-border bg-card/50 hover:border-accent/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-lg bg-accent/10">
            <Upload className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Drag and drop images here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to select files
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to 10MB each
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-lg"
          type="button"
        />
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {previews.length} image{previews.length !== 1 ? "s" : ""} selected
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((item, index) => (
              <Card key={index} className="overflow-hidden relative group">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img
                    src={item.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removePreview(index)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Caption Input */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={item.caption}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    className="w-full text-xs px-2 py-1 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || previews.length === 0}
              className="flex-1 bg-accent hover:bg-accent/90 gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              {isLoading ? "Uploading..." : `Upload ${previews.length} Image${previews.length !== 1 ? "s" : ""}`}
            </Button>
            <Button
              onClick={() => {
                previews.forEach((p) => URL.revokeObjectURL(p.preview));
                setPreviews([]);
              }}
              variant="outline"
              disabled={isLoading}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
