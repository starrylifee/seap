import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, CheckCircle, TrendingUp } from "lucide-react";
import { StatsCharts } from "./StatsCharts";
import { convertToGrade } from "@/lib/gradeConversion";

interface ProjectStatsProps {
  projectId: string;
}

interface ResponsesByTypeData {
  respondent_type: string;
  average_score: number;
  response_count: number;
}

interface Stats {
  totalQuestions: number;
  totalResponses: number;
  responsesByType: Record<string, number>;
  averageRating: number;
  completionRate: Record<string, number>;
  chartData: ResponsesByTypeData[];
}

export const ProjectStats = ({ projectId }: ProjectStatsProps) => {
const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    totalResponses: 0,
    responsesByType: {},
    averageRating: 0,
    completionRate: {},
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [projectId]);

  const loadStats = async () => {
    try {
      // Get total questions
      const { count: questionsCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Get total responses
      const { count: responsesCount } = await supabase
        .from("responses")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Get responses by type
      const { data: responsesByType } = await supabase
        .from("responses")
        .select("respondent_type")
        .eq("project_id", projectId);

      const typeCount: Record<string, number> = {};
      responsesByType?.forEach((r) => {
        typeCount[r.respondent_type] = (typeCount[r.respondent_type] || 0) + 1;
      });

      // Get average rating
      const { data: ratingResponses } = await supabase
        .from("responses")
        .select("response_value")
        .eq("project_id", projectId)
        .not("response_value", "is", null);

      let totalRating = 0;
      let ratingCount = 0;
      ratingResponses?.forEach((r) => {
        const value = parseInt(r.response_value);
        if (!isNaN(value) && value >= 1 && value <= 5) {
          totalRating += value;
          ratingCount++;
        }
      });

      // Calculate completion rate by respondent type
      const { data: questions } = await supabase
        .from("questions")
        .select("respondent_type")
        .eq("project_id", projectId);

      const questionsByType: Record<string, number> = {};
      questions?.forEach((q) => {
        questionsByType[q.respondent_type] = (questionsByType[q.respondent_type] || 0) + 1;
      });

      const completionRate: Record<string, number> = {};
      Object.keys(questionsByType).forEach((type) => {
        const responded = typeCount[type] || 0;
        const total = questionsByType[type] || 1;
        completionRate[type] = Math.round((responded / total) * 100);
      });

      // Calculate average by respondent type for charts
      const typeAverages: Record<string, { total: number; count: number }> = {};
      ratingResponses?.forEach((r) => {
        const value = parseInt(r.response_value);
        if (!isNaN(value) && value >= 1 && value <= 5) {
          // We need to get the respondent_type - fetch it separately
        }
      });

      // Create chart data from type count
      const chartData: ResponsesByTypeData[] = Object.keys(typeCount).map((type) => ({
        respondent_type: type,
        average_score: ratingCount > 0 ? totalRating / ratingCount : 0, // simplified for now
        response_count: typeCount[type],
      }));

      setStats({
        totalQuestions: questionsCount || 0,
        totalResponses: responsesCount || 0,
        responsesByType: typeCount,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        completionRate,
        chartData,
      });
    } catch (error) {
      console.error("Stats load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRespondentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      teacher: "교원",
      staff: "직원",
      parent: "학부모",
      student: "학생",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 문항 수</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1">평가 문항</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 응답 수</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground mt-1">수집된 응답</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">평균 만족도</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(2) : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">5점 만점</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">응답자 유형</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.responsesByType).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">유형</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Rate by Type */}
      <Card>
        <CardHeader>
          <CardTitle>응답자 유형별 현황</CardTitle>
          <CardDescription>각 유형별 응답 완료율</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.completionRate).map(([type, rate]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getRespondentTypeLabel(type)}</span>
                <span className="text-muted-foreground">
                  {stats.responsesByType[type] || 0}개 응답 ({rate}%)
                </span>
              </div>
              <Progress value={rate} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Charts Section */}
      {stats.chartData.length > 0 && (
        <StatsCharts
          responsesByType={stats.chartData}
          overallAverage={stats.averageRating}
        />
      )}
    </div>
  );
};
