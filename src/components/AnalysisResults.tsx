import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Eye, Users, Shield } from 'lucide-react';

interface AnalysisResultsProps {
  results: any;
}

const AnalysisResults = ({ results }: AnalysisResultsProps) => {
  if (!results) return null;

  const { analysis, results: rawResults } = results;
  
  const getDeepfakeStatus = () => {
    if (analysis.isDeepfake) {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        label: "Potential Deepfake",
        variant: "destructive" as const,
        color: "text-destructive"
      };
    }
    return {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "Likely Authentic",
      variant: "default" as const,
      color: "text-green-600"
    };
  };

  const status = getDeepfakeStatus();

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <span>Analysis Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deepfake Detection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={status.color}>{status.icon}</span>
                <span className="font-semibold">{status.label}</span>
              </div>
              <Badge variant={status.variant}>
                {Math.round((1 - analysis.aiGeneratedProbability) * 100)}% Authentic
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI Generation Probability</span>
                <span>{Math.round(analysis.aiGeneratedProbability * 100)}%</span>
              </div>
              <Progress 
                value={analysis.aiGeneratedProbability * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analysis Confidence</span>
                <span>{Math.round(analysis.confidenceScore * 100)}%</span>
              </div>
              <Progress 
                value={analysis.confidenceScore * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Detection Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {analysis.summary.faces !== undefined && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.summary.faces}
                  </div>
                  <div className="text-sm text-muted-foreground">Faces Detected</div>
                </div>
              )}
              
              {analysis.summary.labels !== undefined && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.summary.labels}
                  </div>
                  <div className="text-sm text-muted-foreground">Labels Found</div>
                </div>
              )}
              
              {analysis.summary.safeSearch && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-primary">
                    {analysis.summary.safeSearch}
                  </div>
                  <div className="text-sm text-muted-foreground">Safe Search</div>
                </div>
              )}
            </div>
          )}

          {/* Labels */}
          {rawResults.labelAnnotations && rawResults.labelAnnotations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Detected Objects & Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {rawResults.labelAnnotations.slice(0, 10).map((label: any, index: number) => (
                  <Badge key={index} variant="outline">
                    {label.description} ({Math.round(label.score * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Video-specific results */}
          {rawResults.labels && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Video Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {rawResults.labels.map((label: any, index: number) => (
                  <Badge key={index} variant="outline">
                    {label.description} ({Math.round(label.confidence * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;