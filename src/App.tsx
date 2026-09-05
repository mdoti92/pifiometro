import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { LoginForm } from './auth/LoginForm'
import { RegisterForm } from './auth/RegisterForm'
import { RequireAuth } from './auth/RequireAuth'
import { GroupsHome } from './groups/GroupsHome'
import { GroupTournamentsPage } from './groups/GroupTournamentsPage'
import { MembersPage } from './groups/MembersPage'
import { AppShell } from './nav/AppShell'
import { NotificationPreferencesPage } from './notifications/NotificationPreferencesPage'
import { HistoryPage } from './predictions/HistoryPage'
import { MyPredictionsPage } from './predictions/MyPredictionsPage'
import { PredictionForm } from './predictions/PredictionForm'
import { ProfilePage } from './profile/ProfilePage'
import { MatchdaySummaryPage } from './standings/MatchdaySummaryPage'
import { StageStandingsPage } from './standings/StageStandingsPage'
import { StandingsPage } from './standings/StandingsPage'
import { MatchesAdminPage } from './tournaments/MatchesAdminPage'
import { TournamentAdminPage } from './tournaments/TournamentAdminPage'

function Authenticated({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/"
        element={
          <Authenticated>
            <GroupsHome />
          </Authenticated>
        }
      />
      <Route
        path="/profile"
        element={
          <Authenticated>
            <ProfilePage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/members"
        element={
          <Authenticated>
            <MembersPage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/tournaments"
        element={
          <Authenticated>
            <GroupTournamentsPage />
          </Authenticated>
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          <Authenticated>
            <TournamentAdminPage />
          </Authenticated>
        }
      />
      <Route
        path="/preferences/notifications"
        element={
          <Authenticated>
            <NotificationPreferencesPage />
          </Authenticated>
        }
      />
      <Route
        path="/admin/tournaments/:tournamentId/matches"
        element={
          <Authenticated>
            <MatchesAdminPage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/matches/:matchId/predict"
        element={
          <Authenticated>
            <PredictionForm />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/stages/:stageId/predictions"
        element={
          <Authenticated>
            <MyPredictionsPage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/tournaments/:tournamentId/standings"
        element={
          <Authenticated>
            <StandingsPage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/stages/:stageId/standings"
        element={
          <Authenticated>
            <StageStandingsPage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/tournaments/:tournamentId/history"
        element={
          <Authenticated>
            <HistoryPage />
          </Authenticated>
        }
      />
      <Route
        path="/groups/:groupId/tournaments/:tournamentId/matchday-summary"
        element={
          <Authenticated>
            <MatchdaySummaryPage />
          </Authenticated>
        }
      />
    </Routes>
  )
}

export default App
