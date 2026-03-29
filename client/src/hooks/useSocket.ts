import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../stores/gameStore';

export function useSocket() {
  useEffect(() => {
    socket.connect();
    const s = useGameStore.getState;

    socket.on('room-created', (d) => {
      s().setRoomCode(d.roomCode); s().setMyPlayerId(d.playerId);
      sessionStorage.setItem('roomCode', d.roomCode);
      sessionStorage.setItem('playerId', d.playerId);
    });
    socket.on('room-joined', (d) => {
      s().setRoomCode(d.roomCode); s().setMyPlayerId(d.playerId);
      sessionStorage.setItem('roomCode', d.roomCode);
      sessionStorage.setItem('playerId', d.playerId);
    });

    socket.on('phase-change', (d) => {
      s().setPhase(d.phase);
      if (d.hp !== undefined) s().setHp(d.hp);
      if (d.maxHp !== undefined) s().setMaxHp(d.maxHp);
    });

    socket.on('game-start', (d) => {
      s().setCaseTitle(d.caseTitle);
      s().setSummary(d.summary);
      s().setDefendant(d.defendant);
      s().setVictim(d.victim);
      s().setProsecutor(d.prosecutor);
      s().setEvidence(d.evidence);
      s().setHp(d.hp); s().setMaxHp(d.maxHp);
    });

    socket.on('dialogue', (d) => s().addDialogue(d));
    socket.on('intro-complete', () => {});

    // Investigation
    socket.on('investigation-data', (d) => s().setLocations(d.locations));
    socket.on('investigation-location', (d) => s().setCurrentLocation(d));
    socket.on('talk-dialogue', (d) => {
      for (const line of d.dialogue) {
        s().addDialogue({ id: crypto.randomUUID(), speaker: d.personName, speakerType: 'witness', content: line, timestamp: Date.now() });
      }
    });
    socket.on('evidence-found', (d) => {
      s().addEvidence(d.evidence);
      s().addDialogue({ id: crypto.randomUUID(), speaker: 'システム', speakerType: 'system', content: `${d.findDescription}\n証拠「${d.evidence.name}」を手に入れた！`, timestamp: Date.now() });
    });
    socket.on('evidence-list', (d) => s().setEvidence(d.evidence));

    // Court
    socket.on('court-ready', (d) => {
      s().setCurrentWitnessName(d.witnessName);
      if (d.witnessAppearance) s().setCurrentWitnessAppearance(d.witnessAppearance);
    });
    socket.on('testimony-title', (d) => {
      s().setCurrentWitnessName(d.witnessName);
      s().setCurrentWitnessAppearance(d.witnessAppearance);
      s().setTestimonyStatements([]);
      s().clearDialogue();
    });
    socket.on('testimony-statement', (d) => {
      s().addDialogue({ id: crypto.randomUUID(), speaker: d.witnessName, speakerType: 'witness', content: d.statement.text, timestamp: Date.now() });
    });
    socket.on('cross-exam-start', (d) => {
      s().setTestimonyStatements(d.statements);
      s().setPhase('cross_exam');
    });
    socket.on('press-dialogue', (d) => {
      s().updateStatement(d.statementIndex, { pressed: true });
      for (let i = 0; i < d.dialogue.length; i++) {
        const speaker = i % 2 === 0 ? d.witnessName : s().playerName || '弁護士';
        const type = i % 2 === 0 ? 'witness' : 'defense';
        s().addDialogue({ id: crypto.randomUUID(), speaker, speakerType: type as any, content: d.dialogue[i], timestamp: Date.now() + i });
      }
    });

    socket.on('objection-success', (d) => {
      s().updateStatement(d.statementIndex, { broken: true });
      s().setPhase('objection_moment');
      s().addDialogue({ id: crypto.randomUUID(), speaker: 'システム', speakerType: 'system', content: d.explanation, timestamp: Date.now() });
    });
    socket.on('objection-fail', (d) => {
      s().setHp(d.hp);
    });
    socket.on('witness-breakdown', (d) => {
      s().setPhase('breakdown');
      for (const line of d.dialogue) {
        s().addDialogue({ id: crypto.randomUUID(), speaker: d.witnessName, speakerType: 'witness', content: line, timestamp: Date.now(), emotion: 'breakdown' });
      }
    });
    socket.on('verdict-result', (d) => {
      s().setVerdict(d.verdict);
    });
    socket.on('game-over', () => {
      s().setVerdict('guilty');
    });

    socket.on('error', (d) => console.error('Server:', d.message));
    socket.on('connect', () => {
      const rc = sessionStorage.getItem('roomCode');
      const pi = sessionStorage.getItem('playerId');
      if (rc && pi && !s().roomCode) socket.emit('rejoin-room', { roomCode: rc, playerId: pi });
    });

    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);
}
