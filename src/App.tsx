import { Route, Routes } from 'react-router-dom'
import { LoginForm } from './auth/LoginForm'
import { RegisterForm } from './auth/RegisterForm'
import { RequireAuth } from './auth/RequireAuth'
import { CreateGroupForm } from './groups/CreateGroupForm'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <CreateGroupForm />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
