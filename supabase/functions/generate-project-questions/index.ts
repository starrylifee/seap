import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface QuestionTemplate {
  indicatorId: string
  respondentType: 'teacher' | 'staff' | 'parent' | 'student'
  questionText: string
  questionType: 'rating' | 'multiple_choice' | 'text'
  orderIndex: number
}

const questionTemplates: Record<string, QuestionTemplate[]> = {
  'I-1-1-1': [ // 비전 공유
    { indicatorId: 'I-1-1-1', respondentType: 'teacher', questionText: '구성원 합의로 학교 비전을 도출하고 공유했는가?', questionType: 'rating', orderIndex: 1 },
    { indicatorId: 'I-1-1-1', respondentType: 'staff', questionText: '학교 비전이 행정지원 계획에 반영되었는가?', questionType: 'rating', orderIndex: 1 },
    { indicatorId: 'I-1-1-1', respondentType: 'parent', questionText: '학교 교육목표와 비전을 안내받았는가?', questionType: 'rating', orderIndex: 1 },
    { indicatorId: 'I-1-1-1', respondentType: 'student', questionText: '우리 학교의 목표(교훈)를 알고 있나요?', questionType: 'rating', orderIndex: 1 },
  ],
  'I-1-1-2': [ // 민주적 운영
    { indicatorId: 'I-1-1-2', respondentType: 'teacher', questionText: '교직원 회의가 민주적 토론 중심으로 운영되는가?', questionType: 'rating', orderIndex: 2 },
    { indicatorId: 'I-1-1-2', respondentType: 'staff', questionText: '행정 업무 협의가 민주적으로 이루어지는가?', questionType: 'rating', orderIndex: 2 },
    { indicatorId: 'I-1-1-2', respondentType: 'parent', questionText: '학부모 의견이 학교 운영에 잘 반영되는가?', questionType: 'rating', orderIndex: 2 },
    { indicatorId: 'I-1-1-2', respondentType: 'student', questionText: '학급 회의 때 내 의견을 잘 들어주나요?', questionType: 'rating', orderIndex: 2 },
  ],
  'I-1-2-1': [ // 업무 경감
    { indicatorId: 'I-1-2-1', respondentType: 'teacher', questionText: '행정업무 전담팀 운영 등으로 수업 전념 여건이 조성되었는가?', questionType: 'rating', orderIndex: 3 },
    { indicatorId: 'I-1-2-1', respondentType: 'staff', questionText: '업무 분장이 합리적이고 효율적인가?', questionType: 'rating', orderIndex: 3 },
  ],
  'II-2-1-1': [ // 학생 맞춤형
    { indicatorId: 'II-2-1-1', respondentType: 'teacher', questionText: '학생 수준/흥미를 고려해 교육과정을 재구성했는가?', questionType: 'rating', orderIndex: 4 },
    { indicatorId: 'II-2-1-1', respondentType: 'staff', questionText: '교육활동에 필요한 예산/물품이 적기 지원되는가?', questionType: 'rating', orderIndex: 4 },
    { indicatorId: 'II-2-1-1', respondentType: 'parent', questionText: '자녀 특성에 맞는 교육이 이루어지는가?', questionType: 'rating', orderIndex: 4 },
    { indicatorId: 'II-2-1-1', respondentType: 'student', questionText: '수업 시간이 재미있고 이해가 잘 되나요?', questionType: 'rating', orderIndex: 4 },
  ],
  'II-2-1-2': [ // 진로 교육
    { indicatorId: 'II-2-1-2', respondentType: 'teacher', questionText: '체험 중심의 진로교육이 내실 있게 운영되었는가?', questionType: 'rating', orderIndex: 5 },
    { indicatorId: 'II-2-1-2', respondentType: 'parent', questionText: '자녀 적성 계발을 위한 행사가 만족스러운가?', questionType: 'rating', orderIndex: 5 },
    { indicatorId: 'II-2-1-2', respondentType: 'student', questionText: '내 꿈을 찾는 활동(진로체험)이 재미있나요?', questionType: 'rating', orderIndex: 5 },
  ],
  'II-2-2-1': [ // 교원 연수
    { indicatorId: 'II-2-2-1', respondentType: 'teacher', questionText: '전문성 신장을 위한 연수/공동체 활동이 활발한가?', questionType: 'rating', orderIndex: 6 },
    { indicatorId: 'II-2-2-1', respondentType: 'staff', questionText: '직무 능력 향상을 위한 연수 기회가 제공되는가?', questionType: 'rating', orderIndex: 6 },
    { indicatorId: 'II-2-2-1', respondentType: 'parent', questionText: '선생님들이 열정적으로 가르친다고 느끼는가?', questionType: 'rating', orderIndex: 6 },
  ],
  'III-3-1-1': [ // 기초학력
    { indicatorId: 'III-3-1-1', respondentType: 'teacher', questionText: '학습부진 학생을 위한 맞춤형 지도를 했는가?', questionType: 'rating', orderIndex: 7 },
    { indicatorId: 'III-3-1-1', respondentType: 'staff', questionText: '기초학력 강사 채용/관리가 원활한가?', questionType: 'rating', orderIndex: 7 },
    { indicatorId: 'III-3-1-1', respondentType: 'parent', questionText: '자녀가 모르는 것을 학교에서 잘 지도해 주는가?', questionType: 'rating', orderIndex: 7 },
    { indicatorId: 'III-3-1-1', respondentType: 'student', questionText: '공부하다 모를 때 선생님이 친절히 알려주나요?', questionType: 'rating', orderIndex: 7 },
  ],
  'III-3-2-1': [ // 학교폭력
    { indicatorId: 'III-3-2-1', respondentType: 'teacher', questionText: '학교폭력 예방 교육 및 사안 처리가 적절한가?', questionType: 'rating', orderIndex: 8 },
    { indicatorId: 'III-3-2-1', respondentType: 'staff', questionText: '학교폭력 예방을 위한 시설/환경 관리가 잘되는가?', questionType: 'rating', orderIndex: 8 },
    { indicatorId: 'III-3-2-1', respondentType: 'parent', questionText: '학교가 학교폭력으로부터 안전하다고 느끼는가?', questionType: 'rating', orderIndex: 8 },
    { indicatorId: 'III-3-2-1', respondentType: 'student', questionText: '친구들과 사이좋게 지내고 괴롭힘이 없나요?', questionType: 'rating', orderIndex: 8 },
  ],
  'III-3-4-1': [ // 시설/급식
    { indicatorId: 'III-3-4-1', respondentType: 'teacher', questionText: '교육활동 공간이 청결하고 안전하게 관리되는가?', questionType: 'rating', orderIndex: 9 },
    { indicatorId: 'III-3-4-1', respondentType: 'staff', questionText: '시설물 유지보수 및 위생 관리가 철저한가?', questionType: 'rating', orderIndex: 9 },
    { indicatorId: 'III-3-4-1', respondentType: 'parent', questionText: '급식의 영양과 맛, 위생에 만족하는가?', questionType: 'rating', orderIndex: 9 },
    { indicatorId: 'III-3-4-1', respondentType: 'student', questionText: '급식이 맛있고 화장실/교실이 깨끗한가요?', questionType: 'rating', orderIndex: 9 },
  ],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { projectId } = await req.json()

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all indicators
    const { data: indicators, error: indicatorsError } = await supabase
      .from('indicators')
      .select('id, code')

    if (indicatorsError) throw indicatorsError

    // Prepare questions to insert
    const questionsToInsert: any[] = []

    indicators?.forEach(indicator => {
      const templates = questionTemplates[indicator.code]
      if (templates) {
        templates.forEach(template => {
          questionsToInsert.push({
            project_id: projectId,
            indicator_id: indicator.id,
            respondent_type: template.respondentType,
            question_text: template.questionText,
            question_type: template.questionType,
            order_index: template.orderIndex,
            is_required: true,
          })
        })
      }
    })

    // Insert all questions
    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, questionsCreated: questionsToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
