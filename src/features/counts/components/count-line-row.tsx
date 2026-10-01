import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Line } from '@/domain/model';
import { haptics } from '@/lib/haptics';
import { createStyles, radius, space, useTheme } from '@/theme';
import { Button, Icon, Text, TextField } from '@/ui';
import { LineStatusLabel } from './line-status';

interface Props {
  line: Line;
  editable: boolean;
  /** Only drives the rename button. The stepper relies on the action lock,
   *  so a shared busy flag doesn't flash every row's buttons on each tap. */
  busy: boolean;
  onAdjust: (delta: 1 | -1) => void;
  onRename: (name: string) => Promise<boolean>;
}

/**
 * One product line: name and code on the left, counted / expected aligned
 * on the right, and a stepper for corrections. Long names wrap; the numbers
 * never move.
 */
export function CountLineRow({
  line,
  editable,
  busy,
  onAdjust,
  onRename,
}: Props) {
  const styles = useStyles();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(line.name);

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <View style={styles.identity}>
          <Text variant="headline">{line.name}</Text>
          <Text variant="code" tone="muted" selectable>
            {line.barcode}
          </Text>
        </View>
        <View
          style={styles.figures}
          accessible
          accessibilityLabel={`${line.observed} counted of ${line.expected} expected`}
        >
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
      <View style={[styles.bottom, editable && styles.bottomEditable]}>
        <LineStatusLabel line={line} />
        {editable && (
          <View style={styles.stepper}>
            <StepButton
              icon="subtract"
              label={`Remove one ${line.name}`}
              disabled={line.observed === 0}
              onPress={() => onAdjust(-1)}
            />
            <StepButton
              icon="add"
              label={`Add one ${line.name}`}
              onPress={() => onAdjust(1)}
            />
          </View>
        )}
      </View>
      {editable &&
        line.unexpected &&
        (naming ? (
          <View style={styles.naming}>
            <TextField
              label="Item name"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={() =>
                void onRename(name).then((ok) => ok && setNaming(false))
              }
            />
            <View style={styles.namingActions}>
              <View style={styles.flex}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  compact
                  onPress={() => {
                    setName(line.name);
                    setNaming(false);
                  }}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  label="Save name"
                  compact
                  busy={busy}
                  onPress={() =>
                    void onRename(name).then((ok) => ok && setNaming(false))
                  }
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.nameAction}>
            <Button
              label="Name this item"
              icon="edit"
              variant="plain"
              compact
              onPress={() => setNaming(true)}
            />
          </View>
        ))}
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: 'add' | 'subtract';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.step,
        pressed && { backgroundColor: colors.fill },
        disabled && styles.stepDisabled,
      ]}
    >
      <Icon name={icon} size={18} color={colors.ink} weight="semibold" />
    </Pressable>
  );
}

const useStyles = createStyles(({ colors }) => ({
  row: {
    gap: space.sm,
    paddingVertical: space.md + 2,
    paddingHorizontal: space.gutter,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  identity: { flex: 1, gap: space.xxs },
  figures: { alignItems: 'flex-end', minWidth: 72 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  bottomEditable: { minHeight: 40 },
  stepper: { flexDirection: 'row', gap: space.sm },
  step: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.surface,
  },
  stepDisabled: { opacity: 0.35 },
  naming: { gap: space.sm, marginTop: space.xs },
  namingActions: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  nameAction: { alignItems: 'flex-start', marginLeft: -space.sm },
}));
