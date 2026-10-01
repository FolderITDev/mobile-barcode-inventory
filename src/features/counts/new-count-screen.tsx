import { useRef, useState } from 'react';
import { Pressable, View, type TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useStore } from '@/data/store';
import { barcode, createCount, type Line } from '@/domain/model';
import { message } from '@/domain/validation';
import { useAction } from '@/hooks/use-action';
import { useUnsavedGuard } from '@/hooks/use-unsaved-guard';
import { haptics } from '@/lib/haptics';
import { createStyles, space, useTheme } from '@/theme';
import {
  Block,
  Button,
  HeaderButton,
  Icon,
  Notice,
  ScrollScreen,
  Section,
  Separator,
  Text,
  TextField,
} from '@/ui';

interface Draft {
  code: string;
  name: string;
  quantity: string;
}

const emptyDraft: Draft = { code: '', name: '', quantity: '' };

/** Validates one expected item; returns field errors or a ready line. */
function validate(draft: Draft, lines: Line[]) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  let code = '';
  try {
    code = barcode(draft.code);
    if (lines.some((l) => l.barcode === code))
      errors.code = 'This barcode is already in the list.';
  } catch (e) {
    errors.code = message(e);
  }
  if (!draft.name.trim()) errors.name = 'Enter the item name.';
  if (!/^\d{1,6}$/.test(draft.quantity))
    errors.quantity = 'Enter a whole number from 0 to 999999.';
  const line: Line | null = Object.keys(errors).length
    ? null
    : {
        barcode: code,
        name: draft.name.trim(),
        expected: Number(draft.quantity),
        observed: 0,
        unexpected: false,
      };
  return { errors, line };
}

export function NewCountScreen() {
  const { add } = useStore();
  const { colors } = useTheme();
  const styles = useStyles();
  const action = useAction();
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameField = useRef<TextInput>(null);
  const quantityField = useRef<TextInput>(null);
  const codeField = useRef<TextInput>(null);
  const allowLeave = useUnsavedGuard(
    Boolean(title.trim() || lines.length || draft.code || draft.name),
    'This count has not been started yet.',
  );

  const { errors, line } = validate(draft, lines);
  const titleError = title.trim() ? null : 'Name this count.';
  const units = lines.reduce((sum, l) => sum + l.expected, 0);

  function addLine() {
    setShowErrors(true);
    if (!line) {
      haptics.error();
      return;
    }
    haptics.tap();
    setLines([...lines, line]);
    setDraft(emptyDraft);
    setShowErrors(false);
    codeField.current?.focus();
  }

  function start() {
    setSubmitted(true);
    if (titleError || !lines.length) {
      haptics.error();
      return;
    }
    void action.run(async () => {
      const record = createCount(randomUUID(), title, lines);
      await add(record);
      haptics.success();
      allowLeave();
      router.replace({ pathname: '/count/[id]', params: { id: record.id } });
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
          headerRight: () => (
            <HeaderButton
              label="Start"
              prominent
              accessibilityLabel={`Start count with ${lines.length} items`}
              busy={action.busy}
              onPress={start}
            />
          ),
        }}
      />
      <ScrollScreen>
        <Block>
          <TextField
            label="Count name"
            requirement="required"
            value={title}
            onChangeText={setTitle}
            placeholder="West dock · Receiving"
            error={submitted ? titleError : null}
            maxLength={100}
          />
        </Block>

        <Section
          title={
            lines.length
              ? `Expected · ${lines.length} ${lines.length === 1 ? 'item' : 'items'} · ${units} units`
              : 'Expected items'
          }
          footer="Expected quantities become a fixed snapshot when the count starts."
        >
          {lines.length === 0 ? (
            <View style={styles.emptyList}>
              <Text variant="subhead" tone="muted">
                Add each item you expect to find.
              </Text>
            </View>
          ) : (
            lines.map((l, index) => (
              <View key={l.barcode}>
                {index > 0 && <Separator inset={space.gutter} />}
                <View style={styles.line}>
                  <View style={styles.lineBody}>
                    <Text variant="headline">{l.name}</Text>
                    <Text variant="code" tone="muted">
                      {l.barcode}
                    </Text>
                  </View>
                  <Text variant="number" tabular>
                    {l.expected}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${l.name}`}
                    hitSlop={10}
                    onPress={() =>
                      setLines(lines.filter((x) => x.barcode !== l.barcode))
                    }
                    style={({ pressed }) => [
                      styles.remove,
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <Icon name="close" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </Section>

        <Block gap={space.lg}>
          <Text variant="eyebrow" tone="muted" caps accessibilityRole="header">
            Add an expected item
          </Text>
          <TextField
            ref={codeField}
            label="EAN-13 barcode"
            value={draft.code}
            onChangeText={(code) => setDraft({ ...draft, code })}
            placeholder="13 digits"
            error={showErrors ? errors.code : null}
            mono
            keyboardType="number-pad"
            maxLength={13}
            returnKeyType="next"
            onSubmitEditing={() => nameField.current?.focus()}
          />
          <TextField
            ref={nameField}
            label="Item name"
            value={draft.name}
            onChangeText={(name) => setDraft({ ...draft, name })}
            placeholder="Safety gloves"
            error={showErrors ? errors.name : null}
            maxLength={100}
            returnKeyType="next"
            onSubmitEditing={() => quantityField.current?.focus()}
          />
          <TextField
            ref={quantityField}
            label="Expected units"
            value={draft.quantity}
            onChangeText={(quantity) => setDraft({ ...draft, quantity })}
            placeholder="0"
            error={showErrors ? errors.quantity : null}
            mono
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button
            label="Add item"
            icon="add"
            variant="secondary"
            onPress={addLine}
          />
          {submitted && !lines.length && (
            <Notice message="Add at least one expected item to start." />
          )}
          <Notice message={action.error} />
        </Block>
      </ScrollScreen>
    </>
  );
}

const useStyles = createStyles(() => ({
  emptyList: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.md,
  },
  lineBody: { flex: 1, gap: space.xxs },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
