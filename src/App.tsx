import { Redirect, Route, Switch } from 'wouter'
import LoginPage from '@/pages/LoginPage'
import MessagesPage from '@/pages/MessagesPage'
import { useAuthStore } from '@/auth/authStore'
import { useChatsStore } from '@/chats/chatsStore'

function App() {
  const credentials = useAuthStore((state) => state.credentials)
  const chats = useChatsStore((state) => state.chats)

  return (
    <Switch>
      <Route path="/login">
        {credentials ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route path="/">
        {!credentials ? (
          <Redirect to="/login" />
        ) : chats.length > 0 ? (
          <Redirect to={`/${chats[0].chatId}`} />
        ) : (
          <MessagesPage />
        )}
      </Route>
      <Route path="/:chatId">
        {(params) =>
          credentials ? (
            <MessagesPage chatId={params.chatId} />
          ) : (
            <Redirect to="/login" />
          )
        }
      </Route>
    </Switch>
  )
}

export default App
