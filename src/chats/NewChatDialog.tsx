import { useReducer, useState } from 'react'
import { checkAccount, type CheckAccountParams } from '@/api/greenApiClient'
import { useAuthStore } from '@/auth/authStore'
import { useChatsStore } from '@/chats/chatsStore'
import { Button } from '@/lib/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/lib/ui/dialog'
import { Input } from '@/lib/ui/input'
import { Label } from '@/lib/ui/label'

function parseIdentifier(
  rawValue: string,
): { params: CheckAccountParams; title: string } | { error: string } {
  const value = rawValue.trim()

  if (value.startsWith('@')) {
    if (value.length < 2) {
      return { error: 'Введите username после @' }
    }
    return { params: { username: value }, title: value }
  }

  const digitsOnly = value.replace(/[\s()-]/g, '').replace(/^\+/, '')
  if (!/^\d+$/.test(digitsOnly)) {
    return {
      error: 'Введите номер телефона (только цифры) или username, начинающийся с @',
    }
  }
  return { params: { phoneNumber: Number(digitsOnly) }, title: value }
}

type FormState = {
  value: string
  fieldError: string | undefined
  status: 'idle' | 'submitting'
}

type FormAction =
  | { type: 'setValue'; value: string }
  | { type: 'submitStarted' }
  | { type: 'submitFailed'; error: string }
  | { type: 'reset' }

const initialState: FormState = { value: '', fieldError: undefined, status: 'idle' }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setValue':
      return { ...state, value: action.value, fieldError: undefined }
    case 'submitStarted':
      return { ...state, status: 'submitting', fieldError: undefined }
    case 'submitFailed':
      return { ...state, status: 'idle', fieldError: action.error }
    case 'reset':
      return initialState
  }
}

function NewChatDialog() {
  const [open, setOpen] = useState(false)
  const [{ value, fieldError, status }, dispatch] = useReducer(
    formReducer,
    initialState,
  )
  const credentials = useAuthStore((state) => state.credentials)
  const addChat = useChatsStore((state) => state.addChat)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!credentials) return

    const parsed = parseIdentifier(value)
    if ('error' in parsed) {
      dispatch({ type: 'submitFailed', error: parsed.error })
      return
    }

    dispatch({ type: 'submitStarted' })
    const result = await checkAccount(credentials, parsed.params)

    if (!result.ok) {
      dispatch({
        type: 'submitFailed',
        error: 'Сервис GREEN-API недоступен, попробуйте позже',
      })
      return
    }
    if (!result.exist) {
      dispatch({
        type: 'submitFailed',
        error: 'Аккаунт не найден в Telegram',
      })
      return
    }

    addChat({ chatId: result.chatId, title: parsed.title })
    dispatch({ type: 'reset' })
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) dispatch({ type: 'reset' })
      }}
    >
      <DialogTrigger render={<Button />}>Добавить чат</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый чат</DialogTitle>
          <DialogDescription>
            Введите номер телефона получателя в международном формате или его
            username в Telegram, начиная с @.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier">Телефон или username</Label>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="off"
              placeholder="+79991234567 или @username"
              value={value}
              onChange={(event) =>
                dispatch({ type: 'setValue', value: event.target.value })
              }
              aria-invalid={Boolean(fieldError)}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Отмена
            </DialogClose>
            <Button type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Проверка…' : 'Начать чат'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewChatDialog
