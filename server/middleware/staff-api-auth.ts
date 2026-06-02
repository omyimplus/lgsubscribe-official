import { enforceStaffApiAuth } from '~~/server/utils/staffAuth'

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') return
  await enforceStaffApiAuth(event)
})
