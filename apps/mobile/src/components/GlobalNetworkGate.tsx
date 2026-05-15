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
          penpotFrame="75_Mantenimiento"
          icon="construct-outline"
          title="Mantenimiento"
          body="Estamos mejorando T2T Academy. Volvé a intentar más tarde."
        />
      </Modal>
      <Modal visible={isOffline && !isMaintenance} animationType="fade" transparent>
        <View style={styles.offline}>
          <SystemStateLayout
            penpotFrame="73_Sin_Conexion"
            icon="cloud-offline-outline"
            title="Sin conexión"
            body="Revisá tu Wi‑Fi o datos móviles para continuar."
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
