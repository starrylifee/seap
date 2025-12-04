import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap } from "lucide-react";

const Login = () => {
  const [schoolCode, setSchoolCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 서버 측 로그인 검증 (Edge Function 사용)
      const { data, error } = await supabase.functions.invoke('secure-login', {
        body: { schoolCode, password }
      });

      if (error || !data?.success) {
        toast.error(data?.error || "로그인에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // 세션 저장 (서버에서 검증된 데이터만 저장)
      sessionStorage.setItem("school_id", data.school.id);
      sessionStorage.setItem("school_code", data.school.school_code);
      sessionStorage.setItem("school_name", data.school.school_name);
      sessionStorage.setItem("session_token", data.sessionToken);
      sessionStorage.setItem("session_expires", data.expiresAt);

      toast.success(`${data.school.school_name}에 로그인했습니다.`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">SEAP</h1>
          <p className="text-muted-foreground">
            학교평가 및 교육계획 수립 자동화 플랫폼
          </p>
        </div>

        <Card className="shadow-large border-border/50">
          <CardHeader>
            <CardTitle>관리자 로그인</CardTitle>
            <CardDescription>
              학교 코드와 비밀번호를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolCode">학교 코드</Label>
                <Input
                  id="schoolCode"
                  placeholder="예: SD1004"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  required
                  className="transition-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-base"
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-white shadow-medium hover:shadow-large transition-smooth"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>학교 코드가 없으신가요?</p>
          <Button variant="link" className="text-primary">
            관리자에게 문의하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
