import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  respondent_type: string;
  order_index: number;
  is_required: boolean;
}

interface QuestionManagerProps {
  projectId: string;
}

export const QuestionManager = ({ projectId }: QuestionManagerProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("teacher");

  useEffect(() => {
    loadQuestions();
  }, [projectId]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("project_id", projectId)
        .order("respondent_type", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Load questions error:", error);
      toast.error("문항을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", deleteTarget);

      if (error) throw error;

      toast.success("문항이 삭제되었습니다.");
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("문항 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
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

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rating: "5점 척도",
      text: "서술형",
      multiple_choice: "객관식",
      priority: "우선순위",
    };
    return labels[type] || type;
  };

  const filteredQuestions = questions.filter((q) => q.respondent_type === selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>설문 문항 관리</CardTitle>
          <CardDescription>
            총 {questions.length}개 문항 · 유형별로 확인하고 수정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="teacher">교원</TabsTrigger>
              <TabsTrigger value="staff">직원</TabsTrigger>
              <TabsTrigger value="parent">학부모</TabsTrigger>
              <TabsTrigger value="student">학생</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-6">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {getRespondentTypeLabel(selectedType)} 대상 문항이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium mb-2">{question.question_text}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">
                            {getQuestionTypeLabel(question.question_type)}
                          </Badge>
                          {question.is_required && (
                            <Badge variant="secondary">필수</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.info("문항 수정 기능은 곧 제공됩니다.")}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(question.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문항을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 해당 문항과 관련된 응답 데이터는 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
