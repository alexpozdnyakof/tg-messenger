import { SendIcon } from 'lucide-react'
import { useReducer } from 'react'
import { Button } from '@/lib/ui/button'
import { Input } from '@/lib/ui/input'

type MessageFormProps = {
  onSend: (text: string) => Promise<void>
}

type FormState = {
  value: string
  error: string | undefined
  status: 'idle' | 'sending'
}

type FormAction =
  | { type: 'setValue'; value: string }
  | { type: 'sendStarted' }
  | { type: 'sendFailed'; error: string }
  | { type: 'sendSucceeded' }

const initialState: FormState = { value: '', error: undefined, status: 'idle' }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setValue':
      return { ...state, value: action.value, error: undefined }
    case 'sendStarted':
      return { ...state, status: 'sending', error: undefined }
    case 'sendFailed':
      return { ...state, status: 'idle', error: action.error }
    case 'sendSucceeded':
      return initialState
  }
}

function MessageForm({ onSend }: MessageFormProps) {
  const [{ value, error, status }, dispatch] = useReducer(
    formReducer,
    initialState,
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = value.trim()
    if (!text || status === 'sending') return

    dispatch({ type: 'sendStarted' })
    try {
      await onSend(text)
      dispatch({ type: 'sendSucceeded' })
    } catch (err) {
      dispatch({
        type: 'sendFailed',
        error:
          err instanceof Error ? err.message : 'Не удалось отправить сообщение',
      })
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-background">
      <form
        className="flex items-center gap-2 p-3"
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          name="message"
          placeholder="Написать сообщение…"
          autoComplete="off"
          className="h-9 flex-1"
          value={value}
          onChange={(event) =>
            dispatch({ type: 'setValue', value: event.target.value })
          }
          aria-invalid={Boolean(error)}
          disabled={status === 'sending'}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Отправить"
          disabled={status === 'sending' || value.trim().length === 0}
        >
          <SendIcon />
        </Button>
      </form>
      {error && <p className="px-3 pb-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default MessageForm
