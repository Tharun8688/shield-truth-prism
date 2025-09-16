import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Tutorial } from "@/components/Tutorial";
import { Footer } from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import AnalysisResults from "@/components/AnalysisResults";
import AnalysisHistory from "@/components/AnalysisHistory";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { user, loading } = useAuth();
  const [analysisResults, setAnalysisResults] = useState(null);
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-glow mx-auto mb-4">
            <span className="text-lg font-bold text-white">π</span>
          </div>
          <p className="text-muted-foreground">Loading Pi Shield...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">
              Welcome back to Pi Shield
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze your media files with advanced AI to detect deepfakes and AI-generated content
            </p>
          </div>

          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="analyze">Analyze Media</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze" className="space-y-8">
              <FileUpload onFileAnalyzed={setAnalysisResults} />
              {analysisResults && <AnalysisResults results={analysisResults} />}
            </TabsContent>
            
            <TabsContent value="history">
              <AnalysisHistory />
            </TabsContent>
          </Tabs>
        </div>

        {/* Marketing sections for non-authenticated or when scrolled down */}
        <div className="mt-24 space-y-24">
          <Features />
          <Tutorial />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
