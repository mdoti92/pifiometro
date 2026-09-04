import { Route, Routes } from 'react-router-dom'
import { LoginForm } from './auth/LoginForm'
import { RegisterForm } from './auth/RegisterForm'
import { RequireAuth } from './auth/RequireAuth'
import { GroupsHome } from './groups/GroupsHome'
import { MembersPage } from './groups/MembersPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <GroupsHome />
          </RequireAuth>
        }
      />
      <Route
        path="/groups/:groupId/members"
        element={
          <RequireAuth>
            <MembersPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
