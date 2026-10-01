import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRecord, useStore } from '@/data/store';
import {
  closeCount,
  discrepancies,
  lineStatus,
  totals,
  type LineStatus,
} from '@/domain/model';
import { useAction } from '@/hooks/use-action';
import { haptics } from '@/lib/haptics';
import { createStyles, space } from '@/theme';
import {
  Block,
  Button,
  EmptyState,
  Footer,
  HeaderButton,
  Notice,
  ScrollScreen,
  Section,
  Separator,
  Text,
  type Tone,
} from '@/ui';
import { LineStatusLabel } from './components/line-status';

const tallies: { status: LineStatus; label: string; tone: Tone }[] = [
  { status: 'matched', label: 'Matched', tone: 'info' },
  { status: 'short', label: 'Short', tone: 'caution' },
  { status: 'over', label: 'Over', tone: 'caution' },
  { status: 'unexpected', label: 'Unexpected', tone: 'caution' },
];

export function CloseCountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useRecord(id);
  const { change } = useStore();
  const styles = useStyles();
  const action = useAction();
  /** Set once the write succeeds, so the dismiss animation keeps this screen intact. */
  const [closed, setClosed] = useState(false);

  if (!record || (record.status === 'closed' && !closed))
    return (
      <ScrollScreen>
        <EmptyState
          icon="closed"
          title={record ? 'Already closed' : 'Count not found'}
          body={
            record
              ? 'This count is a read-only snapshot.'
              : 'It may have been deleted on this device.'
          }
        >
          <Button label="Close" onPress={() => router.back()} />
        </EmptyState>
      </ScrollScreen>
    );

  const t = totals(record);
  const statuses = record.lines.map(lineStatus);
  // Lines nobody counted are short by their full expected quantity.
  const countOf = (status: LineStatus) =>
    statuses.filter(
      (s) => s === status || (status === 'short' && s === 'uncounted'),
    ).length;
  const open = discrepancies(record);

  function close() {
    void action.run(async () => {
      await change(id, (old) => closeCount(old));
      haptics.success();
      setClosed(true);
      router.back();
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderButton
              label="Cancel"
              accessibilityLabel="Cancel"
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <ScrollScreen
        footer={
          <Footer>
            <Button
              label="Close count"
              icon="closed"
              busy={action.busy}
              onPress={close}
            />
          </Footer>
        }
      >
        <Block gap={space.xs}>
          <Text variant="eyebrow" tone="muted" caps>
            Reconciliation
          </Text>
          <Text variant="display" accessibilityRole="header">
            {record.title}
          </Text>
          <Text variant="subhead" tone="muted" tabular>
            {t.observed} counted of {t.expected} expected units
          </Text>
        </Block>

        <View style={styles.grid}>
          {tallies.map(({ status, label, tone }, index) => (
            <View
              key={status}
              style={[styles.cell, index > 0 && styles.cellRule]}
              accessible
              accessibilityLabel={`${countOf(status)} ${label}`}
            >
              <Text
                variant="display"
                tone={countOf(status) ? tone : 'tertiary'}
                tabular
              >
                {countOf(status)}
              </Text>
              <Text variant="footnote" tone="muted">
                {label}
              </Text>
            </View>
          ))}
        </View>

        <Section title={`Differences · ${open.length}`}>
          {open.length === 0 ? (
            <Text variant="body" tone="info" style={styles.empty}>
              Every line matches its expected quantity.
            </Text>
          ) : (
            open.map((line, index) => (
              <View key={line.barcode}>
                {index > 0 && <Separator inset={space.gutter} />}
                <View style={styles.line}>
                  <View style={styles.lineBody}>
                    <Text variant="headline">{line.name}</Text>
                    <Text variant="code" tone="muted">
                      {line.barcode}
                    </Text>
                    <LineStatusLabel line={line} />
                  </View>
                  <Text variant="number" tabular>
                    {line.observed}
                    <Text variant="number" tone="tertiary">
                      {' / '}
                    </Text>
                    <Text variant="number" tone="muted">
                      {line.expected}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          )}
        </Section>

        <Block gap={space.md}>
          <Text variant="footnote" tone="muted">
            Closing freezes these numbers. Differences stay visible in the
            closed count, and it can no longer be edited.
          </Text>
          <Notice message={action.error} />
        </Block>
      </ScrollScreen>
    </>
  );
}

const useStyles = createStyles(({ colors }) => ({
  grid: {
    flexDirection: 'row',
    marginHorizontal: space.gutter,
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.rule,
  },
  cell: { flex: 1, gap: space.xxs },
  cellRule: {
    paddingLeft: space.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.rule,
  },
  empty: { paddingHorizontal: space.gutter, paddingVertical: space.lg },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.md + 2,
  },
  lineBody: { flex: 1, gap: space.xxs },
}));
