import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { schoolCode, password } = await req.json();

    if (!schoolCode || !password) {
      console.log("Missing credentials");
      return new Response(
        JSON.stringify({ error: "학교 코드와 비밀번호를 입력해주세요." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch school by code (using service role to bypass RLS)
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_code, school_name, password_hash")
      .eq("school_code", schoolCode)
      .single();

    if (schoolError || !school) {
      console.log("School not found:", schoolCode);
      return new Response(
        JSON.stringify({ error: "학교 코드를 찾을 수 없습니다." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password (currently plaintext comparison - TODO: implement bcrypt)
    // For now, we do server-side comparison which is still more secure than client-side
    if (password !== school.password_hash) {
      console.log("Invalid password for school:", schoolCode);
      return new Response(
        JSON.stringify({ error: "비밀번호가 올바르지 않습니다." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a simple session token (in production, use proper JWT)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    console.log("Login successful for school:", school.school_name);

    return new Response(
      JSON.stringify({
        success: true,
        school: {
          id: school.id,
          school_code: school.school_code,
          school_name: school.school_name,
        },
        sessionToken,
        expiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "로그인 처리 중 오류가 발생했습니다." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
