import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Link2, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStats } from "@/components/ProjectStats";
import { QuestionManager } from "@/components/QuestionManager";
import { AIAnalysis } from "@/components/AIAnalysis";

type RespondentType = "teacher" | "staff" | "parent" | "student";

interface SurveyLink {
  id: string;
  access_code: string;
  respondent_type: RespondentType;
  is_active: boolean;
  expires_at: string | null;
}

const respondentTypeLabels: Record<RespondentType, string> = {
  teacher: "교원",
  staff: "직원",
  parent: "학부모",
  student: "학생",
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<RespondentType | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, schools(*)")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: surveyLinks } = useQuery({
    queryKey: ["survey-links", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_links")
        .select("*")
        .eq("project_id", projectId);
      
      if (error) throw error;
      return data as SurveyLink[];
    },
  });


  const createLinkMutation = useMutation({
    mutationFn: async (respondentType: RespondentType) => {
      const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from("survey_links")
        .insert({
          project_id: projectId!,
          respondent_type: respondentType,
          access_code: accessCode,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-links", projectId] });
      toast.success("설문 링크가 생성되었습니다");
      setSelectedType(null);
    },
    onError: () => {
      toast.error("설문 링크 생성에 실패했습니다");
    },
  });

  const toggleLinkMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("survey_links")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-links", projectId] });
      toast.success("설문 링크 상태가 변경되었습니다");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-foreground mb-4">프로젝트를 찾을 수 없습니다</p>
          <Button onClick={() => navigate("/dashboard")}>대시보드로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-primary text-primary-foreground",
    closed: "bg-secondary text-secondary-foreground",
    archived: "bg-accent text-accent-foreground",
  };

  const statusLabels: Record<string, string> = {
    draft: "준비중",
    active: "진행중",
    closed: "종료",
    archived: "보관됨",
  };

  const respondentTypes: RespondentType[] = ["teacher", "staff", "parent", "student"];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다");
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
              <Badge className={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {project.schools.school_name} · {project.year}년
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="links">설문 링크</TabsTrigger>
            <TabsTrigger value="questions">문항 관리</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI 분석
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-6">

            <Card className="gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>설문 링크 관리</CardTitle>
                <CardDescription>대상별 설문 링크를 생성하고 관리하세요</CardDescription>
              </div>
              <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedType("teacher")}>
                    <Link2 className="w-4 h-4 mr-2" />
                    링크 생성
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>설문 링크 생성</DialogTitle>
                    <DialogDescription>
                      어떤 대상의 설문 링크를 생성하시겠습니까?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {respondentTypes.map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        onClick={() => createLinkMutation.mutate(type)}
                        disabled={createLinkMutation.isPending}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {respondentTypeLabels[type]}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {surveyLinks && surveyLinks.length > 0 ? (
                surveyLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {respondentTypeLabels[link.respondent_type]}
                        </Badge>
                        <Badge variant={link.is_active ? "default" : "secondary"}>
                          {link.is_active ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${window.location.origin}/survey/${link.access_code}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(`${window.location.origin}/survey/${link.access_code}`)
                          }
                        >
                          복사
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleLinkMutation.mutate({
                          id: link.id,
                          isActive: link.is_active,
                        })
                      }
                    >
                      {link.is_active ? "비활성화" : "활성화"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>생성된 설문 링크가 없습니다</p>
                  <p className="text-sm">링크 생성 버튼을 눌러 설문 링크를 만드세요</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="questions">
            <QuestionManager projectId={projectId!} />
          </TabsContent>

          <TabsContent value="stats">
            <ProjectStats projectId={projectId!} />
          </TabsContent>
          <TabsContent value="ai">
            <AIAnalysis projectId={projectId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;