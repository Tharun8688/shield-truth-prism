import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield, Trash2, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready shortly and sent to your email.",
    });
  };

  const handleClearHistory = () => {
    toast({
      title: "History cleared", 
      description: "Your analysis history has been cleared successfully.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient-hero flex items-center space-x-3">
          <Settings className="w-8 h-8" />
          <span>Settings</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="Enter your display name"
              />
            </div>
          </div>
          <Button 
            onClick={handleSaveProfile} 
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your analyses
              </p>
            </div>
            <Switch 
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto Analysis Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when suspicious content is detected
              </p>
            </div>
            <Switch 
              checked={autoAnalysis}
              onCheckedChange={setAutoAnalysis}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Two-Factor Auth
            </Button>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold">Privacy Controls</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Data Retention</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically delete analysis history after 90 days
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={handleExportData}
              className="justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearHistory}
              className="justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Export includes your analysis history, account settings, and usage statistics. 
            Clearing history is permanent and cannot be undone.
          </p>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-sm font-bold text-white">π</span>
              </div>
              <span className="text-lg font-bold text-gradient-primary">Pi Shield</span>
            </div>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs text-muted-foreground/60">Made to Feel. Built to Reel.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;