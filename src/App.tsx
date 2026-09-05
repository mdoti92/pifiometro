import { Route, Routes } from 'react-router-dom'
import { LoginForm } from './auth/LoginForm'
import { RegisterForm } from './auth/RegisterForm'
import { RequireAuth } from './auth/RequireAuth'
import { GroupsHome } from './groups/GroupsHome'
import { GroupTournamentsPage } from './groups/GroupTournamentsPage'
import { MembersPage } from './groups/MembersPage'
import { NotificationPreferencesPage } from './notifications/NotificationPreferencesPage'
import { PredictionForm } from './predictions/PredictionForm'
import { MatchesAdminPage } from './tournaments/MatchesAdminPage'
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
      <Route
        path="/preferences/notifications"
        element={
          <RequireAuth>
            <NotificationPreferencesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/tournaments/:tournamentId/matches"
        element={
          <RequireAuth>
            <MatchesAdminPage />
          </RequireAuth>
        }
      />
      <Route
        path="/groups/:groupId/matches/:matchId/predict"
        element={
          <RequireAuth>
            <PredictionForm />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
