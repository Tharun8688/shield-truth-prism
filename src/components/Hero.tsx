import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Pi Shield - AI-Powered Misinformation Detection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Logo and Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3 glass rounded-full px-6 py-3">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold text-gradient-primary">π Shield</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-gradient-hero">AI-Powered</span>
          <br />
          <span className="text-foreground">Truth Detection</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Made to Feel. Built to Reel.
          <br />
          <span className="text-gradient-primary">Combat misinformation with cutting-edge AI technology</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button className="btn-hero text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Start Analyzing
          </Button>
          <Button variant="outline" className="glass border-white/20 text-foreground hover:bg-white/10 text-lg px-8 py-4 rounded-2xl">
            Watch Demo
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>10,000+ Users Trust Pi Shield</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-secondary" />
            <span>99.9% Accuracy Rate</span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce">
        <div className="w-3 h-3 bg-primary rounded-full opacity-60" />
      </div>
      <div className="absolute top-40 right-20 animate-bounce delay-1000">
        <div className="w-2 h-2 bg-secondary rounded-full opacity-40" />
      </div>
      <div className="absolute bottom-40 left-20 animate-bounce delay-500">
        <div className="w-4 h-4 bg-accent rounded-full opacity-50" />
      </div>
    </section>
  );
};