import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, Save, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question_text: string;
  question_type: "rating" | "multiple_choice" | "text" | "priority";
  order_index: number;
  is_required: boolean;
  section_name: string | null;
  options?: any;
}

interface SurveyLink {
  id: string;
  project_id: string;
  respondent_type: "teacher" | "staff" | "parent" | "student";
  is_active: boolean;
}

const TeacherSurvey = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [surveyLink, setSurveyLink] = useState<SurveyLink | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [savedProgress, setSavedProgress] = useState(false);

  useEffect(() => {
    loadSurvey();
    loadSavedResponses();
  }, [accessCode]);

  const loadSavedResponses = () => {
    const saved = localStorage.getItem(`survey_draft_${accessCode}`);
    if (saved) {
      setResponses(JSON.parse(saved));
      setSavedProgress(true);
      toast.info("임시 저장된 응답을 불러왔습니다.");
    }
  };

  const loadSurvey = async () => {
    if (!accessCode) {
      toast.error("잘못된 접근입니다.");
      navigate("/");
      return;
    }

    try {
      const { data: linkData, error: linkError } = await supabase
        .from("survey_links")
        .select("*")
        .eq("access_code", accessCode)
        .single();

      if (linkError || !linkData) {
        toast.error("유효하지 않은 설문 링크입니다.");
        navigate("/");
        return;
      }

      if (!linkData.is_active) {
        toast.error("이 설문은 현재 비활성화되어 있습니다.");
        navigate("/");
        return;
      }

      setSurveyLink(linkData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("project_id", linkData.project_id)
        .eq("respondent_type", linkData.respondent_type)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

      setQuestions(questionsData || []);
      
      // Set first section as current
      if (questionsData && questionsData.length > 0) {
        const sections = Array.from(new Set(questionsData.map((q) => q.section_name).filter(Boolean)));
        if (sections.length > 0) {
          setCurrentSection(sections[0]);
        }
      }
    } catch (error) {
      console.error("Survey load error:", error);
      toast.error("설문을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSaveDraft = () => {
    localStorage.setItem(`survey_draft_${accessCode}`, JSON.stringify(responses));
    setSavedProgress(true);
    toast.success("임시 저장되었습니다.");
  };

  const handleSubmit = async () => {
    if (!surveyLink) return;

    const unansweredRequired = questions.filter(
      (q) => q.is_required && !responses[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error("필수 문항에 모두 응답해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const responsesToInsert = questions
        .filter((q) => responses[q.id])
        .map((q) => ({
          project_id: surveyLink.project_id,
          question_id: q.id,
          respondent_type: surveyLink.respondent_type,
          response_value: responses[q.id],
          session_id: sessionId,
        }));

      const { error } = await supabase.from("responses").insert(responsesToInsert);

      if (error) throw error;

      // Clear saved draft
      localStorage.removeItem(`survey_draft_${accessCode}`);
      
      setCompleted(true);
      toast.success("설문 응답이 제출되었습니다. 감사합니다!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("응답 제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingQuestion = (question: Question) => (
    <RadioGroup
      value={responses[question.id]}
      onValueChange={(value) => handleResponseChange(question.id, value)}
      className="space-y-2"
    >
      {["1", "2", "3", "4", "5"].map((value) => (
        <div key={value} className="flex items-center space-x-2">
          <RadioGroupItem value={value} id={`${question.id}-${value}`} />
          <Label
            htmlFor={`${question.id}-${value}`}
            className="font-normal cursor-pointer"
          >
            {value === "1" && "전혀 그렇지 않다"}
            {value === "2" && "그렇지 않다"}
            {value === "3" && "보통이다"}
            {value === "4" && "그렇다"}
            {value === "5" && "매우 그렇다"}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );

  const renderTextQuestion = (question: Question) => (
    <Textarea
      value={responses[question.id] || ""}
      onChange={(e) => handleResponseChange(question.id, e.target.value)}
      placeholder="답변을 입력해 주세요"
      rows={4}
      className="w-full"
    />
  );

  const sections = Array.from(new Set(questions.map((q) => q.section_name).filter(Boolean)));
  const sectionQuestions = currentSection
    ? questions.filter((q) => q.section_name === currentSection)
    : questions;

  const totalAnswered = Object.keys(responses).length;
  const progressPercentage = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  const currentSectionIndex = sections.indexOf(currentSection || "");
  const canGoNext = currentSectionIndex < sections.length - 1;
  const canGoPrev = currentSectionIndex > 0;

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">설문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">제출 완료</h2>
            <p className="text-muted-foreground mb-6">
              설문에 응답해 주셔서 감사합니다.
              <br />
              소중한 의견은 학교 발전에 반영하겠습니다.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">교원 심화 설문조사</CardTitle>
            <CardDescription>
              섹션별로 구성된 설문입니다. 언제든지 임시 저장할 수 있습니다.
            </CardDescription>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>응답 진행률</span>
                <span>{totalAnswered} / {questions.length} 문항</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Section Navigation */}
        {sections.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <Badge
                    key={section}
                    variant={section === currentSection ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => setCurrentSection(section)}
                  >
                    {section}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {sectionQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  {index + 1}. {question.question_text}
                  {question.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.question_type === "rating" && renderRatingQuestion(question)}
                {question.question_type === "text" && renderTextQuestion(question)}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation & Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            {canGoPrev && (
              <Button
                variant="outline"
                onClick={() => setCurrentSection(sections[currentSectionIndex - 1])}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전 섹션
              </Button>
            )}
            {canGoNext && (
              <Button
                variant="outline"
                onClick={() => setCurrentSection(sections[currentSectionIndex + 1])}
              >
                다음 섹션
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
            >
              <Save className="w-4 h-4 mr-2" />
              임시 저장
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gradient-primary text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  제출 중...
                </>
              ) : (
                "설문 제출"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSurvey;
