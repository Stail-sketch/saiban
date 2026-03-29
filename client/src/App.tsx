import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './stores/gameStore';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { CaseLoading } from './components/phases/CaseLoading';
import { OpeningStatement } from './components/phases/OpeningStatement';
import { ClosingArgument } from './components/phases/ClosingArgument';
import { VerdictReveal } from './components/phases/VerdictReveal';
import { TruthReveal } from './components/phases/TruthReveal';
import { ResultScreen } from './components/phases/ResultScreen';
import { JurorPanel } from './components/jurors/JurorPanel';
import { ChatArea } from './components/court/ChatArea';
import { EvidenceBoard } from './components/court/EvidenceBoard';
import { ActionBar } from './components/court/ActionBar';
import { PhaseTimer } from './components/court/PhaseTimer';
import { WitnessExam } from './components/phases/WitnessExam';
import { EvidenceSubmitModal, WitnessSummonModal } from './components/phases/EvidencePhase';
import { JurorPersuasionModal } from './components/phases/JurorPersuasion';
import { ObjectionOverlay } from './components/objection/ObjectionOverlay';
import { ObjectionForm } from './components/objection/ObjectionForm';
import { ObjectionRuling } from './components/objection/ObjectionRuling';

export default function App() {
  useSocket();
  const phase = useGameStore(s => s.phase);
  const witnessOnStand = useGameStore(s => s.witnessOnStand);
  const [modal, setModal] = useState<string | null>(null);
  const [showObjectionForm, setShowObjectionForm] = useState(false);

  // Lobby
  if (phase === 'lobby') return <LobbyScreen />;

  // Loading
  if (phase === 'generating') return <CaseLoading />;

  // Result
  if (phase === 'result') return <ResultScreen />;

  // Full-screen phases
  if (phase === 'verdict') {
    return (
      <>
        <VerdictReveal />
        <ObjectionOverlay />
      </>
    );
  }
  if (phase === 'truth') {
    return <TruthReveal />;
  }

  // Main court layout for opening, evidence, closing
  const renderMainContent = () => {
    if (phase === 'opening_prosecution' || phase === 'opening_defense') {
      return <OpeningStatement />;
    }
    if (phase === 'closing_prosecution' || phase === 'closing_defense') {
      return <ClosingArgument />;
    }
    if (phase === 'evidence') {
      if (witnessOnStand) {
        return <WitnessExam />;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatArea />
          </div>
          <EvidenceBoard />
          <ActionBar onAction={(action) => {
            if (action === 'evidence') setModal('evidence');
            else if (action === 'witness') setModal('witness');
            else if (action === 'persuade') setModal('persuade');
            else if (action === 'objection') setShowObjectionForm(true);
          }} />
        </div>
      );
    }
    return <ChatArea />;
  };

  return (
    <div style={styles.courtLayout}>
      <div style={styles.topBar}>
        <PhaseTimer />
      </div>
      <div style={styles.mainArea}>
        <div style={styles.leftPanel}>
          {renderMainContent()}
        </div>
        <div style={styles.rightPanel}>
          <JurorPanel />
        </div>
      </div>

      {/* Modals */}
      {modal === 'evidence' && <EvidenceSubmitModal onClose={() => setModal(null)} />}
      {modal === 'witness' && <WitnessSummonModal onClose={() => setModal(null)} />}
      {modal === 'persuade' && <JurorPersuasionModal onClose={() => setModal(null)} />}
      {showObjectionForm && <ObjectionForm onClose={() => setShowObjectionForm(false)} />}

      {/* Global overlays */}
      <ObjectionOverlay />
      <ObjectionRuling />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  courtLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg-primary)',
    overflow: 'hidden',
  },
  topBar: {
    padding: '8px 16px',
    borderBottom: '1px solid var(--border)',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    gap: 12,
    padding: 12,
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  rightPanel: {
    width: 300,
    flexShrink: 0,
    overflowY: 'auto',
  },
};
