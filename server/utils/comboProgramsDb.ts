import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ComboProgram,
  ComboProgramInput,
  ComboProgramListRow,
  ComboProgramTier,
  ComboProgramTierInput,
  ComboProgramWithDetails,
  ComboTierMode,
  PublicComboProgram,
} from '~~/shared/types/comboProgram'
import { isComboProgramLive } from '~~/shared/utils/comboProgramDisplay'

function mapProgram(row: Record<string, unknown>): ComboProgram {
  const tierMode = row.tier_mode === 'min_floor' ? 'min_floor' : 'stepped'
  return {
    id: String(row.id),
    name: String(row.name),
    status: row.status as ComboProgram['status'],
    customer_segment: row.customer_segment as ComboProgram['customer_segment'],
    tier_mode: tierMode,
    starts_at: row.starts_at != null ? String(row.starts_at) : null,
    ends_at: row.ends_at != null ? String(row.ends_at) : null,
    is_active: Boolean(row.is_active),
    notes: typeof row.notes === 'string' ? row.notes : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function mapTier(row: Record<string, unknown>): ComboProgramTier {
  return {
    id: String(row.id),
    program_id: String(row.program_id),
    min_items: Number(row.min_items),
    max_items: row.max_items != null ? Number(row.max_items) : null,
    extra_discount_percent: Number(row.extra_discount_percent),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
  }
}

export function validateComboTiers(
  tiers: ComboProgramTierInput[],
  tierMode: ComboTierMode = 'stepped',
): string | null {
  if (!tiers.length) return 'ต้องมีอย่างน้อย 1 ชั้นส่วนลด (จำนวนชิ้น)'

  if (tierMode === 'min_floor') {
    if (tiers.length !== 1) return 'โหมดขั้นต่ำ — กำหนดได้เพียง 1 ชั้น (ตั้งแต่ X ชิ้นขึ้นไป)'
    const t = tiers[0]!
    if (t.min_items < 1) return 'จำนวนชิ้นขั้นต่ำต้องอย่างน้อย 1'
    if (t.max_items != null) return 'โหมดขั้นต่ำ — ไม่ต้องระบุชิ้นสูงสุด'
    const pct = Number(t.extra_discount_percent)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return 'ส่วนลด % ต้องอยู่ระหว่าง 0–100'
    }
    return null
  }

  const sorted = [...tiers].sort((a, b) => a.min_items - b.min_items)

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i]!
    if (t.min_items < 1) return 'จำนวนชิ้นขั้นต่ำต้องอย่างน้อย 1'
    if (t.max_items != null) {
      return 'โหมดหลายขั้น — ใช้เฉพาะจำนวนชิ้นขั้นต่ำ (ไม่ระบุชิ้นสูงสุด) เช่น 2 ชิ้น 10%, 5 ชิ้น 15%'
    }
    const pct = Number(t.extra_discount_percent)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return 'ส่วนลด % ต้องอยู่ระหว่าง 0–100'
    }
    if (i > 0) {
      const prev = sorted[i - 1]!
      if (t.min_items <= prev.min_items) {
        return 'จำนวนชิ้นขั้นต่ำต้องเรียงจากน้อยไปมาก (เช่น 2, 5, 7)'
      }
      if (pct < Number(prev.extra_discount_percent)) {
        return 'ส่วนลด % ควรไม่ลดลงเมื่อจำนวนชิ้นมากขึ้น'
      }
    }
  }

  return null
}

export async function listComboPrograms(supabase: SupabaseClient): Promise<ComboProgramListRow[]> {
  const { data: programs, error } = await supabase
    .from('combo_programs')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!programs?.length) return []

  const ids = programs.map(p => p.id as string)

  const { data: tiers } = await supabase
    .from('combo_program_tiers')
    .select('program_id')
    .in('program_id', ids)

  const tierCounts = new Map<string, number>()
  for (const t of tiers ?? []) {
    const pid = t.program_id as string
    tierCounts.set(pid, (tierCounts.get(pid) ?? 0) + 1)
  }

  return programs.map((row) => {
    const program = mapProgram(row as Record<string, unknown>)
    return {
      ...program,
      tier_count: tierCounts.get(program.id) ?? 0,
    }
  })
}

