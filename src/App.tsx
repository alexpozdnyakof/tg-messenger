import { Redirect, Route, Switch } from 'wouter'
import LoginPage from '@/pages/LoginPage'
import MessagesPage from '@/pages/MessagesPage'
import { useAuthStore } from '@/auth/authStore'

function App() {
  const credentials = useAuthStore((state) => state.credentials)

  return (
    <Switch>
      <Route path="/login">
        {credentials ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route path="/">{credentials ? <MessagesPage /> : <Redirect to="/login" />}</Route>
    </Switch>
  )
}

export default App
