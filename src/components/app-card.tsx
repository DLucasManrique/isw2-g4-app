import { Pressable, View, type ViewProps, type PressableProps } from 'react-native';

import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppCardProps = ViewProps & { onPress?: PressableProps['onPress'] };

export function AppCard({ style, onPress, children, ...rest }: AppCardProps) {
  const theme = useTheme();
  const cardStyle = [Visual.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style];
  return onPress ? (
    <Pressable {...rest} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.8 : 1 }]}>
      {children}
    </Pressable>
  ) : <View {...rest} style={cardStyle}>{children}</View>;
}
