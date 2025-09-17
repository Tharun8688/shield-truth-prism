import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Tutorial } from "@/components/Tutorial";
import { Footer } from "@/components/Footer";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      navigate('/dashboard');
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

  // Show landing page with auth form for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />

      {/* Auth Section */}
      {!user && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gradient-primary mb-4">
                Get Started with Pi Shield
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Sign in to analyze your media files with advanced AI and detect deepfakes and AI-generated content
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <AuthForm />
            </div>
          </div>
        </section>
      )}

      {/* Marketing sections */}
      <div className="space-y-24">
        <Features />
        <Tutorial />
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;