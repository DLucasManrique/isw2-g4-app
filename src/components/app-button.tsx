import { Pressable, StyleSheet, Text, type ButtonProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AppButtonProps = Omit<ButtonProps, 'color'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  selected?: boolean;
};

export function AppButton({ title, variant = 'primary', selected, disabled, onPress, ...rest }: AppButtonProps) {
  const theme = useTheme();
  const danger = variant === 'danger';
  const secondary = variant === 'secondary' || selected === false;
  const backgroundColor = disabled ? theme.backgroundSelected : danger ? theme.dangerBackground : secondary ? theme.backgroundElement : theme.primary;
  const textColor = disabled ? theme.textSecondary : danger ? theme.danger : secondary ? theme.primary : theme.onPrimary;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, ...(selected !== undefined ? { selected } : {}) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor, borderColor: danger ? theme.danger : secondary ? theme.border : backgroundColor, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[styles.label, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 1 },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
});
