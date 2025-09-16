import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Image, Video, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AnalysisRecord {
  id: string;
  file_name: string;
  file_type: string;
  analysis_type: string;
  is_deepfake: boolean;
  ai_generated_probability: number;
  confidence_score: number;
  created_at: string;
}

const AnalysisHistory = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (record: AnalysisRecord) => {
    if (record.is_deepfake) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Potential Deepfake</span>
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center space-x-1">
        <CheckCircle className="w-3 h-3" />
        <span>Authentic</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <span>Analysis History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No analyses yet. Upload your first file to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(record.analysis_type)}
                  <div>
                    <p className="font-medium truncate max-w-[200px]">
                      {record.file_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()} • 
                      {Math.round(record.confidence_score * 100)}% confidence
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {Math.round(record.ai_generated_probability * 100)}% AI prob.
                    </div>
                  </div>
                  {getStatusBadge(record)}
                </div>
              </div>
            ))}
            
            {history.length >= 20 && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={fetchHistory}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisHistory;