import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, Shield, Target, Lightbulb, AlertTriangle } from "lucide-react";

const tutorialCards = [
  {
    emoji: "🤔",
    icon: AlertTriangle,
    title: "What is Misinformation?",
    description: "Learn to identify false or misleading information spread to deceive or mislead people.",
    tips: [
      "Check multiple reliable sources",
      "Look for author credentials", 
      "Verify publication dates",
      "Question emotional content"
    ],
    gradient: "from-red-500/20 to-orange-500/20"
  },
  {
    emoji: "🛡️", 
    icon: Shield,
    title: "How Pi Shield Helps",
    description: "Our AI analyzes content using advanced machine learning to detect deepfakes and manipulation.",
    tips: [
      "Computer vision analysis",
      "Natural language processing",
      "Pattern recognition",
      "Confidence scoring"
    ],
    gradient: "from-primary/20 to-secondary/20"
  },
  {
    emoji: "⚙️",
    icon: Brain, 
    title: "How It Works",
    description: "Upload your content and get instant analysis powered by state-of-the-art AI technology.",
    tips: [
      "Upload images, videos, or text",
      "AI processes the content",
      "Get detailed analysis results", 
      "Review confidence scores"
    ],
    gradient: "from-secondary/20 to-accent/20"
  },
  {
    emoji: "🎯",
    icon: Target,
    title: "Learn the Tricks", 
    description: "Understand common manipulation techniques used to create convincing fake content.",
    tips: [
      "Face swapping technology",
      "Voice synthesis methods",
      "Text generation patterns",
      "Image manipulation signs"
    ],
    gradient: "from-accent/20 to-primary/20"
  },
  {
    emoji: "💡",
    icon: Lightbulb,
    title: "Why It Matters",
    description: "Misinformation can influence elections, health decisions, and social opinions.",
    tips: [
      "Protects democratic processes",
      "Prevents health misinformation", 
      "Reduces social manipulation",
      "Builds media literacy"
    ],
    gradient: "from-green-500/20 to-blue-500/20"
  }
];

const TutorialPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient-hero flex items-center justify-center space-x-3">
          <BookOpen className="w-10 h-10" />
          <span>Tutorial & Learning</span>
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          Master the art of detecting misinformation with our comprehensive guide
        </p>
        <Badge className="mt-4 bg-primary/20 text-primary border-primary/50">
          Interactive Learning Experience
        </Badge>
      </div>

      {/* Tutorial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorialCards.map((card, index) => (
          <Card key={index} className={`card-glow hover:scale-105 transition-all duration-300 bg-gradient-to-br ${card.gradient} border-white/10`}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <span className="text-3xl">{card.emoji}</span>
              </div>
              <CardTitle className="flex items-center justify-center space-x-2">
                <card.icon className="w-5 h-5 text-primary" />
                <span>{card.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                {card.description}
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-primary">Key Points:</h4>
                <ul className="space-y-1">
                  {card.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="text-sm text-muted-foreground flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tips Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-gradient-primary">Quick Detection Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🔍 Visual Inspection</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Check for unnatural facial movements</li>
                <li>• Look for inconsistent lighting</li>
                <li>• Notice blurry or pixelated areas</li>
                <li>• Watch for mismatched skin tones</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">📝 Text Analysis</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Check for repetitive patterns</li>
                <li>• Look for unusual word choices</li>
                <li>• Verify facts with multiple sources</li>
                <li>• Be skeptical of emotional language</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watermark */}
      <div className="text-center text-xs text-muted-foreground/60 pt-8">
        @seastudios.fx
      </div>
    </div>
  );
};

export default TutorialPage;