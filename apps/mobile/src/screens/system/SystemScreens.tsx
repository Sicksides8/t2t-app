import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SystemStateLayout } from '../../components/system';
import type { ProfileStackParamList } from '../../types';

type Props = NativeStackScreenProps<ProfileStackParamList, keyof ProfileStackParamList>;

/** Penpot: 73_Sin_Conexion */
export function OfflineScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="73_Sin_Conexion"
      icon="cloud-offline-outline"
      title="Sin conexión"
      body="Revisá tu Wi‑Fi o datos móviles. Podés seguir viendo contenido ya descargado cuando vuelva la red."
      primaryLabel="Volver"
      onPrimary={() => navigation.goBack()}
    />
  );
}

/** Penpot: 74_Error_Generico */
export function ErrorScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="74_Error_Generico"
      icon="alert-circle-outline"
      title="Error al cargar"
      body="No pudimos obtener los datos. Probá de nuevo en unos segundos."
      primaryLabel="Reintentar"
      onPrimary={() => navigation.goBack()}
    />
  );
}

/** Penpot: 75_Mantenimiento */
export function MaintenanceScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="75_Mantenimiento"
      icon="construct-outline"
      title="Mantenimiento"
      body="Estamos mejorando T2T Academy. Volvé a intentar más tarde."
      primaryLabel="Entendido"
      onPrimary={() => navigation.goBack()}
    />
  );
}

/** Penpot: 76_Vacios */
export function EmptyBoardScreen({ navigation }: Props) {
  return (
    <SystemStateLayout
      penpotFrame="76_Vacios"
      icon="folder-open-outline"
      title="Nada por aquí"
      body="Cuando haya contenido para mostrar, lo verás en esta sección."
      primaryLabel="Volver"
      onPrimary={() => navigation.goBack()}
    />
  );
}
