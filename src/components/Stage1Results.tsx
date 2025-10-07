import { Stage1Response } from "@/types/stage1";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Tag,
  Heart,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Stage1ResultsProps {
  result: Stage1Response;
}

export const Stage1Results = ({ result }: Stage1ResultsProps) => {
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered viral potential assessment
            </p>
          </div>
          {result.isViralWorthy ? (
            <Badge className="bg-green-500 text-white hover:bg-green-600">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Viral Worthy
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="mr-1 h-4 w-4" />
              Low Viral Potential
            </Badge>
          )}
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confidence Score</span>
            <span className="text-2xl font-bold text-primary">
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className="h-3" />
        </div>

        {/* Reason */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm leading-relaxed">
            {result.reason}
          </AlertDescription>
        </Alert>

        {/* Metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          {result.category && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-semibold">{result.category}</p>
              </div>
            </div>
          )}

          {result.sentiment && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              <Heart className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Sentiment</p>
                <p className="font-semibold">{result.sentiment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Viral Potential Indicator */}
        <div className="rounded-lg border-2 border-dashed p-4 text-center">
          <TrendingUp
            className={`mx-auto mb-2 h-8 w-8 ${
              result.isViralWorthy ? "text-green-500" : "text-muted-foreground"
            }`}
          />
          <p className="text-sm font-medium">
            {result.isViralWorthy
              ? "High probability of going viral"
              : "Consider optimizing for better engagement"}
          </p>
        </div>
      </div>
    </Card>
  );
};
