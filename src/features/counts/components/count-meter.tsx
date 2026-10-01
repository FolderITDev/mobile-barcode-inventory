import { View } from 'react-native';
import { lineStatus, totals, type AppRecord } from '@/domain/model';
import { createStyles, space, useTheme } from '@/theme';
import { Icon, Text } from '@/ui';

/**
 * The instrument face: counted and expected units set large and aligned.
 * Values change instantly; an animated counter would hide the real number.
 */
export function CountMeter({ record }: { record: AppRecord }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = totals(record);
  const statuses = record.lines.map(lineStatus);
  const count = (status: string) => statuses.filter((s) => s === status).length;
  const matched = count('matched');
  const parts = [
    count('short') && `${count('short')} short`,
    count('over') && `${count('over')} over`,
    count('unexpected') && `${count('unexpected')} unexpected`,
    count('uncounted') && `${count('uncounted')} not counted`,
  ].filter(Boolean);
  const allMatched = matched === record.lines.length;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={`${t.observed} counted of ${t.expected} expected units. ${matched} of ${record.lines.length} lines matched.`}
    >
      <View style={styles.meter}>
        <View style={styles.column}>
          <Text variant="eyebrow" tone="muted" caps>
            Counted
          </Text>
          <Text variant="meter" tabular>
            {t.observed}
          </Text>
        </View>
        <Text variant="meter" tone="tertiary">
          /
        </Text>
        <View style={styles.column}>
          <Text variant="eyebrow" tone="muted" caps>
            Expected
          </Text>
          <Text variant="meter" tone="muted" tabular>
            {t.expected}
          </Text>
        </View>
      </View>
      <View style={styles.summary}>
        <Icon
          name={allMatched ? 'matched' : 'count'}
          size={15}
          color={allMatched ? colors.info : colors.muted}
        />
        <Text variant="subhead" tone={allMatched ? 'info' : 'muted'} tabular>
          {allMatched
            ? 'Every line matches'
            : `${matched} of ${record.lines.length} lines matched · ${parts.join(' · ')}`}
        </Text>
      </View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  root: { gap: space.md },
  meter: { flexDirection: 'row', alignItems: 'flex-end', gap: space.lg },
  column: { gap: space.xs },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingRight: space.lg,
  },
}));
