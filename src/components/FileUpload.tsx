import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, Video, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
  onFileAnalyzed: (result: any) => void;
}

const FileUpload = ({ onFileAnalyzed }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['image/', 'video/', 'text/'];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      toast({
        title: "Invalid file type",
        description: "Please select an image, video, or text file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const uploadAndAnalyze = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Determine analysis type and call appropriate function
      let analysisFunction = '';
      if (selectedFile.type.startsWith('image/')) {
        analysisFunction = 'analyze-image';
      } else if (selectedFile.type.startsWith('video/')) {
        analysisFunction = 'analyze-video';
      } else {
        analysisFunction = 'analyze-text';
      }

      // Call analysis function
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke(analysisFunction, {
          body: {
            fileUrl: publicUrl,
            fileName: selectedFile.name,
            userId: user.id
          }
        });

      if (analysisError) throw analysisError;

      onFileAnalyzed(analysisData);
      setSelectedFile(null);

      toast({
        title: "Analysis complete!",
        description: "Your file has been analyzed successfully.",
      });

    } catch (error: any) {
      console.error('Upload/analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (file.type.startsWith('video/')) return <Video className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload your media</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop or click to select images, videos, or text files
          </p>
          <p className="text-sm text-muted-foreground">
            Supported formats: JPG, PNG, MP4, MOV, TXT (Max 50MB)
          </p>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,text/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {selectedFile && (
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(selectedFile)}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={uploadAndAnalyze}
                  disabled={isUploading}
                  className="btn-primary"
                >
                  {isUploading ? 'Analyzing...' : 'Analyze'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;