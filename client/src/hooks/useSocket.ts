import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../stores/gameStore';

export function useSocket() {
  const store = useGameStore();

  useEffect(() => {
    socket.connect();

    socket.on('room-created', (data) => {
      store.setRoomCode(data.roomCode);
      store.setMyPlayerId(data.playerId);
      store.setPlayers(data.players);
      sessionStorage.setItem('roomCode', data.roomCode);
      sessionStorage.setItem('playerId', data.playerId);
    });

    socket.on('room-joined', (data) => {
      store.setRoomCode(data.roomCode);
      store.setMyPlayerId(data.playerId);
      store.setPlayers(data.players);
      sessionStorage.setItem('roomCode', data.roomCode);
      sessionStorage.setItem('playerId', data.playerId);
    });

    socket.on('player-joined', (data) => {
      store.setPlayers(data.players);
    });

    socket.on('player-updated', (data) => {
      store.setPlayers(data.players);
      // Update my role from players list
      const me = data.players.find((p: any) => p.id === useGameStore.getState().myPlayerId);
      if (me) store.setMyRole(me.role);
    });

    socket.on('phase-change', (data) => {
      store.setPhase(data.phase);
      if (data.timer) {
        store.setTimer(data.timer);
        store.setTimerMax(data.timer);
      }
      if (data.currentTurn !== undefined) {
        store.setCurrentTurn(data.currentTurn);
      }
    });

    socket.on('game-start', (data) => {
      store.setCaseInfo(data.caseInfo);
      store.setJurors(data.jurors);
      store.setPlayers(data.players);
      if (data.caseInfo.myEvidence) {
        store.setMyEvidence(data.caseInfo.myEvidence);
      }
    });

    socket.on('chat-message', (msg) => {
      store.addChatMessage(msg);
    });

    socket.on('juror-update', (data) => {
      store.setJurors(data.jurors);
    });

    socket.on('chain-reaction', (data) => {
      store.setJurors(data.jurors);
    });

    socket.on('evidence-submitted', (data) => {
      store.addPublicEvidence(data.evidence);
    });

    socket.on('witness-summoned', (data) => {
      store.setWitnessOnStand(data.witness);
      store.setWitnessChat([]);
    });

    socket.on('witness-question', (data) => {
      store.addWitnessChat(data);
    });

    socket.on('witness-answer', (data) => {
      store.addWitnessChat({ role: 'witness', content: data.content });
    });

    socket.on('witness-dismissed', () => {
      store.setWitnessOnStand(null);
    });

    socket.on('turn-change', (data) => {
      store.setCurrentTurn(data.currentTurn);
      store.setTurnNumber(data.turnNumber);
    });

    socket.on('objection-raised', (data) => {
      // Handled by ObjectionOverlay component
    });

    socket.on('objection-ruled', (data) => {
      if (data.side) {
        store.setObjectionsRemaining({
          ...useGameStore.getState().objectionsRemaining,
        });
      }
    });

    socket.on('persuasion-result', (data) => {
      store.setJurors(data.jurors);
    });

    socket.on('verdict-reveal', (data) => {
      store.addVerdictReveal({ ...data, revealed: true });
    });

    socket.on('verdict-result', (data) => {
      store.setWinner(data.winner);
    });

    socket.on('truth-reveal', (data) => {
      store.setTruth({
        guilty: data.truth === 'guilty',
        reason: data.truthReason,
      });
    });

    socket.on('rejoin-success', (data) => {
      store.setRoomCode(data.roomCode);
      store.setMyPlayerId(data.playerId);
      store.setMyRole(data.myRole);
      store.setPhase(data.phase);
      if (data.caseInfo) store.setCaseInfo(data.caseInfo);
      if (data.caseInfo?.myEvidence) store.setMyEvidence(data.caseInfo.myEvidence);
      store.setJurors(data.jurors);
      store.setPlayers(data.players);
      store.setPublicEvidence(data.publicEvidence);
      store.setChatMessages(data.chatMessages);
      store.setCurrentTurn(data.currentTurn);
      store.setTurnNumber(data.turnNumber);
      store.setObjectionsRemaining(data.objectionsRemaining);
      if (data.timer) store.setTimer(data.timer);
    });

    socket.on('error', (data) => {
      console.error('Server error:', data.message);
    });

    // Try rejoin on connect
    socket.on('connect', () => {
      const roomCode = sessionStorage.getItem('roomCode');
      const playerId = sessionStorage.getItem('playerId');
      if (roomCode && playerId && !useGameStore.getState().roomCode) {
        socket.emit('rejoin-room', { roomCode, playerId });
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);
}
