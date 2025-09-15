import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, Video, Brain, Shield, History } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Text Analysis",
    description: "Analyze articles, news, and social media posts for misinformation patterns and credibility indicators.",
    gradient: "from-primary to-primary-glow"
  },
  {
    icon: Image,
    title: "Image Detection",
    description: "Upload images and use OCR technology to extract and analyze text for misleading content.",
    gradient: "from-secondary to-secondary-glow"
  },
  {
    icon: Video,
    title: "Video Analysis",
    description: "Extract metadata and analyze video content to identify potential misinformation sources.",
    gradient: "from-accent to-accent-glow"
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Advanced machine learning algorithms provide detailed explanations and credibility scores.",
    gradient: "from-primary via-secondary to-accent"
  },
  {
    icon: Shield,
    title: "Real-time Protection",
    description: "Get instant feedback on content credibility with our lightning-fast analysis engine.",
    gradient: "from-secondary to-accent"
  },
  {
    icon: History,
    title: "Analysis History",
    description: "Track your analysis history with detailed reports and export capabilities.",
    gradient: "from-accent to-primary"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">Powerful Features</span>
            <br />
            <span className="text-foreground">for Truth Detection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive tools to combat misinformation across all media types with cutting-edge AI technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-glow group cursor-pointer">
              <CardHeader>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-gradient-primary transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};