import React from 'react';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SystemStateLayout } from '../../components/system';
import type { MainTabParamList, ProfileStackParamList } from '../../types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, keyof ProfileStackParamList>,
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>
>;

export function OfflineScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="78_Sin_Conexion"
      icon="cloud-offline-outline"
      glowColor="#B73CEF60"
      title="Sin conexión"
      body="Revisá tu internet y volvé a intentar. Tu progreso se guarda localmente."
      primaryLabel="Reintentar"
      onPrimary={() => navigation.goBack()}
    />
  );
}

export function ErrorScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="79_Error_Generico"
      icon="warning-outline"
      glowColor="#FF5C5C60"
      title="Algo salió mal"
      body="Tuvimos un problema procesando tu solicitud. Probá de nuevo en unos minutos."
      primaryLabel="Reintentar"
      onPrimary={() => navigation.goBack()}
    />
  );
}

export function MaintenanceScreen() {
  return (
    <SystemStateLayout
      penpotFrame="80_Mantenimiento"
      icon="construct-outline"
      glowColor="#FFB54766"
      title="Estamos mejorando"
      scriptLine="ya volvemos"
      body="Hacemos mejoras al gimnasio mental. Volvemos en unos minutos."
      etaChip={{ icon: 'time-outline', label: 'ETA · 15 min' }}
    />
  );
}

export function EmptyBoardScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="81_Vacios"
      icon="cube-outline"
      glowColor="#4CC35B60"
      title="Todavía no hay nada aquí"
      body="Cuando completes tu primer curso, vas a ver tus certificados acá."
      primaryLabel="Explorar catálogo"
      onPrimary={() => navigation.getParent()?.navigate('ExploreTab')}
    />
  );
}
