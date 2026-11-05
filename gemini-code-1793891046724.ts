import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Gender, PartyState, Player } from '@/lib/types';
import { addPoint, createHistoryEntry, emptyState, loadState, makeId, saveState } from '@/lib/store';

interface PartyContextValue {
  state: PartyState;
  addPlayer: (name: string, gender: Gender) => { ok: boolean; error?: string };
  addPlayers: (entries: Array<{ name: string; gender: Gender }>) => void;
  removePlayer: (id: string) => void;
  addTitle: (id: string, title: string) => void;
  removeTitle: (id: string, title: string) => void;
  award: (names: string[], amount: number, gameId: string, gameTitle: string, text: string) => void;
  log: (gameId: string, gameTitle: string, text: string) => void;
  resetScores: () => void;
  resetAll: () => void;
}

const PartyContext = createContext<PartyContextValue | null>(null);

export function PartyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PartyState>(() => loadState());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  const addPlayer = useCallback((rawName: string, gender: Gender) => {
    const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (name.length < 2) return { ok: false, error: 'الاسم لازم يكون حرفين على الأقل' };
    if (stateRef.current.players.some(p => p.name === name)) {
      return { ok: false, error: 'الاسم ده موجود بالفعل في الشلة' };
    }
    const player: Player = { id: makeId(), name, gender, titles: [] };
    setState(prev => {
      if (prev.players.some(p => p.name === name)) return prev;
      return { ...prev, players: [...prev.players, player] };
    });
    return { ok: true };
  }, []);

  const addPlayers = useCallback((entries: Array<{ name: string; gender: Gender }>) => {
    setState(prev => {
      const next = [...prev.players];
      entries.forEach(entry => {
        const name = entry.name.trim().slice(0, 24);
        if (!name || next.some(p => p.name === name)) return;
        next.push({ id: makeId(), name, gender: entry.gender, titles: [] });
      });
      return { ...prev, players: next };
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      const scores = { ...prev.scores };
      delete scores[player.name];
      return { ...prev, players: prev.players.filter(p => p.id !== id), scores };
    });
  }, []);

  const addTitle = useCallback((id: string, title: string) => {
    const clean = title.trim().slice(0, 28);
    if (!clean) return;
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === id && !p.titles.includes(clean) ? { ...p, titles: [...p.titles, clean].slice(-4) } : p,
      ),
    }));
  }, []);

  const removeTitle = useCallback((id: string, title: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === id ? { ...p, titles: p.titles.filter(t => t !== title) } : p)),
    }));
  }, []);

  const award = useCallback(
    (names: string[], amount: number, gameId: string, gameTitle: string, text: string) => {
      setState(prev => {
        let scores = { ...prev.scores };
        names.forEach(name => {
          scores = addPoint(scores, name, amount);
        });
        const entry = createHistoryEntry(gameId, gameTitle, text);
        return { ...prev, scores, history: [...prev.history, entry].slice(-50) };
      });
    },
    [],
  );

  const log = useCallback((gameId: string, gameTitle: string, text: string) => {
    setState(prev => ({
      ...prev,
      history: [...prev.history, createHistoryEntry(gameId, gameTitle, text)].slice(-50),
    }));
  }, []);

  const resetScores = useCallback(() => setState(prev => ({ ...prev, scores: {}, history: [] })), []);
  const resetAll = useCallback(() => setState({ ...emptyState, players: [] }), []);

  const value = useMemo(
    () => ({ state, addPlayer, addPlayers, removePlayer, addTitle, removeTitle, award, log, resetScores, resetAll }),
    [state, addPlayer, addPlayers, removePlayer, addTitle, removeTitle, award, log, resetScores, resetAll],
  );

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>;
}

export function useParty() {
  const ctx = useContext(PartyContext);
  if (!ctx) throw new Error('useParty must be used inside PartyProvider');
  return ctx;
}

export function useCountdown(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (deadline.current === null) return;
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setRunning(false);
    };
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(
    (seconds?: number) => {
      const value = seconds ?? totalSeconds;
      setRemaining(value);
      deadline.current = Date.now() + value * 1000;
      setRunning(true);
    },
    [totalSeconds],
  );

  const stop = useCallback(() => {
    setRunning(false);
    deadline.current = null;
  }, []);

  const reset = useCallback(
    (seconds?: number) => {
      setRunning(false);
      deadline.current = null;
      setRemaining(seconds ?? totalSeconds);
    },
    [totalSeconds],
  );

  return { remaining, running, start, stop, reset, finished: remaining === 0 };
}

export function useDrawBag<T>(source: T[]) {
  const bagRef = useRef<{ items: T[]; source: T[] }>({ items: [], source });
  bagRef.current.source = source;

  const draw = useCallback(() => {
    const bag = bagRef.current;
    if (bag.items.length === 0) {
      bag.items = [...bag.source];
      for (let i = bag.items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag.items[i], bag.items[j]] = [bag.items[j], bag.items[i]];
      }
    }
    return bag.items.pop() as T;
  }, []);

  const reset = useCallback(() => {
    bagRef.current.items = [];
  }, []);

  return { draw, reset };
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}