import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export function WaveHeader({ title, subtitle, left, right, align = 'left' }: { title: string; subtitle?: string; left?: ReactNode; right?: ReactNode; align?: 'left' | 'center' }) {
  return <View style={styles.header}>
    <View pointerEvents="none" style={[styles.blob, styles.blobOne]} />
    <View pointerEvents="none" style={[styles.blob, styles.blobTwo]} />
    <View pointerEvents="none" style={[styles.dot, styles.dotOne]} />
    <View pointerEvents="none" style={[styles.dot, styles.dotTwo]} />
    <View style={[styles.row, align === 'center' && styles.centerRow]}>
      <View style={styles.action}>{left}</View>
      <Text style={[styles.title, align === 'center' && styles.centerTitle]}>{title}</Text>
      <View style={[styles.action, styles.rightAction]}>{right}</View>
    </View>
    {subtitle ? <Text style={[styles.subtitle, align === 'center' && styles.centerSubtitle]}>{subtitle}</Text> : null}
    <View pointerEvents="none" style={styles.wave} />
  </View>;
}

const styles = StyleSheet.create({
  header: { height: 185, paddingTop: 26, paddingHorizontal: 25, backgroundColor: colors.blue, overflow: 'hidden' },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 },
  centerRow: { justifyContent: 'center' },
  action: { minWidth: 42, alignItems: 'flex-start', justifyContent: 'center' },
  rightAction: { alignItems: 'flex-end' },
  title: { color: colors.white, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5, flex: 1 },
  centerTitle: { flex: 0 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20, marginTop: 5, zIndex: 1 },
  centerSubtitle: { textAlign: 'center' },
  blob: { position: 'absolute', backgroundColor: '#0053CC', borderRadius: 999 },
  blobOne: { width: 240, height: 130, right: -44, top: 35, transform: [{ rotate: '-18deg' }], opacity: 0.45 },
  blobTwo: { width: 190, height: 100, left: -76, top: 78, transform: [{ rotate: '20deg' }], opacity: 0.4 },
  dot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#55A6FF', opacity: 0.45 },
  dotOne: { top: 39, right: '35%' },
  dotTwo: { top: 102, right: '16%', width: 9, height: 9, borderRadius: 5 },
  wave: { position: 'absolute', width: '135%', height: 70, bottom: -48, left: '-13%', backgroundColor: colors.paper, borderRadius: 100 },
});
