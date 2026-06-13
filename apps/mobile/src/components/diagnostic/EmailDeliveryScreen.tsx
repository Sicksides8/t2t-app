import React, { useState } from 'react';
import { AuthField, AuthMailShell } from '../auth';

type Props = {
  onBack: () => void;
  onSubmit?: (email: string) => Promise<void> | void;
};

/** Penpot 33_Recibir_Email — pantalla de envío del resultado por email. */
export function EmailDeliveryScreen({ onBack, onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (email.trim().length === 0) return;
    try {
      setSending(true);
      await onSubmit?.(email.trim());
      onBack();
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthMailShell
      title="Recibe tu diagnóstico por email"
      subtitle="Te enviamos tu radar completo y un resumen de tus 12 habilidades."
      variant="purple"
      icon="mail"
      onBack={onBack}
      primaryLabel={sending ? 'Enviando…' : 'Enviar resultado'}
      primaryLoading={sending}
      primaryDisabled={email.trim().length === 0}
      onPrimary={() => void submit()}
    >
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
    </AuthMailShell>
  );
}
