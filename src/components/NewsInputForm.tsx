import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface NewsInputFormProps {
  onSubmit: (headline: string, content: string) => void;
  isLoading: boolean;
}

export const NewsInputForm = ({ onSubmit, isLoading }: NewsInputFormProps) => {
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headline.trim() && content.trim()) {
      onSubmit(headline, content);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="headline" className="text-base font-semibold">
            News Headline
          </Label>
          <Input
            id="headline"
            placeholder="Enter the news headline..."
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            required
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-base font-semibold">
            News Content
          </Label>
          <Textarea
            id="content"
            placeholder="Paste or type the full news article content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="resize-none text-base"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !headline.trim() || !content.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyze News
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
