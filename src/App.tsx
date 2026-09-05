import { Route, Routes } from 'react-router-dom'
import { LoginForm } from './auth/LoginForm'
import { RegisterForm } from './auth/RegisterForm'
import { RequireAuth } from './auth/RequireAuth'
import { GroupsHome } from './groups/GroupsHome'
import { GroupTournamentsPage } from './groups/GroupTournamentsPage'
import { MembersPage } from './groups/MembersPage'
import { TournamentAdminPage } from './tournaments/TournamentAdminPage'

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
      <Route
        path="/groups/:groupId/tournaments"
        element={
          <RequireAuth>
            <GroupTournamentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          <RequireAuth>
            <TournamentAdminPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
