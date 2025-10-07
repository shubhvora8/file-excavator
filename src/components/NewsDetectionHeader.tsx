import { Newspaper, Shield, TrendingUp } from "lucide-react";

export const NewsDetectionHeader = () => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Newspaper className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Event News Beacon</h1>
              <p className="text-sm text-muted-foreground">AI-Powered News Verification</p>
            </div>
          </div>
          <div className="hidden gap-6 md:flex">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Real-time Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
