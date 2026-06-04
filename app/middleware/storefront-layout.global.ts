/** หน้าร้านใช้ layout default (header + footer + hero) — ยกเว้น admin */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/admin')) return
  const layout = to.meta.layout as string | undefined
  if (layout === 'admin' || layout === 'empty') return
  setPageLayout('default')
})
