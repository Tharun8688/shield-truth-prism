import { Shield, Github, Twitter, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-muted/20 to-background border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-lg font-bold text-white">π</span>
              </div>
              <span className="text-xl font-bold text-gradient-primary">Pi Shield</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              AI-powered tool for combating misinformation. Made to Feel. Built to Reel.
            </p>
            <p className="text-sm text-muted-foreground/80">
              Protecting democracy through truth and transparency.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
              <li><a href="#tutorial" className="text-muted-foreground hover:text-primary transition-colors">Tutorial</a></li>
              <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Reference</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © 2024 Pi Shield. All rights reserved. Built with ❤️ for truth.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Github className="w-5 h-5 text-muted-foreground" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Twitter className="w-5 h-5 text-muted-foreground" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};