const GREEN_API_URL = import.meta.env.VITE_GREEN_API_URL

if (!GREEN_API_URL) {
  throw new Error(
    'VITE_GREEN_API_URL is not set. Copy .env.example to .env and fill in your GREEN-API instance host.',
  )
}

export type GreenApiCredentials = {
  idInstance: string
  apiTokenInstance: string
}

export type StateInstance =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'suspended'
  | 'starting'
  | 'pendingPassword'

export type GreenApiAuthError =
  | { type: 'invalidIdInstance' }
  | { type: 'invalidApiTokenInstance' }
  | { type: 'serviceUnavailable' }

export type GetStateInstanceResult =
  | { ok: true; state: StateInstance }
  | { ok: false; error: GreenApiAuthError }

export async function getStateInstance(
  credentials: GreenApiCredentials,
): Promise<GetStateInstanceResult> {
  const { idInstance, apiTokenInstance } = credentials
  const url = `${GREEN_API_URL}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    return { ok: false, error: { type: 'serviceUnavailable' } }
  }

  if (response.status === 401) {
    return { ok: false, error: { type: 'invalidApiTokenInstance' } }
  }
  if (response.status === 403) {
    return { ok: false, error: { type: 'invalidIdInstance' } }
  }
  if (!response.ok) {
    return { ok: false, error: { type: 'serviceUnavailable' } }
  }

  const body = (await response.json()) as { stateInstance: StateInstance }
  return { ok: true, state: body.stateInstance }
}

export type CheckAccountParams = { phoneNumber: number } | { username: string }

export type CheckAccountResult =
  | { ok: true; exist: true; chatId: string }
  | { ok: true; exist: false }
  | { ok: false; error: 'serviceUnavailable' }

export async function checkAccount(
  credentials: GreenApiCredentials,
  params: CheckAccountParams,
): Promise<CheckAccountResult> {
  const { idInstance, apiTokenInstance } = credentials
  const url = `${GREEN_API_URL}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch {
    return { ok: false, error: 'serviceUnavailable' }
  }

  if (!response.ok) {
    return { ok: false, error: 'serviceUnavailable' }
  }

  const body = (await response.json()) as { exist: boolean; chatId?: string }
  if (!body.exist || !body.chatId) {
    return { ok: true, exist: false }
  }
  return { ok: true, exist: true, chatId: body.chatId }
}