export async function fetchComboProgramById(
  supabase: SupabaseClient,
  id: string,
): Promise<ComboProgramWithDetails | null> {
  const { data: programRow, error } = await supabase
    .from('combo_programs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!programRow) return null

  const { data: tierRows, error: tierErr } = await supabase
    .from('combo_program_tiers')
    .select('*')
    .eq('program_id', id)
    .order('sort_order', { ascending: true })
    .order('min_items', { ascending: true })

  if (tierErr) throw tierErr

  return {
    ...mapProgram(programRow as Record<string, unknown>),
    tiers: (tierRows ?? []).map(r => mapTier(r as Record<string, unknown>)),
  }
}

async function replaceTiers(
  supabase: SupabaseClient,
  programId: string,
  tiers: ComboProgramTierInput[],
) {
  const { error: delErr } = await supabase
    .from('combo_program_tiers')
    .delete()
    .eq('program_id', programId)

  if (delErr) throw delErr
  if (!tiers.length) return

  const rows = tiers.map((t, index) => ({
    program_id: programId,
    min_items: t.min_items,
    max_items: t.max_items ?? null,
    extra_discount_percent: t.extra_discount_percent,
    sort_order: t.sort_order ?? index,
  }))

  const { error: insErr } = await supabase.from('combo_program_tiers').insert(rows)
  if (insErr) throw insErr
}

export async function createComboProgram(
  supabase: SupabaseClient,
  input: ComboProgramInput,
): Promise<ComboProgramWithDetails> {
  const tierMode: ComboTierMode = input.tier_mode === 'min_floor' ? 'min_floor' : 'stepped'
  const tierErr = input.tiers
    ? validateComboTiers(input.tiers, tierMode)
    : 'ต้องมีอย่างน้อย 1 ชั้นส่วนลด (จำนวนชิ้น)'
  if (tierErr) throw new Error(tierErr)

  const { data, error } = await supabase
    .from('combo_programs')
    .insert({
      name: input.name.trim(),
      status: input.status ?? 'draft',
      customer_segment: input.customer_segment,
      tier_mode: tierMode,
      starts_at: input.starts_at || null,
      ends_at: input.ends_at || null,
      is_active: input.is_active ?? true,
      notes: input.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (error) throw error

  const id = data.id as string
  await replaceTiers(supabase, id, (input.tiers ?? []).map(t => ({
    ...t,
    max_items: null,
  })))

  const full = await fetchComboProgramById(supabase, id)
  if (!full) throw new Error('สร้างโปรแกรมแล้วแต่โหลดกลับไม่ได้')
  return full
}

export async function updateComboProgram(
  supabase: SupabaseClient,
  id: string,
  input: Partial<ComboProgramInput>,
): Promise<ComboProgramWithDetails> {
  if (input.tiers) {
    const tierMode = input.tier_mode
      ?? (await fetchComboProgramById(supabase, id))?.tier_mode
      ?? 'stepped'
    const tierErr = validateComboTiers(input.tiers, tierMode)
    if (tierErr) throw new Error(tierErr)
  }

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.status !== undefined) patch.status = input.status
  if (input.customer_segment !== undefined) patch.customer_segment = input.customer_segment
  if (input.tier_mode !== undefined) {
    patch.tier_mode = input.tier_mode === 'min_floor' ? 'min_floor' : 'stepped'
  }
  if (input.starts_at !== undefined) patch.starts_at = input.starts_at || null
  if (input.ends_at !== undefined) patch.ends_at = input.ends_at || null
  if (input.is_active !== undefined) patch.is_active = input.is_active
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null

  if (Object.keys(patch).length) {
    const { error } = await supabase.from('combo_programs').update(patch).eq('id', id)
    if (error) throw error
  }

  if (input.tiers) {
    const tierMode = (patch.tier_mode as ComboTierMode | undefined)
      ?? input.tier_mode
      ?? (await fetchComboProgramById(supabase, id))?.tier_mode
      ?? 'stepped'
    await replaceTiers(supabase, id, input.tiers.map(t => ({
      ...t,
      max_items: tierMode === 'stepped' || tierMode === 'min_floor' ? null : t.max_items,
    })))
  }

  const full = await fetchComboProgramById(supabase, id)
  if (!full) throw new Error('NOT_FOUND')
  return full
}

export async function deleteComboProgram(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('combo_programs').delete().eq('id', id)
  if (error) throw error
}

export async function listPublishedComboPrograms(
  supabase: SupabaseClient,
): Promise<PublicComboProgram[]> {
  const { data: programs, error } = await supabase
    .from('combo_programs')
    .select('*')
    .eq('status', 'published')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!programs?.length) return []

  const live = programs
    .map(row => mapProgram(row as Record<string, unknown>))
    .filter(p => isComboProgramLive(p))

  if (!live.length) return []

  const ids = live.map(p => p.id)
  const { data: tierRows, error: tierErr } = await supabase
    .from('combo_program_tiers')
    .select('program_id, min_items, max_items, extra_discount_percent, sort_order')
    .in('program_id', ids)
    .order('sort_order', { ascending: true })
    .order('min_items', { ascending: true })

  if (tierErr) throw tierErr

  const tiersByProgram = new Map<string, PublicComboProgram['tiers']>()
  for (const row of tierRows ?? []) {
    const pid = String(row.program_id)
    const list = tiersByProgram.get(pid) ?? []
    list.push({
      min_items: Number(row.min_items),
      max_items: row.max_items != null ? Number(row.max_items) : null,
      extra_discount_percent: Number(row.extra_discount_percent),
      sort_order: Number(row.sort_order ?? 0),
    })
    tiersByProgram.set(pid, list)
  }

  return live
    .map(program => ({
      ...program,
      tiers: tiersByProgram.get(program.id) ?? [],
    }))
    .filter(p => p.tiers.length > 0)
}
