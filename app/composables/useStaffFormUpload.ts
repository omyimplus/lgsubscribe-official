export async function staffFormUpload<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
  const supabase = useNuxtApp().$supabase
  if (!supabase) {
    throw new Error('ระบบเข้าสู่ระบบยังไม่พร้อม')
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('กรุณาเข้าสู่ระบบใหม่')
  }

  const body = new FormData()
  body.append(fieldName, file)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body,
  })

  let payload: { message?: string } = {}
  try {
    payload = await response.json()
  }
  catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(payload.message || `อัปโหลดไม่สำเร็จ (${response.status})`)
  }

  return payload as T
}
