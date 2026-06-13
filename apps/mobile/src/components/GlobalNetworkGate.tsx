import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useNetworkStore } from '../stores/useNetworkStore';
import { SystemStateLayout } from './system';

/** Penpot 73 — overlay global cuando no hay red. */
export function GlobalNetworkGate({ children }: { children: React.ReactNode }) {
  const init = useNetworkStore((s) => s.init);
  const isOffline = useNetworkStore((s) => s.isOffline);
  const isMaintenance = useNetworkStore((s) => s.isMaintenance);

  useEffect(() => init(), [init]);

  return (
    <>
      {children}
      <Modal visible={isMaintenance} animationType="fade" transparent={false}>
        <SystemStateLayout
          penpotFrame="80_Mantenimiento"
          icon="construct-outline"
          glowColor="#FFB54766"
          title="Estamos mejorando"
          scriptLine="ya volvemos"
          body="Hacemos mejoras al gimnasio mental. Volvemos en unos minutos."
          etaChip={{ icon: 'time-outline', label: 'ETA · 15 min' }}
        />
      </Modal>
      <Modal visible={isOffline && !isMaintenance} animationType="fade" transparent>
        <View style={styles.offline}>
          <SystemStateLayout
            penpotFrame="78_Sin_Conexion"
            icon="cloud-offline-outline"
            glowColor="#B73CEF60"
            title="Sin conexión"
            body="Revisá tu internet y volvé a intentar. Tu progreso se guarda localmente."
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  offline: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
});
