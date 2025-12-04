import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";

interface ReportSection {
  id: string;
  title: string;
  content: string;
}

interface ReportData {
  title: string;
  sections: ReportSection[];
  metadata?: {
    schoolName: string;
    year: number;
    projectTitle: string;
    generatedAt: string;
    stats: {
      totalResponses: number;
      byType: Record<string, number>;
      ratingAvg: Record<string, { avg: number; count: number }>;
    };
  };
}

interface ReportGeneratorProps {
  projectId: string;
}

export const ReportGenerator = ({ projectId }: ReportGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { projectId }
      });

      if (error) throw error;

      if (data?.success && data?.report) {
        setReport(data.report);
        toast.success("보고서가 생성되었습니다.");
      } else {
        toast.error(data?.error || "보고서 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("보고서 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copySection = async (section: ReportSection) => {
    const text = `${section.title}\n\n${section.content}`;
    await navigator.clipboard.writeText(text);
    setCopiedSection(section.id);
    toast.success(`"${section.title}" 섹션이 복사되었습니다.`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAllReport = async () => {
    if (!report) return;
    
    const fullText = [
      report.title,
      "",
      `생성일: ${new Date(report.metadata?.generatedAt || "").toLocaleDateString("ko-KR")}`,
      `학교: ${report.metadata?.schoolName}`,
      `평가년도: ${report.metadata?.year}년`,
      "",
      "=" .repeat(50),
      "",
      ...report.sections.map(s => `${s.title}\n\n${s.content}\n`)
    ].join("\n");

    await navigator.clipboard.writeText(fullText);
    toast.success("전체 보고서가 복사되었습니다.");
  };

  const downloadAsText = () => {
    if (!report) return;

    const fullText = [
      report.title,
      "",
      `생성일: ${new Date(report.metadata?.generatedAt || "").toLocaleDateString("ko-KR")}`,
      `학교: ${report.metadata?.schoolName}`,
      `평가년도: ${report.metadata?.year}년`,
      "",
      "=".repeat(50),
      "",
      ...report.sections.map(s => `${s.title}\n\n${s.content}\n\n`)
    ].join("\n");

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.metadata?.schoolName || "학교"}_${report.metadata?.year || ""}년_평가보고서.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("보고서가 다운로드되었습니다.");
  };

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            보고서 생성
          </CardTitle>
          <CardDescription>
            설문 결과를 바탕으로 학교 평가 보고서를 자동 생성합니다.
            각 섹션을 개별적으로 복사하여 문서에 붙여넣을 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateReport} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                보고서 생성 중...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                보고서 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>
                {report.metadata?.schoolName} · {report.metadata?.year}년 · 
                총 {report.metadata?.stats?.totalResponses}건 응답
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAllReport}>
                <Copy className="w-4 h-4 mr-2" />
                전체 복사
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsText}>
                <Download className="w-4 h-4 mr-2" />
                TXT 다운로드
              </Button>
              <Button variant="outline" size="sm" onClick={generateReport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "다시 생성"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sections */}
      {report.sections.map((section) => (
        <Card key={section.id} className="relative group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copySection(section)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedSection === section.id ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-success" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    복사
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground">
              {section.content.split('\n').map((paragraph, idx) => (
                paragraph.trim() && (
                  <p key={idx} className="mb-3 text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Statistics Summary */}
      {report.metadata?.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">응답 통계 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">대상별 응답</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {Object.entries(report.metadata.stats.byType).map(([type, count]) => (
                    <li key={type} className="flex justify-between">
                      <span>{type === 'teacher' ? '교원' : type === 'staff' ? '직원' : type === 'parent' ? '학부모' : '학생'}</span>
                      <span className="font-medium">{count}건</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">영역별 평균</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {Object.entries(report.metadata.stats.ratingAvg).map(([area, data]) => (
                    <li key={area} className="flex justify-between">
                      <span>{area}</span>
                      <span className="font-medium">{data.avg}점</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
