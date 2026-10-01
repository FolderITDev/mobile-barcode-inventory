import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/data/store';
import {
  discrepancies,
  sessionOrder,
  totals,
  type AppRecord,
} from '@/domain/model';
import { formatRelative } from '@/lib/format';
import { createStyles, space, useTheme } from '@/theme';
import {
  Button,
  CONTENT_MAX_WIDTH,
  EmptyState,
  HeaderButton,
  Icon,
  Row,
  Separator,
  Text,
} from '@/ui';

export function CountListScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { records } = useStore();
  const ordered = useMemo(() => sessionOrder(records), [records]);

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <HeaderActions /> }} />
      <FlatList
        data={ordered}
        keyExtractor={(record) => record.id}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
        ListHeaderComponent={
          ordered.length ? (
            <View style={styles.header}>
              <Text
                variant="eyebrow"
                tone="muted"
                caps
                accessibilityRole="header"
              >
                Sessions
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <CountRow record={item} />}
        ItemSeparatorComponent={RowSeparator}
        ListEmptyComponent={<EmptyCounts />}
      />
    </>
  );
}

function HeaderActions() {
  const styles = useStyles();
  return (
    <View style={styles.headerActions}>
      <HeaderButton
        icon="info"
        accessibilityLabel="About Barcode Inventory"
        onPress={() => router.push('/about')}
      />
      <HeaderButton
        icon="add"
        accessibilityLabel="New count"
        onPress={() => router.push('/new')}
      />
    </View>
  );
}

function RowSeparator() {
  return <Separator inset={space.gutter} />;
}

function CountRow({ record }: { record: AppRecord }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = totals(record);
  const open = discrepancies(record).length;
  const closed = record.status === 'closed';
  const state = closed
    ? `Closed ${formatRelative(record.closedAt!)}`
    : `Active · ${record.lines.length} lines`;
  const started = t.observed > 0 || closed;
  const differences = !started
    ? 'Not started'
    : open === 0
      ? 'All matched'
      : `${open} ${open === 1 ? 'difference' : 'differences'}`;
  return (
    <Row
      navigates
      onPress={() =>
        router.push({ pathname: '/count/[id]', params: { id: record.id } })
      }
      accessibilityLabel={`${record.title}. ${state}. ${t.observed} of ${t.expected} units counted. ${differences}.`}
    >
      <View style={styles.rowLayout}>
        <View style={styles.rowBody}>
          <Text variant="headline">{record.title}</Text>
          <View style={styles.inline}>
            <Icon
              name={closed ? 'closed' : 'scan'}
              size={14}
              color={closed ? colors.muted : colors.accent}
            />
            <Text variant="footnote" tone="muted">
              {state}
            </Text>
          </View>
          <Text
            variant="footnote"
            tone={!started ? 'muted' : open ? 'caution' : 'info'}
          >
            {differences}
          </Text>
        </View>
        <View style={styles.figures}>
          <Text variant="title" tabular>
            {t.observed}
            <Text variant="title" tone="tertiary">
              {' / '}
            </Text>
            <Text variant="title" tone="muted">
              {t.expected}
            </Text>
          </Text>
          <Text variant="eyebrow" tone="tertiary" caps>
            Units
          </Text>
        </View>
      </View>
    </Row>
  );
}

function EmptyCounts() {
  return (
    <EmptyState
      icon="scan"
      title="No counts yet"
      body="Set the expected quantities, then scan or tap to count what is actually there."
    >
      <Button
        label="New count"
        icon="add"
        onPress={() => router.push('/new')}
      />
    </EmptyState>
  );
}

const useStyles = createStyles(({ colors }) => ({
  list: { flex: 1, backgroundColor: colors.canvas },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.rule,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  rowLayout: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowBody: { flex: 1, gap: space.xs },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  figures: { alignItems: 'flex-end', gap: space.xxs },
}));
