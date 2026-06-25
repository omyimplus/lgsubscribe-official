<script setup lang="ts">
import type {
  ComboCustomerSegment,
  ComboProgramStatus,
  ComboProgramTierInput,
  ComboProgramWithDetails,
  ComboTierMode,
} from '~~/shared/types/comboProgram'
import {
  comboCalculationNote,
  comboCalculationNoteWithAdvance,
  comboSegmentLabels,
  comboTierModeLabels,
  formatTierRange,
} from '~~/shared/utils/comboProgramDisplay'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const id = route.params.id as string

const { data: program, pending, error: fetchError, refresh } = await useFetch<ComboProgramWithDetails>(
  () => `/api/admin/combo-programs/${id}`,
  { key: `combo-program-${id}` },
)

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10'

const saving = ref(false)
const saveError = ref('')
const saveOk = ref(false)

const form = reactive({
  name: '',
  status: 'draft' as ComboProgramStatus,
  customer_segment: 'new' as ComboCustomerSegment,
  tier_mode: 'stepped' as ComboTierMode,
  starts_at: '',
  ends_at: '',
  is_active: true,
  notes: '',
})

const tiers = ref<ComboProgramTierInput[]>([])

function toLocalDatetime(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function toIsoOrNull(local: string) {
  if (!local?.trim()) return null
  return new Date(local).toISOString()
}

watch(program, (p) => {
  if (!p) return
  form.name = p.name
  form.status = p.status
  form.customer_segment = p.customer_segment
  form.tier_mode = p.tier_mode ?? 'stepped'
  form.starts_at = toLocalDatetime(p.starts_at)
  form.ends_at = toLocalDatetime(p.ends_at)
  form.is_active = p.is_active
  form.notes = p.notes ?? ''
  tiers.value = p.tiers.map(t => ({
    min_items: t.min_items,
    max_items: null,
    extra_discount_percent: t.extra_discount_percent,
    sort_order: t.sort_order,
  }))
}, { immediate: true })

function addTier() {
  if (form.tier_mode === 'min_floor') return
  const last = tiers.value[tiers.value.length - 1]
  const nextMin = last ? last.min_items + 3 : 2
  tiers.value.push({
    min_items: nextMin,
    max_items: null,
    extra_discount_percent: last ? Number(last.extra_discount_percent) + 5 : 10,
    sort_order: tiers.value.length,
  })
}

watch(() => form.tier_mode, (mode) => {
  if (mode === 'min_floor' && tiers.value.length !== 1) {
    const first = tiers.value[0] ?? {
      min_items: 2,
      max_items: null,
      extra_discount_percent: 10,
      sort_order: 0,
    }
    tiers.value = [{ ...first, max_items: null }]
  }
  if (mode === 'stepped') {
    tiers.value = tiers.value.map(t => ({ ...t, max_items: null }))
  }
})

function removeTier(index: number) {
  tiers.value.splice(index, 1)
}

async function handleSave() {
  saveError.value = ''
  saveOk.value = false
  if (!form.name.trim()) {
    saveError.value = 'กรุณากรอกชื่อโปรแกรม'
    return
  }

  saving.value = true
  try {
    await $fetch(`/api/admin/combo-programs/${id}`, {
      method: 'PATCH',
      body: {
        name: form.name.trim(),
        status: form.status,
        customer_segment: form.customer_segment,
        tier_mode: form.tier_mode,
        starts_at: toIsoOrNull(form.starts_at),
        ends_at: toIsoOrNull(form.ends_at),
        is_active: form.is_active,
        notes: form.notes,
        tiers: tiers.value.map(t => ({
          min_items: t.min_items,
          max_items: null,
          extra_discount_percent: t.extra_discount_percent,
          sort_order: t.sort_order,
        })),
      },
    })
    saveOk.value = true
    await refresh()
    setTimeout(() => { saveOk.value = false }, 2500)
  }
  catch (err: any) {
    saveError.value = err?.data?.message ?? 'บันทึกไม่สำเร็จ'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <NuxtLink
        to="/admin/combo-programs"
        class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
        กลับรายการ Combo
      </NuxtLink>
    </div>

    <div v-if="pending" class="py-20 text-center text-gray-400">กำลังโหลด...</div>

    <div v-else-if="fetchError || !program" class="rounded-xl border border-red-100 bg-red-50 p-6 text-red-600">
      {{ fetchError?.message ?? 'ไม่พบโปรแกรม' }}
    </div>

    <template v-else>
      <AdminPageHeader
        :title="program.name"
        :description="`${comboSegmentLabels[program.customer_segment]} · ${program.tiers.length} ชั้นส่วนลด`"
      >
        <template #actions>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="saving"
            @click="handleSave"
          >
            <Icon name="heroicons:check" class="h-4 w-4" />
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </template>
      </AdminPageHeader>

      <p v-if="saveOk" class="text-sm font-medium text-emerald-600">บันทึกแล้ว</p>
      <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

      <p class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-gray-600">
        <p>{{ comboCalculationNote }}</p>
        <p class="mt-1">{{ comboCalculationNoteWithAdvance }}</p>
      </p>

      <form class="max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" @submit.prevent="handleSave">
        <h2 class="text-sm font-semibold text-gray-900">ตั้งค่าโปรแกรม</h2>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">ชื่อโปรแกรม *</label>
          <input v-model="form.name" type="text" required :class="inputClass">
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">กลุ่มลูกค้า</label>
            <select v-model="form.customer_segment" :class="inputClass">
              <option value="new">ลูกค้าใหม่</option>
              <option value="existing">ลูกค้าเก่า</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">สถานะ</label>
            <select v-model="form.status" :class="inputClass">
              <option value="draft">แบบร่าง</option>
              <option value="published">เผยแพร่</option>
            </select>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">รูปแบบชั้นส่วนลด</label>
          <select v-model="form.tier_mode" :class="inputClass">
            <option value="min_floor">{{ comboTierModeLabels.min_floor }}</option>
            <option value="stepped">{{ comboTierModeLabels.stepped }}</option>
          </select>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300 text-red-600">
          เปิดใช้งาน
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">เริ่ม</label>
            <input v-model="form.starts_at" type="datetime-local" :class="inputClass">
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">สิ้นสุด</label>
            <input v-model="form.ends_at" type="datetime-local" :class="inputClass">
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">หมายเหตุภายใน</label>
          <textarea v-model="form.notes" rows="2" :class="inputClass" />
        </div>
      </form>

      <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">ชั้นส่วนลดตามจำนวนชิ้น</h2>
            <p class="text-xs text-gray-500">
              <template v-if="form.tier_mode === 'min_floor'">
                ตั้งแต่จำนวนชิ้นขั้นต่ำขึ้นไป — ได้ส่วนลดเดียวกันทุกจำนวน (ไม่จำกัดบน)
              </template>
              <template v-else>
                กำหนดขั้นตามจำนวนชิ้น — ระบบเลือกขั้นสูงสุดที่ลูกค้าถึง (เช่น 7 ชิ้นขึ้นไปได้ 20%)
              </template>
            </p>
          </div>
          <button
            v-if="form.tier_mode === 'stepped'"
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            @click="addTier"
          >
            <Icon name="heroicons:plus" class="h-4 w-4" />
            เพิ่มชั้น
          </button>
        </div>

        <div v-if="!tiers.length" class="py-8 text-center text-sm text-gray-500">
          ยังไม่มีชั้นส่วนลด — กดเพิ่มชั้น
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-sm">
            <thead>
              <tr class="border-b bg-gray-50/80 text-left text-xs font-semibold uppercase text-gray-500">
                <th class="px-3 py-2">จำนวนชิ้นขั้นต่ำ</th>
                <th class="px-3 py-2">ลดเพิ่ม (%)</th>
                <th class="px-3 py-2">สรุป</th>
                <th v-if="form.tier_mode === 'stepped'" class="w-12 px-3 py-2" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(tier, index) in tiers" :key="index">
                <td class="px-3 py-2">
                  <input
                    v-model.number="tier.min_items"
                    type="number"
                    min="1"
                    class="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  >
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="tier.extra_discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    class="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  >
                </td>
                <td class="px-3 py-2 text-gray-600">
                  {{ formatTierRange(tier.min_items, null, form.tier_mode) }}
                  → ลด {{ tier.extra_discount_percent }}%
                </td>
                <td v-if="form.tier_mode === 'stepped'" class="px-3 py-2 text-right">
                  <button
                    type="button"
                    class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    :disabled="tiers.length <= 1"
                    @click="removeTier(index)"
                  >
                    <Icon name="heroicons:trash" class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
