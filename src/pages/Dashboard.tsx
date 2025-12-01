import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";

interface Project {
  id: string;
  title: string;
  year: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const schoolId = sessionStorage.getItem("school_id");
    const storedSchoolName = sessionStorage.getItem("school_name");

    if (!schoolId) {
      navigate("/login");
      return;
    }

    setSchoolName(storedSchoolName || "");
    loadProjects(schoolId);
  }, [navigate]);

  const loadProjects = async (schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("프로젝트를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    toast.success("로그아웃되었습니다.");
    navigate("/login");
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { text: "초안", className: "bg-muted text-muted-foreground" },
      active: { text: "진행중", className: "bg-success text-success-foreground" },
      closed: { text: "완료", className: "bg-primary text-primary-foreground" },
      archived: { text: "보관됨", className: "bg-secondary text-secondary-foreground" },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SEAP</h1>
                <p className="text-sm text-muted-foreground">{schoolName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-medium border-border/50 hover:shadow-large transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 프로젝트</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{projects.length}</div>
              <p className="text-xs text-muted-foreground">생성된 평가 프로젝트</p>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-border/50 hover:shadow-large transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행중인 설문</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {projects.filter((p) => p.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">활성 설문 조사</p>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-border/50 hover:shadow-large transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료된 평가</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {projects.filter((p) => p.status === "closed").length}
              </div>
              <p className="text-xs text-muted-foreground">분석 가능한 데이터</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">평가 프로젝트</h2>
              <p className="text-muted-foreground">학교평가 및 교육계획 수립 프로젝트를 관리하세요</p>
            </div>
            <Button 
              className="gradient-primary text-white shadow-medium hover:shadow-large transition-smooth"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 프로젝트 만들기
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
            </div>
          ) : projects.length === 0 ? (
            <Card className="shadow-medium border-border/50">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">프로젝트가 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  첫 번째 평가 프로젝트를 만들어 시작하세요
                </p>
                <Button 
                  className="gradient-primary text-white"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  프로젝트 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="shadow-medium border-border/50 hover:shadow-large transition-smooth cursor-pointer"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>{project.year}학년도</CardDescription>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>생성일: {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        schoolId={sessionStorage.getItem("school_id") || ""}
        onSuccess={() => {
          const schoolId = sessionStorage.getItem("school_id");
          if (schoolId) loadProjects(schoolId);
        }}
      />
    </div>
  );
};

export default Dashboard;
