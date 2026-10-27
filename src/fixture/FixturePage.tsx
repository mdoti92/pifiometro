import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listGroupTournaments, type GroupTournament } from '../groups/groupTournamentsService'
import { MatchCard } from '../matches/MatchCard'
import { findCurrentMatchday } from './findCurrentMatchday'
import { formatFixtureResult } from './formatFixtureResult'
import { listTournamentFixture, type FixtureMatch } from './fixtureService'
import { groupMatchesByMatchday } from './groupMatchesByMatchday'
import { matchdaySectionId, scrollToMatchday, useScrollToMatchdayOnLoad } from './useScrollToMatchday'

// Un postergado no traba la fecha: se reprograma más adelante.
function isMatchPending(match: FixtureMatch): boolean {
  return match.status === 'scheduled'
}

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
  const currentMatchday = findCurrentMatchday(matchdayGroups, isMatchPending)
  useScrollToMatchdayOnLoad(currentMatchday, selectedTournamentId ?? undefined)

  function goToCurrentMatchday() {
    if (currentMatchday !== null) scrollToMatchday(currentMatchday)
  }

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

      {currentMatchday !== null && (
        <button type="button" onClick={goToCurrentMatchday}>
          Ir a la fecha actual
        </button>
      )}

      {matchdayGroups.map((group) => (
        <section key={group.matchday ?? 'sin-fecha'} id={matchdaySectionId(group.matchday)}>
          <h2 className="font-display">
            {group.matchday !== null ? `Fecha ${group.matchday}` : 'Sin fecha asignada'}
          </h2>
          <ul className="matchday-grid">
            {group.matches.map((match) => (
              <MatchCard
                key={match.id}
                homeTeam={match.homeTeam}
                homeTeamSlug={match.homeTeamSlug}
                awayTeam={match.awayTeam}
                awayTeamSlug={match.awayTeamSlug}
                center={formatFixtureResult(match)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
