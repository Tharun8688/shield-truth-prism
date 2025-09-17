import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  TrendingUp, 
  Users, 
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Image,
  Video,
  FileText
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import AnalysisResults from "@/components/AnalysisResults";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const [analysisResults, setAnalysisResults] = useState(null);

  // Mock stats - in real app, fetch from API
  const stats = [
    {
      title: "Files Analyzed",
      value: "1,247",
      change: "+12.5%",
      icon: FileCheck,
      color: "text-primary"
    },
    {
      title: "Deepfakes Detected",
      value: "89",
      change: "+7.2%",
      icon: AlertTriangle,
      color: "text-destructive"
    },
    {
      title: "Authentic Content",
      value: "1,158",
      change: "+15.3%",
      icon: CheckCircle,      
      color: "text-green-500"
    },
    {
      title: "Accuracy Rate",
      value: "94.8%",
      change: "+2.1%",
      icon: TrendingUp,
      color: "text-accent"
    }
  ];

  const recentAnalyses = [
    {
      id: 1,
      name: "news_article.jpg",
      type: "image",
      result: "authentic",
      confidence: 96,
      time: "2 hours ago"
    },
    {
      id: 2,
      name: "political_video.mp4", 
      type: "video",
      result: "deepfake",
      confidence: 88,
      time: "5 hours ago"
    },
    {
      id: 3,
      name: "social_post.txt",
      type: "text",
      result: "authentic",
      confidence: 92,
      time: "1 day ago"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getResultBadge = (result: string) => {
    if (result === 'deepfake') {
      return <Badge variant="destructive">Deepfake</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Authentic</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-hero">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered shield against misinformation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-primary animate-glow" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-500">{stat.change}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-gradient-primary">Quick Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onFileAnalyzed={setAnalysisResults} />
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResults && (
            <AnalysisResults results={analysisResults} />
          )}
        </div>

        {/* Recent Analyses */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(analysis.type)}
                    <div>
                      <p className="font-medium">{analysis.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {analysis.confidence}% confidence • {analysis.time}
                      </p>
                    </div>
                  </div>
                  {getResultBadge(analysis.result)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;