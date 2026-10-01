import Constants from 'expo-constants';
import { useStore } from '@/data/store';
import { useAction } from '@/hooks/use-action';
import { confirmDestructive } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { space } from '@/theme';
import { ActionRow, Block, Notice, ScrollScreen, Section, Text } from '@/ui';

export function AboutScreen() {
  const { records, remove } = useStore();
  const action = useAction();
  const version = Constants.expoConfig?.version ?? '0.1.0';

  async function deleteAll() {
    const confirmed = await confirmDestructive({
      title: 'Delete all counts?',
      message: `${records.length} ${
        records.length === 1 ? 'count' : 'counts'
      } and every recorded unit will be removed from this device. This cannot be undone.`,
      confirmLabel: 'Delete all',
    });
    if (!confirmed) return;
    await action.run(async () => {
      await remove(records.map((r) => r.id));
      haptics.success();
    });
  }

  return (
    <ScrollScreen>
      <Block gap={space.sm}>
        <Text variant="title" accessibilityRole="header">
          Barcode Inventory
        </Text>
        <Text variant="body" tone="muted">
          Counts inventory against an expected list. Each accepted barcode scan
          adds exactly one unit, and the scanner pauses until you ask for the
          next one.
        </Text>
      </Block>

      <Section title="Data">
        <ActionRow
          icon="trash"
          label="Delete all counts"
          destructive
          disabled={action.busy || records.length === 0}
          onPress={() => void deleteAll()}
        />
      </Section>

      <Block>
        <Notice message={action.error} />
      </Block>

      <Block gap={space.xs}>
        <Text variant="footnote" tone="tertiary" tabular>
          Version {version} · MIT License · © 2026 Folder IT
        </Text>
      </Block>
    </ScrollScreen>
  );
}
