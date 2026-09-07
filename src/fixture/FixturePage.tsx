import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listGroupTournaments, type GroupTournament } from '../groups/groupTournamentsService'
import { TeamBadge } from '../teams/TeamBadge'
import { formatFixtureResult } from './formatFixtureResult'
import { listTournamentFixture, type FixtureMatch } from './fixtureService'
import { groupMatchesByMatchday } from './groupMatchesByMatchday'

export function FixturePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [activeTournaments, setActiveTournaments] = useState<GroupTournament[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null)
  const [fixture, setFixture] = useState<FixtureMatch[]>([])

  useEffect(() => {
    if (!groupId) return

    listGroupTournaments(groupId).then((groupTournaments) => {
      const active = groupTournaments.filter((tournament) => tournament.active)
      setActiveTournaments(active)
      setSelectedTournamentId((current) => current ?? active[0]?.tournamentId ?? null)
    })
  }, [groupId])

  useEffect(() => {
    if (!selectedTournamentId) return

    listTournamentFixture(selectedTournamentId).then(setFixture)
  }, [selectedTournamentId])

  const matchdayGroups = selectedTournamentId ? groupMatchesByMatchday(fixture) : []

  return (
    <div>
      <h1>Fixture</h1>

      {activeTournaments.length > 1 && (
        <label>
          Torneo:{' '}
          <select
            aria-label="Torneo"
            value={selectedTournamentId ?? ''}
            onChange={(event) => setSelectedTournamentId(event.target.value)}
          >
            {activeTournaments.map((tournament) => (
              <option key={tournament.tournamentId} value={tournament.tournamentId}>
                {tournament.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {activeTournaments.length === 0 && <p>Tu grupo no sigue ningún torneo activo todavía</p>}

      {matchdayGroups.map((group) => (
        <section key={group.matchday ?? 'sin-fecha'}>
          <h2 className="font-display">
            {group.matchday !== null ? `Fecha ${group.matchday}` : 'Sin fecha asignada'}
          </h2>
          <ul>
            {group.matches.map((match) => (
              <li key={match.id}>
                <TeamBadge name={match.homeTeam} slug={match.homeTeamSlug} /> {match.homeTeam} vs{' '}
                {match.awayTeam} <TeamBadge name={match.awayTeam} slug={match.awayTeamSlug} /> —{' '}
                {formatFixtureResult(match)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
