import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, History } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import AnalysisResults from "@/components/AnalysisResults";
import AnalysisHistory from "@/components/AnalysisHistory";

const AnalyzePage = () => {
  const [analysisResults, setAnalysisResults] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient-hero flex items-center space-x-3">
          <Search className="w-8 h-8" />
          <span>Analyze Content</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload images, videos, or text to detect deepfakes and AI-generated content
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="analyze" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>New Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyze" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-gradient-primary">Upload Media</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFileAnalyzed={setAnalysisResults} />
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Choose Your File</p>
                      <p className="text-sm text-muted-foreground">
                        Upload images (JPG, PNG), videos (MP4, MOV), or text files
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-secondary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">AI Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Our AI examines the content for signs of manipulation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-accent">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Get Results</p>
                      <p className="text-sm text-muted-foreground">
                        Receive detailed analysis with confidence scores
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          {analysisResults && (
            <div className="mt-6">
              <AnalysisResults results={analysisResults} />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <AnalysisHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyzePage;