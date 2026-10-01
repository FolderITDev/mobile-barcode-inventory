import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRecord, useStore } from '@/data/store';
import { adjust, discrepancies, rename, type AppRecord } from '@/domain/model';
import { useAction } from '@/hooks/use-action';
import { confirmDestructive } from '@/lib/confirm';
import { formatDateTime } from '@/lib/format';
import { createStyles, motion, space, useTheme } from '@/theme';
import {
  Button,
  CONTENT_MAX_WIDTH,
  EmptyState,
  Footer,
  HeaderButton,
  Icon,
  Notice,
  ScrollScreen,
  SegmentedControl,
  Separator,
  Text,
} from '@/ui';
import { CountLineRow } from './components/count-line-row';
import { CountMeter } from './components/count-meter';

type Filter = 'all' | 'differences';

const CLOSED_ENTER = FadeIn.duration(motion.duration.enter).easing(
  motion.easing.easeOut,
);

export function CountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stored = useRecord(id);
  /** Keeps a deleted count on screen while the back transition runs. */
  const [leaving, setLeaving] = useState<AppRecord>();
  const record = stored ?? leaving;
  const [openedAs] = useState(stored?.status);
  const { change, remove } = useStore();
  const { colors } = useTheme();
  const styles = useStyles();
  const action = useAction();
  const [filter, setFilter] = useState<Filter>('all');
  const open = useMemo(() => (record ? discrepancies(record) : []), [record]);

  if (!record)
    return (
      <ScrollScreen>
        <EmptyState
          icon="count"
          title="Count not found"
          body="It may have been deleted on this device."
        >
          <Button label="Back to counts" onPress={() => router.back()} />
        </EmptyState>
      </ScrollScreen>
    );

  const draft = record.status === 'draft';
  const justClosed = !draft && openedAs === 'draft';
  const lines = filter === 'all' ? record.lines : open;

  const deleteCount = async () => {
    const confirmed = await confirmDestructive({
      title: `Delete ${record.title}?`,
      message:
        'The count and every recorded unit will be removed from this device. This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await action.run(async () => {
      setLeaving(record);
      await remove([record.id]);
      router.back();
    });
  };

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: draft ? 'Count' : 'Closed count',
          headerRight: draft
            ? () => (
                <HeaderButton
                  label="Review"
                  prominent
                  accessibilityLabel="Review and close this count"
                  onPress={() =>
                    router.push({ pathname: '/review/[id]', params: { id } })
                  }
                />
              )
            : undefined,
        }}
      />
      <FlatList
        data={lines}
        keyExtractor={(line) => line.barcode}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        style={styles.list}
        contentContainerStyle={styles.content}
        initialNumToRender={12}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text variant="eyebrow" tone="muted" caps>
                {draft ? 'Active count' : 'Closed · Read-only'}
              </Text>
              <Text variant="display" accessibilityRole="header">
                {record.title}
              </Text>
              {!draft && (
                <Animated.View
                  entering={justClosed ? CLOSED_ENTER : undefined}
                  style={styles.closedLine}
                >
                  <Icon name="closed" size={14} color={colors.muted} />
                  <Text variant="footnote" tone="muted">
                    Closed {formatDateTime(record.closedAt!)}
                  </Text>
                </Animated.View>
              )}
            </View>
            <CountMeter record={record} />
            <SegmentedControl
              accessibilityLabel="Lines to show"
              value={filter}
              onChange={setFilter}
              segments={[
                {
                  value: 'all',
                  label: 'All lines',
                  count: record.lines.length,
                },
                {
                  value: 'differences',
                  label: 'Differences',
                  count: open.length,
                },
              ]}
            />
            <Notice message={action.error} />
          </View>
        }
        renderItem={({ item }) => (
          <CountLineRow
            line={item}
            editable={draft}
            busy={action.busy}
            onAdjust={(delta) =>
              void action.run(() =>
                change(id, (old) => adjust(old, item.barcode, delta)),
              )
            }
            onRename={(name) =>
              action.run(() =>
                change(id, (old) => rename(old, item.barcode, name)),
              )
            }
          />
        )}
        ItemSeparatorComponent={RowSeparator}
        ListEmptyComponent={
          <EmptyState
            icon="matched"
            title="No differences"
            body="Every expected unit is accounted for and nothing unexpected was scanned."
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              label="Delete count"
              icon="trash"
              variant="destructive"
              compact
              busy={action.busy && Boolean(leaving)}
              onPress={() => void deleteCount()}
            />
          </View>
        }
      />
      {draft && (
        <Footer>
          <Button
            label="Scan barcode"
            icon="scan"
            onPress={() =>
              router.push({ pathname: '/scanner/[id]', params: { id } })
            }
          />
        </Footer>
      )}
    </View>
  );
}

function RowSeparator() {
  return <Separator inset={space.gutter} />;
}

const useStyles = createStyles(({ colors }) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  list: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingBottom: space.xl,
  },
  header: {
    gap: space.xl,
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    paddingBottom: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
  },
  titleBlock: { gap: space.xs },
  closedLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  footer: {
    alignItems: 'flex-start',
    paddingHorizontal: space.gutter - space.sm,
    paddingTop: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.rule,
  },
}));
