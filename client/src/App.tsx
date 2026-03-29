import { useSocket } from './hooks/useSocket';
import { useGameStore } from './stores/gameStore';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { CaseLoading } from './components/phases/CaseLoading';
import { IntroScreen } from './components/phases/IntroScreen';
import { InvestigationScreen } from './components/phases/InvestigationScreen';
import { CourtScreen } from './components/phases/CourtScreen';
import { ResultScreen } from './components/phases/ResultScreen';

export default function App() {
  useSocket();
  const phase = useGameStore(s => s.phase);

  switch (phase) {
    case 'lobby': return <LobbyScreen />;
    case 'generating': return <CaseLoading />;
    case 'intro': return <IntroScreen />;
    case 'investigation': return <InvestigationScreen />;
    case 'court_ready':
    case 'testimony':
    case 'cross_exam':
    case 'objection_moment':
    case 'breakdown':
    case 'verdict':
      return <CourtScreen />;
    case 'result': return <ResultScreen />;
    default: return <LobbyScreen />;
  }
}
