import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      })
    }

    try {
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Method tidak diizinkan",
          }),
          {
            status: 405,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      const { userId } = await req.json()

      if (!userId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "userId wajib diisi.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SECRET_KEY") ??
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      )

      // Hapus dari Auth
      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: authError.message,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      // Hapus profil aplikasi
      const { error: profileError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId)

      if (profileError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: profileError.message,
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Akun berhasil dihapus.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    } catch (error) {
      console.error(error)

      return new Response(
        JSON.stringify({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan server.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }
  },
}