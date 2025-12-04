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
    const { projectId, analysisType } = await req.json();

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

    // Fetch text responses for the project
    const { data: responses, error: fetchError } = await supabase
      .from("responses")
      .select(`
        response_value,
        respondent_type,
        questions!inner(question_type, question_text)
      `)
      .eq("project_id", projectId)
      .not("response_value", "is", null);

    if (fetchError) {
      console.error("Error fetching responses:", fetchError);
      throw fetchError;
    }

    // Filter text responses only
    const textResponses = responses?.filter(
      (r: any) => r.questions?.question_type === 'text' && r.response_value?.trim()
    ) || [];

    if (textResponses.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis: {
            wordCloud: [],
            summary: "분석할 텍스트 응답이 없습니다.",
            themes: []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare text for analysis
    const allText = textResponses.map((r: any) => r.response_value).join('\n');
    
    console.log(`Analyzing ${textResponses.length} text responses`);

    // Call Lovable AI for analysis
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
            content: `당신은 학교 평가 설문 응답을 분석하는 전문가입니다. 
주어진 텍스트 응답들을 분석하여 다음 형식의 JSON으로 응답하세요:
{
  "wordCloud": [{"text": "단어", "value": 빈도수}, ...], // 상위 30개 키워드
  "summary": "전체 응답 요약 (2-3문장)",
  "themes": ["주제1", "주제2", ...], // 주요 테마 5개
  "positives": ["긍정적 의견1", ...], // 긍정적 의견 3개
  "negatives": ["개선필요사항1", ...], // 개선 필요 사항 3개
  "recommendations": ["제안1", ...] // AI 추천 개선방안 3개
}
JSON만 출력하세요. 다른 텍스트는 출력하지 마세요.`
          },
          {
            role: 'user',
            content: `다음 학교 평가 설문의 텍스트 응답들을 분석해주세요:\n\n${allText}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || '';
    
    console.log("AI response:", analysisText);

    // Parse JSON from AI response
    let analysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, analysisText];
      analysis = JSON.parse(jsonMatch[1] || analysisText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      analysis = {
        wordCloud: [],
        summary: analysisText,
        themes: [],
        positives: [],
        negatives: [],
        recommendations: []
      };
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: "분석 중 오류가 발생했습니다." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
