import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Tag } from "lucide-react";
import { toast } from "sonner";

interface WordCloudItem {
  text: string;
  value: number;
}

interface AnalysisResult {
  wordCloud: WordCloudItem[];
  summary: string;
  themes: string[];
  positives: string[];
  negatives: string[];
  recommendations: string[];
}

interface AIAnalysisProps {
  projectId: string;
}

export const AIAnalysis = ({ projectId }: AIAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-responses', {
        body: { projectId }
      });

      if (error) throw error;

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("AI 분석이 완료되었습니다.");
      } else {
        toast.error(data?.error || "분석에 실패했습니다.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getWordSize = (value: number, maxValue: number) => {
    const minSize = 12;
    const maxSize = 36;
    return Math.max(minSize, (value / maxValue) * maxSize);
  };

  const getWordColor = (index: number) => {
    const colors = [
      "text-primary",
      "text-chart-1",
      "text-chart-2", 
      "text-chart-3",
      "text-chart-4",
      "text-chart-5",
    ];
    return colors[index % colors.length];
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 응답 분석
          </CardTitle>
          <CardDescription>
            텍스트 응답을 AI가 분석하여 주요 키워드, 테마, 개선 제안을 제공합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 분석 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxWordValue = Math.max(...analysis.wordCloud.map(w => w.value), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            분석 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{analysis.summary}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runAnalysis}
            disabled={loading}
            className="mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "다시 분석"}
          </Button>
        </CardContent>
      </Card>

      {/* Word Cloud */}
      {analysis.wordCloud.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              키워드 클라우드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center p-4">
              {analysis.wordCloud.map((word, index) => (
                <span
                  key={word.text}
                  className={`${getWordColor(index)} font-medium hover:opacity-80 transition-opacity cursor-default`}
                  style={{ fontSize: `${getWordSize(word.value, maxWordValue)}px` }}
                  title={`${word.text}: ${word.value}회`}
                >
                  {word.text}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes */}
      {analysis.themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>주요 테마</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.themes.map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positives & Negatives */}
      <div className="grid md:grid-cols-2 gap-4">
        {analysis.positives?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <ThumbsUp className="w-5 h-5" />
                긍정적 의견
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.positives.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-success mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.negatives?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ThumbsDown className="w-5 h-5" />
                개선 필요 사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.negatives.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-chart-4">
              <Lightbulb className="w-5 h-5" />
              AI 추천 개선방안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((item, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-chart-4/20 text-chart-4 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
