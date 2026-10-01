import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecord, useStore } from '@/data/store';
import { ScanGate, scan } from '@/domain/model';
import { useAction } from '@/hooks/use-action';
import { haptics } from '@/lib/haptics';
import {
  ThemeScope,
  createStyles,
  motion,
  radius,
  space,
  useTheme,
} from '@/theme';
import { Button, Icon, Notice, Text, TextField, type IconName } from '@/ui';
import { LineStatusLabel } from './components/line-status';

type Camera =
  | { kind: 'checking' }
  | { kind: 'ready' }
  | { kind: 'unavailable'; reason: string; settings: boolean };

const RESULT_ENTER = FadeIn.duration(motion.duration.quick).easing(
  motion.easing.easeOut,
);

/**
 * One accepted scan is one unit. A synchronous gate drops duplicate native
 * callbacks from the same frame, and scanning stays paused until the person
 * asks for the next unit. Manual entry is always one tap away.
 */
export function ScannerScreen() {
  return (
    <ThemeScope scheme="dark">
      <Scanner />
    </ThemeScope>
  );
}

function Scanner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useRecord(id);
  const { change } = useStore();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const action = useAction();
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<Camera>(
    Platform.OS === 'web'
      ? {
          kind: 'unavailable',
          reason: 'Camera scanning runs in the native app. Enter codes here.',
          settings: false,
        }
      : { kind: 'checking' },
  );
  const [manual, setManual] = useState(Platform.OS === 'web');
  const [focused, setFocused] = useState(true);
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState('');
  const [accepted, setAccepted] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const gate = useRef(new ScanGate());

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // Ask for the camera here, at the moment scanning was requested.
  useEffect(() => {
    if (Platform.OS === 'web' || !permission) return;
    let live = true;
    void (async () => {
      const result =
        permission.granted || !permission.canAskAgain
          ? permission
          : await requestPermission().catch(() => permission);
      if (!live) return;
      if (result.granted) setCamera({ kind: 'ready' });
      else {
        setManual(true);
        setCamera({
          kind: 'unavailable',
          reason: result.canAskAgain
            ? 'Camera access was not allowed. You can enter codes manually.'
            : 'Camera access is off. Enter codes manually, or allow access in Settings.',
          settings: !result.canAskAgain,
        });
      }
    })();
    return () => {
      live = false;
    };
  }, [permission, requestPermission]);

  async function recordScan(value: string) {
    if (!gate.current.take()) return;
    setFailed(false);
    setAccepted(null);
    const ok = await action.run(() => change(id, (old) => scan(old, value)));
    if (ok) {
      haptics.success();
      setAccepted(value);
      setCode('');
    } else setFailed(true);
  }

  function rearm() {
    gate.current.rearm();
    setAccepted(null);
    setFailed(false);
    action.clearError();
  }

  const line = record?.lines.find((l) => l.barcode === accepted);
  const scanning =
    camera.kind === 'ready' && !manual && focused && Platform.OS !== 'web';
  const armed = !accepted && !failed && !action.busy;
  const reticleColor = accepted
    ? colors.accent
    : failed
      ? colors.caution
      : 'rgba(255, 255, 255, 0.85)';

  return (
    <View style={styles.root}>
      {scanning && (
        <CameraView
          style={StyleSheet.absoluteFill}
          active={focused}
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={
            armed
              ? (event: BarcodeScanningResult) => void recordScan(event.data)
              : undefined
          }
          onMountError={(event) => {
            setManual(true);
            setCamera({
              kind: 'unavailable',
              reason: event.message,
              settings: false,
            });
          }}
        />
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <RoundButton
          icon="close"
          label="Close scanner"
          onPress={() => router.back()}
        />
        <Text variant="headline" style={styles.topTitle} numberOfLines={1}>
          {record?.title ?? 'Scan'}
        </Text>
        {scanning ? (
          <RoundButton
            icon={torch ? 'torchOn' : 'torchOff'}
            label={torch ? 'Turn off the light' : 'Turn on the light'}
            selected={torch}
            onPress={() => setTorch((on) => !on)}
          />
        ) : (
          <View style={styles.roundSpacer} />
        )}
      </View>

      <View style={styles.viewport}>
        {manual && (
          <View style={styles.manualMark}>
            <Icon name="keyboard" size={34} color={colors.tertiary} />
            <Text variant="subhead" tone="muted">
              Manual entry
            </Text>
          </View>
        )}
        {scanning && (
          <>
            <Reticle color={reticleColor} />
            <Text variant="subhead" style={styles.guide} align="center">
              {accepted
                ? 'Scanning paused'
                : 'Center an EAN-13 barcode in the frame'}
            </Text>
          </>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.panel,
            {
              // Android's nav-bar inset has no built-in breathing room, unlike
              // the iOS home indicator, so the panel would sit flush against it.
              paddingBottom:
                Platform.OS === 'android'
                  ? insets.bottom + space.lg
                  : Math.max(insets.bottom, space.lg),
            },
          ]}
        >
          {accepted && line ? (
            <Animated.View entering={RESULT_ENTER} style={styles.result}>
              <View style={styles.resultTop}>
                <View style={styles.resultBody}>
                  <Text variant="eyebrow" tone="info" caps>
                    Unit recorded
                  </Text>
                  <Text variant="headline">{line.name}</Text>
                  <Text variant="code" tone="muted">
                    {line.barcode}
                  </Text>
                </View>
                <Text variant="title" tabular>
                  {line.observed}
                  <Text variant="title" tone="tertiary">
                    {' / '}
                  </Text>
                  <Text variant="title" tone="muted">
                    {line.expected}
                  </Text>
                </Text>
              </View>
              <LineStatusLabel line={line} />
            </Animated.View>
          ) : !manual && camera.kind === 'ready' && !failed ? (
            <View style={styles.result}>
              <Text variant="headline">Point at a barcode</Text>
              <Text variant="footnote" tone="muted">
                Scanning pauses after each accepted unit, so one scan is always
                one unit.
              </Text>
            </View>
          ) : null}

          {camera.kind === 'checking' && !manual && (
            <Text variant="footnote" tone="muted">
              Starting the camera…
            </Text>
          )}
          {camera.kind === 'unavailable' && (
            <Text variant="footnote" tone="muted">
              {camera.reason}
            </Text>
          )}

          <Notice
            message={action.error}
            action={
              !manual ? (
                <Button label="Scan again" compact onPress={rearm} />
              ) : undefined
            }
          />

          {manual && (
            <TextField
              label="EAN-13 barcode"
              value={code}
              onChangeText={(value) => {
                setCode(value);
                if (failed) setFailed(false);
              }}
              placeholder="13 digits"
              hint="Include the check digit, the last number under the bars."
              mono
              keyboardType="number-pad"
              maxLength={13}
              autoFocus={!accepted}
            />
          )}

          <View style={styles.actions}>
            {manual ? (
              <>
                <Button
                  label="Add one unit"
                  icon="add"
                  busy={action.busy}
                  disabled={code.length !== 13}
                  onPress={() => {
                    gate.current.rearm();
                    void recordScan(code);
                  }}
                />
                {camera.kind === 'ready' && (
                  <Button
                    label="Use camera"
                    icon="scan"
                    variant="plain"
                    onPress={() => {
                      rearm();
                      setManual(false);
                    }}
                  />
                )}
                {camera.kind === 'unavailable' && camera.settings && (
                  <Button
                    label="Open Settings"
                    variant="secondary"
                    onPress={() => void Linking.openSettings()}
                  />
                )}
              </>
            ) : accepted ? (
              <>
                <Button label="Scan next unit" icon="scan" onPress={rearm} />
                <Button
                  label="Done"
                  variant="plain"
                  onPress={() => router.back()}
                />
              </>
            ) : (
              <Button
                label="Enter code manually"
                icon="keyboard"
                variant="secondary"
                onPress={() => {
                  rearm();
                  setManual(true);
                }}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  selected = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        selected && { backgroundColor: colors.accent },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon
        name={icon}
        size={18}
        color={selected ? colors.onAccent : '#FFFFFF'}
        weight="semibold"
      />
    </Pressable>
  );
}

/** A quiet rectangular reticle: four corner marks, nothing else. */
function Reticle({ color }: { color: string }) {
  const styles = useStyles();
  const corner = {
    borderColor: color,
    transitionProperty: 'borderColor',
    transitionDuration: motion.duration.quick,
    transitionTimingFunction: motion.css.easeOut,
  } as const;
  return (
    <View style={styles.reticle} pointerEvents="none">
      <Animated.View style={[styles.corner, styles.topLeft, corner]} />
      <Animated.View style={[styles.corner, styles.topRight, corner]} />
      <Animated.View style={[styles.corner, styles.bottomLeft, corner]} />
      <Animated.View style={[styles.corner, styles.bottomRight, corner]} />
    </View>
  );
}

const CORNER = 30;
const STROKE = 3;

const useStyles = createStyles(({ colors }) => ({
  root: { flex: 1, backgroundColor: '#05090E' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingBottom: space.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', color: '#FFFFFF' },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 34, 0.7)',
  },
  roundSpacer: { width: 44, height: 44 },
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
  },
  guide: {
    color: '#FFFFFF',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 34, 0.6)',
    overflow: 'hidden',
  },
  reticle: { width: 280, height: 168 },
  manualMark: { alignItems: 'center', gap: space.sm },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: radius.lg,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: radius.lg,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: radius.lg,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: radius.lg,
  },
  panel: {
    gap: space.lg,
    paddingTop: space.xl,
    paddingHorizontal: space.gutter,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    backgroundColor: colors.surface,
  },
  result: { gap: space.sm },
  resultTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  resultBody: { flex: 1, gap: space.xxs },
  actions: { gap: space.sm },
}));
