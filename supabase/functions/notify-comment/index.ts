import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const SITE_URL = 'https://riztranslation.pages.dev'

function truncate(text: string, max = 120) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

function buildReplyHtml(data: any) {
  const postUrl = `${SITE_URL}/${data.site}/${data.slug}`
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:13px;color:#71717a">Komentar kamu</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46">${truncate(data.parent_content)}</p>
      </div>
      <div style="background:#eff6ff;border-left:3px solid #3b82f6;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:13px;color:#3b82f6">Dibalas oleh <strong>${data.reply_author}</strong></p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#1e3a5f">${truncate(data.reply_content)}</p>
      </div>
      <a href="${postUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
        Lihat komentar →
      </a>
      <p style="margin-top:24px;font-size:12px;color:#a1a1aa">Riztranslation · ${data.site}/${data.slug}</p>
    </div>
  `
}

function buildReactionHtml(data: any) {
  const postUrl = `${SITE_URL}/${data.site}/${data.slug}`
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="text-align:center;padding:16px 0 8px">
        <span style="font-size:48px">${data.emoji}</span>
        <p style="margin:8px 0 0;font-size:15px;color:#3f3f46">
          <strong>${data.reactor_name}</strong> bereaksi pada komentar kamu
        </p>
      </div>
      <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin:16px 0 24px">
        <p style="margin:0 0 4px;font-size:13px;color:#71717a">Komentar kamu</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46">${truncate(data.comment_content)}</p>
      </div>
      <a href="${postUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500">
        Lihat postingan →
      </a>
      <p style="margin-top:24px;font-size:12px;color:#a1a1aa">Riztranslation · ${data.site}/${data.slug}</p>
    </div>
  `
}

Deno.serve(async (req) => {
  const body = await req.json()
  console.log('📩 Payload:', JSON.stringify(body))

  const { type, parent_comment_id, comment_id } = body

  let targetUserId: string | null = null

  if (type === 'reply' && parent_comment_id) {
    const { data, error } = await supabase
      .from('comments').select('user_id').eq('id', parent_comment_id).single()
    console.log('🔍 Reply target:', JSON.stringify(data), error?.message)
    targetUserId = data?.user_id
  } else if (type === 'reaction' && comment_id) {
    const { data, error } = await supabase
      .from('comments').select('user_id').eq('id', comment_id).single()
    console.log('🔍 Reaction target:', JSON.stringify(data), error?.message)
    targetUserId = data?.user_id
  }

  console.log('👤 targetUserId:', targetUserId)
  if (!targetUserId) return new Response('no target', { status: 200 })

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(targetUserId)
  const email = userData?.user?.email
  console.log('📧 email:', email, userError?.message)
  if (!email) return new Response('no email', { status: 200 })

  // Jangan notif kalau reply/reaction ke diri sendiri
  if (userData.user?.id === body.reactor_id) return new Response('self', { status: 200 })

  const isReply = type === 'reply'

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': Deno.env.get('BREVO_API_KEY')!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Riztranslation', email: 'akusudahpunya7@gmail.com' },
      to: [{ email }],
      subject: isReply
        ? `${body.reply_author} membalas komentarmu`
        : `${body.reactor_name} bereaksi ${body.emoji} pada komentarmu`,
      htmlContent: isReply ? buildReplyHtml(body) : buildReactionHtml(body),
    }),
  })

  const resBody = await res.json()
  console.log('📬 Brevo status:', res.status, JSON.stringify(resBody))

  return new Response('ok', { status: 200 })
})
