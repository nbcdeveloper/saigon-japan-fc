// マルチテナント対応ヘルパー
// team_idを自動でフィルターに追加する

import { supabase } from './supabase'

// team_idを取得
export const getTeamId = () => {
  return window.__teamId || null
}

// team_idフィルター付きクエリ
export const teamQuery = (table) => {
  const teamId = getTeamId()
  if (!teamId) return supabase.from(table).select('*').eq('id', 'none') // データなし
  return supabase.from(table).select('*').eq('team_id', teamId)
}

// team_idを含むinsert
export const teamInsert = (table, data) => {
  const teamId = getTeamId()
  if (!teamId) return Promise.reject(new Error('team_id not found'))
  return supabase.from(table).insert({ ...data, team_id: teamId })
}

// profileを取得
export const getProfile = () => {
  return window.__profile || null
}
