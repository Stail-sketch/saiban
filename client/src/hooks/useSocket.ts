import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../stores/gameStore';

export function useSocket() {
  useEffect(() => {
    socket.connect();
    const s = useGameStore.getState;

    socket.on('room-created', (data) => {
      s().setRoomCode(data.roomCode);
      s().setMyPlayerId(data.playerId);
      s().setPlayers(data.players);
      sessionStorage.setItem('roomCode', data.roomCode);
      sessionStorage.setItem('playerId', data.playerId);
    });

    socket.on('room-joined', (data) => {
      s().setRoomCode(data.roomCode);
      s().setMyPlayerId(data.playerId);
      s().setPlayers(data.players);
      sessionStorage.setItem('roomCode', data.roomCode);
      sessionStorage.setItem('playerId', data.playerId);
    });

    socket.on('player-joined', (data) => s().setPlayers(data.players));
    socket.on('player-updated', (data) => {
      s().setPlayers(data.players);
      const me = data.players.find((p: any) => p.id === s().myPlayerId);
      if (me) s().setMyRole(me.role);
    });

    socket.on('phase-change', (data) => {
      s().setPhase(data.phase);
      if (data.timer) { s().setTimer(data.timer); s().setTimerMax(data.timer); }
      if (data.currentTurn !== undefined) s().setCurrentTurn(data.currentTurn);
      if (data.hp) s().setHp(data.hp);
      // Reset testimony on new phase
      if (data.phase === 'witness_testimony') {
        s().setTestimonyStatements([]);
      }
    });

    socket.on('game-start', (data) => {
      s().setCaseInfo(data.caseInfo);
      s().setJurors(data.jurors);
      s().setPlayers(data.players);
      if (data.hp) s().setHp(data.hp);
      if (data.caseInfo.myEvidence) s().setMyEvidence(data.caseInfo.myEvidence);
    });

    socket.on('chat-message', (msg) => s().addChatMessage(msg));
    socket.on('juror-update', (data) => s().setJurors(data.jurors));
    socket.on('chain-reaction', (data) => s().setJurors(data.jurors));
    socket.on('evidence-submitted', (data) => s().addPublicEvidence(data.evidence));

    socket.on('turn-change', (data) => {
      s().setCurrentTurn(data.currentTurn);
      s().setTurnNumber(data.turnNumber);
      if (data.hp) s().setHp(data.hp);
    });

    socket.on('hp-change', (data) => {
      s().updateHp(data.role, data.hp);
    });

    // Testimony events
    socket.on('testimony-statement', (data) => {
      s().setCurrentWitnessName(data.witnessName);
      s().addTestimonyStatement(data.statement);
    });

    socket.on('testimony-press', (data) => {
      s().updateTestimonyStatement(data.statementIndex, { pressed: true });
    });

    socket.on('testimony-break', (data) => {
      if (data.success) {
        s().updateTestimonyStatement(data.statementIndex, { broken: true });
      }
    });

    // Verdict events
    socket.on('verdict-reveal', (data) => s().addVerdictReveal({ ...data, revealed: true }));
    socket.on('verdict-result', (data) => s().setWinner(data.winner));
    socket.on('truth-reveal', (data) => {
      s().setTruth({ guilty: data.truth === 'guilty', reason: data.truthReason });
    });

    // Objection events
    socket.on('objection-ruled', (data) => {
      if (data.bluffCaught && data.evidenceId) {
        s().removePublicEvidence(data.evidenceId);
      }
    });

    socket.on('rejoin-success', (data) => {
      s().setRoomCode(data.roomCode);
      s().setMyPlayerId(data.playerId);
      s().setMyRole(data.myRole);
      s().setPhase(data.phase);
      if (data.caseInfo) s().setCaseInfo(data.caseInfo);
      if (data.caseInfo?.myEvidence) s().setMyEvidence(data.caseInfo.myEvidence);
      s().setJurors(data.jurors);
      s().setPlayers(data.players);
      s().setPublicEvidence(data.publicEvidence);
      s().setChatMessages(data.chatMessages);
      s().setCurrentTurn(data.currentTurn);
      s().setTurnNumber(data.turnNumber);
      s().setObjectionsRemaining(data.objectionsRemaining);
      if (data.timer) s().setTimer(data.timer);
      if (data.hp) s().setHp(data.hp);
    });

    socket.on('error', (data) => console.error('Server error:', data.message));

    socket.on('connect', () => {
      const roomCode = sessionStorage.getItem('roomCode');
      const playerId = sessionStorage.getItem('playerId');
      if (roomCode && playerId && !s().roomCode) {
        socket.emit('rejoin-room', { roomCode, playerId });
      }
    });

    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);
}
