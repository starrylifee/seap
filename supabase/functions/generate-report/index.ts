import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "프로젝트 ID가 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, schools(*)")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // Fetch all responses with questions
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select(`
        response_value,
        respondent_type,
        questions!inner(question_text, question_type, section_name)
      `)
      .eq("project_id", projectId);

    if (responsesError) throw responsesError;

    // Calculate statistics
    const stats = {
      total: responses?.length || 0,
      byType: {} as Record<string, number>,
      ratingAvg: {} as Record<string, { sum: number; count: number; avg: number }>,
      textResponses: [] as string[],
    };

    responses?.forEach((r: any) => {
      // Count by type
      stats.byType[r.respondent_type] = (stats.byType[r.respondent_type] || 0) + 1;
      
      // Calculate rating averages
      if (r.questions?.question_type === 'rating' && r.response_value) {
        const key = r.questions.section_name || '전체';
        if (!stats.ratingAvg[key]) {
          stats.ratingAvg[key] = { sum: 0, count: 0, avg: 0 };
        }
        stats.ratingAvg[key].sum += parseFloat(r.response_value);
        stats.ratingAvg[key].count++;
      }
      
      // Collect text responses
      if (r.questions?.question_type === 'text' && r.response_value?.trim()) {
        stats.textResponses.push(r.response_value);
      }
    });

    // Calculate averages
    Object.keys(stats.ratingAvg).forEach(key => {
      const data = stats.ratingAvg[key];
      data.avg = data.count > 0 ? Math.round((data.sum / data.count) * 100) / 100 : 0;
    });

    console.log("Stats calculated:", stats);

    // Generate report using AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `당신은 학교 평가 보고서를 작성하는 전문가입니다.
주어진 데이터를 바탕으로 학교 평가 보고서의 각 섹션을 작성해주세요.
JSON 형식으로 응답하세요:
{
  "title": "보고서 제목",
  "sections": [
    {
      "id": "overview",
      "title": "1. 평가 개요",
      "content": "설문 개요 내용..."
    },
    {
      "id": "participation",
      "title": "2. 참여 현황",
      "content": "참여 현황 분석..."
    },
    {
      "id": "results",
      "title": "3. 평가 결과",
      "content": "영역별 평가 결과..."
    },
    {
      "id": "analysis",
      "title": "4. 종합 분석",
      "content": "강점, 약점, 특이사항 분석..."
    },
    {
      "id": "recommendations",
      "title": "5. 개선 제안",
      "content": "구체적인 개선 방안..."
    },
    {
      "id": "conclusion",
      "title": "6. 결론",
      "content": "결론 및 향후 방향..."
    }
  ]
}
각 섹션은 2-4문단으로 작성하고, 구체적인 수치와 데이터를 인용하세요.
JSON만 출력하세요.`
          },
          {
            role: 'user',
            content: `다음 데이터를 바탕으로 학교 평가 보고서를 작성해주세요:

학교명: ${project.schools?.school_name || '미정'}
평가년도: ${project.year}년
프로젝트명: ${project.title}

응답 통계:
- 총 응답 수: ${stats.total}건
- 대상별 응답: ${Object.entries(stats.byType).map(([k, v]) => `${k}: ${v}건`).join(', ')}

영역별 평균 점수:
${Object.entries(stats.ratingAvg).map(([k, v]) => `- ${k}: ${v.avg}점 (${v.count}건)`).join('\n')}

주요 텍스트 응답 (${stats.textResponses.length}건):
${stats.textResponses.slice(0, 20).join('\n---\n')}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reportText = aiData.choices?.[0]?.message?.content || '';

    console.log("AI response:", reportText);

    // Parse JSON from AI response
    let report;
    try {
      const jsonMatch = reportText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        reportText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, reportText];
      report = JSON.parse(jsonMatch[1] || reportText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      report = {
        title: `${project.schools?.school_name || ''} ${project.year}년 학교 평가 보고서`,
        sections: [
          { id: 'content', title: '보고서 내용', content: reportText }
        ]
      };
    }

    // Add metadata
    report.metadata = {
      schoolName: project.schools?.school_name,
      year: project.year,
      projectTitle: project.title,
      generatedAt: new Date().toISOString(),
      stats: {
        totalResponses: stats.total,
        byType: stats.byType,
        ratingAvg: stats.ratingAvg,
      }
    };

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: "보고서 생성 중 오류가 발생했습니다." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
