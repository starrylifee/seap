import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Simple password hashing using Web Crypto API (PBKDF2)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  // Format: hex(salt):hex(hash)
  return `${bufferToHex(salt.buffer as ArrayBuffer)}:${bufferToHex(hash)}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  
  // Check if it's our PBKDF2 format (contains colon and looks like hex)
  if (storedHash.includes(':') && /^[0-9a-f]+:[0-9a-f]+$/i.test(storedHash)) {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = hexToBuffer(saltHex);
    const expectedHash = hexToBuffer(hashHex);
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt.buffer as ArrayBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    
    const hashArray = new Uint8Array(hash);
    if (hashArray.length !== expectedHash.length) return false;
    for (let i = 0; i < hashArray.length; i++) {
      if (hashArray[i] !== expectedHash[i]) return false;
    }
    return true;
  }
  
  // Legacy plaintext comparison
  return password === storedHash;
}

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

    // Verify password
    const isValidPassword = await verifyPassword(password, school.password_hash);

    if (!isValidPassword) {
      console.log("Invalid password for school:", schoolCode);
      return new Response(
        JSON.stringify({ error: "비밀번호가 올바르지 않습니다." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If plaintext match (no colon in hash), upgrade to PBKDF2 hash
    if (!school.password_hash.includes(':') || !/^[0-9a-f]+:[0-9a-f]+$/i.test(school.password_hash)) {
      console.log("Upgrading password to PBKDF2 for school:", schoolCode);
      const hashedPassword = await hashPassword(password);
      await supabase
        .from("schools")
        .update({ password_hash: hashedPassword })
        .eq("id", school.id);
    }

    // Generate a simple session token
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
