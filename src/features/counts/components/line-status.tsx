import { View } from 'react-native';
import {
  difference,
  lineStatus,
  type Line,
  type LineStatus,
} from '@/domain/model';
import { createStyles, space, useTheme } from '@/theme';
import { Icon, Text, type IconName, type Tone } from '@/ui';

export const statusMeta: Record<LineStatus, { icon: IconName; tone: Tone }> = {
  matched: { icon: 'matched', tone: 'info' },
  short: { icon: 'short', tone: 'caution' },
  over: { icon: 'over', tone: 'caution' },
  unexpected: { icon: 'unexpected', tone: 'caution' },
  uncounted: { icon: 'uncounted', tone: 'muted' },
};

/** Icon, word and signed quantity: a difference is never shown by color alone. */
export function LineStatusLabel({ line }: { line: Line }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const meta = statusMeta[lineStatus(line)];
  return (
    <View style={styles.row}>
      <Icon name={meta.icon} size={15} color={colors[meta.tone]} />
      <Text variant="footnote" tone={meta.tone} tabular>
        {difference(line)}
      </Text>
    </View>
  );
}

const useStyles = createStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
}));
