import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { convertToGrade, gradeInfoMap, GradeLevel } from "@/lib/gradeConversion";

interface ResponseData {
  respondent_type: string;
  average_score: number;
  response_count: number;
}

interface StatsChartsProps {
  responsesByType: ResponseData[];
  overallAverage: number;
}

const COLORS = {
  teacher: "hsl(var(--primary))",
  staff: "hsl(var(--secondary))",
  parent: "hsl(var(--accent))",
  student: "hsl(var(--muted))",
};

const GRADE_COLORS: Record<GradeLevel, string> = {
  excellent: "#10b981",
  good: "#3b82f6",
  average: "#f59e0b",
  poor: "#ef4444",
};

const typeLabels: Record<string, string> = {
  teacher: "교원",
  staff: "직원",
  parent: "학부모",
  student: "학생",
};

export const StatsCharts = ({ responsesByType, overallAverage }: StatsChartsProps) => {
  const barData = responsesByType.map((item) => ({
    name: typeLabels[item.respondent_type] || item.respondent_type,
    평균점수: parseFloat(item.average_score.toFixed(2)),
    응답수: item.response_count,
  }));

  const pieData = responsesByType.map((item) => ({
    name: typeLabels[item.respondent_type] || item.respondent_type,
    value: item.response_count,
  }));

  const overallGrade = convertToGrade(overallAverage);

  return (
    <div className="space-y-6">
      {/* Overall Grade Card */}
      <Card>
        <CardHeader>
          <CardTitle>종합 평가 등급</CardTitle>
          <CardDescription>5점 척도를 4단계 등급으로 환산</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold">{overallAverage.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">평균 점수</div>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl font-bold px-6 py-2 rounded-lg ${overallGrade.bgColor} ${overallGrade.color}`}
              >
                {overallGrade.label}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {overallGrade.description}
              </div>
            </div>
          </div>

          {/* Grade Scale Reference */}
          <div className="mt-6 grid grid-cols-4 gap-2 text-center text-sm">
            {(Object.keys(gradeInfoMap) as GradeLevel[]).map((level) => (
              <div key={level} className={`p-2 rounded ${gradeInfoMap[level].bgColor}`}>
                <div className={`font-medium ${gradeInfoMap[level].color}`}>
                  {gradeInfoMap[level].label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {level === "excellent" && "4.2점 이상"}
                  {level === "good" && "3.4 ~ 4.2"}
                  {level === "average" && "2.6 ~ 3.4"}
                  {level === "poor" && "2.6 미만"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Average by Type */}
        <Card>
          <CardHeader>
            <CardTitle>응답자별 평균 점수</CardTitle>
            <CardDescription>유형별 만족도 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis domain={[0, 5]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="평균점수" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Response Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>응답자 분포</CardTitle>
            <CardDescription>유형별 응답 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
