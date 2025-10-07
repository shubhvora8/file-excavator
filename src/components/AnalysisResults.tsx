import { NewsAnalysis } from "@/types/news";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateViralScore } from "@/services/newsAnalysisService";
import {
  BarChart,
  CheckCircle,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";

interface AnalysisResultsProps {
  analysis: NewsAnalysis;
}

export const AnalysisResults = ({ analysis }: AnalysisResultsProps) => {
  const viralScore = calculateViralScore(analysis);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Detailed Analysis
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive viral potential breakdown
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Viral Score
            </p>
            <p className="text-3xl font-bold text-primary">{viralScore}/100</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Status
            </p>
            <Badge
              variant={analysis.isViralWorthy ? "default" : "secondary"}
              className="text-sm"
            >
              {analysis.isViralWorthy ? "Viral Worthy" : "Standard"}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Category</p>
              <p className="text-sm text-muted-foreground">{analysis.category}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Analyzed</p>
              <p className="text-sm text-muted-foreground">
                {new Date(analysis.analyzedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium mb-2">Analysis Summary</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.reason}
          </p>
        </div>
      </div>
    </Card>
  );
};
