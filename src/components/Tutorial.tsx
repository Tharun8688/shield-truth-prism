import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Search, BookOpen, Eye, Heart } from "lucide-react";

const tutorialCards = [
  {
    emoji: "🔍",
    icon: Search,
    title: "What is Misinformation?",
    description: "Learn to identify false or misleading information that spreads rapidly across digital platforms.",
    tips: ["Check multiple sources", "Verify publication dates", "Look for author credentials"],
    gradient: "from-primary to-primary-glow"
  },
  {
    emoji: "🛡️",
    icon: AlertTriangle,
    title: "How Pi Shield Helps",
    description: "Our AI analyzes content patterns, cross-references facts, and provides credibility scores.",
    tips: ["Instant analysis", "Detailed explanations", "Source recommendations"],
    gradient: "from-secondary to-secondary-glow"
  },
  {
    emoji: "⚙️",
    icon: BookOpen,
    title: "How It Works",
    description: "Upload text, images, or videos. Our AI processes content and delivers comprehensive reports.",
    tips: ["Multiple input formats", "Fast processing", "Detailed reports"],
    gradient: "from-accent to-accent-glow"
  },
  {
    emoji: "🎯",
    icon: Eye,
    title: "Learn the Tricks",
    description: "Master the art of spotting deepfakes, manipulated images, and misleading headlines.",
    tips: ["Visual inconsistencies", "Emotional manipulation", "Unreliable sources"],
    gradient: "from-primary via-secondary to-accent"
  },
  {
    emoji: "💡",
    icon: Heart,
    title: "Why It Matters",
    description: "Protecting democracy, public health, and social cohesion through informed decision-making.",
    tips: ["Combat fake news", "Protect communities", "Promote truth"],
    gradient: "from-secondary to-accent"
  }
];

export const Tutorial = () => {
  return (
    <section id="tutorial" className="py-20 px-6 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">Master the Art of</span>
            <br />
            <span className="text-foreground">Truth Detection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn how to identify misinformation and protect yourself and others from false narratives.
          </p>
        </div>

        {/* Tutorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutorialCards.map((card, index) => (
            <Card key={index} className="card-premium group hover:scale-105 transition-all duration-500 relative overflow-hidden">
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <CardHeader className="relative">
                {/* Emoji Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{card.emoji}</div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-gradient-primary transition-colors duration-300">
                  {card.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {card.description}
                </p>
                
                {/* Tips List */}
                <div className="space-y-2">
                  {card.tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                      <span className="text-sm text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Watermark */}
        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground/60">
            Educational content by <span className="text-gradient-primary font-medium">@seastudios.fx</span>
          </p>
        </div>
      </div>
    </section>
  );
};