import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BarChart3, Users, FileText, CheckCircle } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 이미 로그인된 경우 대시보드로 리다이렉트
    const schoolId = sessionStorage.getItem("school_id");
    if (schoolId) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "자동화된 평가",
      description: "학교평가 표준 지표가 자동으로 로드되어 설문을 빠르게 구성할 수 있습니다",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "대상별 맞춤 설문",
      description: "교원, 직원, 학부모, 학생별로 최적화된 문항이 자동으로 제공됩니다",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "통합 관리",
      description: "학교평가와 교육계획 수립을 하나의 플랫폼에서 관리하세요",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "실시간 분석",
      description: "응답 현황과 통계를 실시간으로 확인하고 보고서를 생성하세요",
    },
  ];

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center shadow-glow">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              학교평가와 교육계획
              <br />
              <span className="gradient-primary bg-clip-text text-transparent">
                이제 하나로
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              SEAP(School Evaluation Automation Platform)는 학교평가와 교육계획 수립을 
              자동화하여 업무 효율성을 극대화하는 통합 플랫폼입니다
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="gradient-primary text-white shadow-large hover:shadow-glow transition-smooth text-lg px-8 py-6"
                onClick={() => navigate("/login")}
              >
                시작하기
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-accent transition-smooth"
              >
                더 알아보기
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              왜 SEAP인가요?
            </h2>
            <p className="text-lg text-muted-foreground">
              복잡한 학교평가와 교육계획 수립 과정을 간소화하고 자동화합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="gradient-card rounded-2xl p-6 shadow-medium hover:shadow-large transition-smooth"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto gradient-card rounded-3xl shadow-large p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              학교 코드만 있으면 즉시 사용할 수 있습니다
            </p>
            <Button
              size="lg"
              className="gradient-primary text-white shadow-medium hover:shadow-glow transition-smooth text-lg px-10 py-6"
              onClick={() => navigate("/login")}
            >
              관리자 로그인
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
