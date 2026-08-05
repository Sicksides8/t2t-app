import React, { useEffect, useId, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { useAuthScroll } from './AuthFormShell';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
};

/** Campo auth Penpot 36–39: label uppercase + input glass + toggle ojo cuando `secure`. */
export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
}: Props) {
  const [visible, setVisible] = React.useState(false);
  const isHidden = secure && !visible;
  const fieldKey = useId();
  const wrapRef = useRef<View>(null);
  const authScroll = useAuthScroll();

  useEffect(() => {
    authScroll?.registerField(fieldKey, wrapRef.current);
    return () => authScroll?.registerField(fieldKey, null);
  }, [authScroll, fieldKey]);

  return (
    <View
      ref={wrapRef}
      style={styles.wrap}
      collapsable={false}
      onLayout={() => authScroll?.registerField(fieldKey, wrapRef.current)}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={isHidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          selectionColor={Colors.accentPrimary}
          style={[styles.input, secure && styles.inputWithEye]}
          onFocus={() => {
            // Delay para esperar al KeyboardAvoidingView antes de scrollear.
            requestAnimationFrame(() => {
              setTimeout(() => authScroll?.scrollToField(fieldKey), 80);
            });
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            style={styles.eye}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.textTertiary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    minHeight: 56,
    borderRadius: Radius.card,
    backgroundColor: '#FFFFFF0A',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    color: Colors.textPrimary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...Typography.body,
    fontSize: 15,
  },
  inputWithEye: {
    paddingRight: 52,
  },
  eye: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
});
