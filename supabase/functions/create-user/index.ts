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

      const body = await req.json()

      const { email, password, fullName, roleId } = body

      if (!email || !password || !fullName || !roleId) {
        return new Response(
          JSON.stringify({
            success: false,
            message:
              "Email, password, nama lengkap, dan role wajib diisi.",
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

      if (password.length < 6) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Password minimal 6 karakter.",
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

      // Client khusus untuk operasi Admin.
      // Secret key hanya berada di Edge Function.
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SECRET_KEY") ??
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      )

      // Pastikan role benar-benar ada
      const { data: role, error: roleError } = await supabaseAdmin
        .from("roles")
        .select("id, name")
        .eq("id", roleId)
        .single()

      if (roleError || !role) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Role/Jabatan tidak ditemukan.",
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

      // Buat akun Auth
      const {
        data: authData,
        error: authError,
      } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      })

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

      const userId = authData.user.id

      // Simpan profil ke tabel users
      const { error: profileError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role_id: roleId,
        })

      // Kalau insert profil gagal, hapus Auth user lagi
      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(userId)

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
          message: "Akun berhasil dibuat.",
          user: {
            id: userId,
            email,
            full_name: fullName,
            role_id: roleId,
            role_name: role.name,
          },
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