import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type SettingsMap = Record<string, string>;

interface SettingsContextType {
  settings: SettingsMap;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({});

  const load = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('is_public', true);
    const map: SettingsMap = {};
    (data || []).forEach((r: any) => (map[r.key] = r.value));
    setSettings(map);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<SettingsContextType>(() => ({ settings, reload: load }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}


