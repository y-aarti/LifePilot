import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AreaName, areas, colors } from '../constants/theme';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { WaveHeader } from '../components/WaveHeader';
const areaIcons: Record<AreaName, string> = { Health: '♥', Wealth: '$', Career: '▣', Personal: '✦', Events: '▦' };
function taskDateLabel(key: string) { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
function isPastDate(key: string | null) { if (!key) return false; const [year, month, day] = key.split('-').map(Number); const date = new Date(year, month - 1, day); const today = new Date(); today.setHours(0, 0, 0, 0); return date < today; }
export default function Home() {
  const [selected, setSelected] = useState<AreaName>('Health');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [taskNotice, setTaskNotice] = useState('');
  const [animatingTaskId, setAnimatingTaskId] = useState<string | null>(null);
  const drawerX = useRef(new Animated.Value(-310)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const noticeOpacity = useRef(new Animated.Value(0)).current;
  const noticeY = useRef(new Animated.Value(18)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { tasks, error: taskError, toggleTask } = useTasks();
  const { signOut } = useAuth();
  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);
  const handleToggleTask = (task: (typeof tasks)[AreaName][number]) => {
    setAnimatingTaskId(task.id);
    checkScale.setValue(1);
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 1.32, duration: 110, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, speed: 24, bounciness: 8, useNativeDriver: true }),
    ]).start();
    setTaskNotice(task.completed ? `${task.title} marked not done` : `${task.title} completed`);
    noticeOpacity.setValue(0);
    noticeY.setValue(18);
    Animated.parallel([
      Animated.timing(noticeOpacity, { toValue: 1, duration: 170, useNativeDriver: true }),
      Animated.spring(noticeY, { toValue: 0, speed: 20, bounciness: 4, useNativeDriver: true }),
    ]).start();
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(noticeOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(noticeY, { toValue: 12, duration: 220, useNativeDriver: true }),
      ]).start(() => setTaskNotice(''));
    }, 2400);
    toggleTask(task).catch(() => {});
  };
  const openDrawer = () => { setDrawerVisible(true); setDrawerOpen(true); drawerX.setValue(-310); scrimOpacity.setValue(0); Animated.parallel([Animated.timing(drawerX, { toValue: 0, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: true }), Animated.timing(scrimOpacity, { toValue: 1, duration: 200, useNativeDriver: true })]).start(); };
  const closeDrawer = () => { Animated.parallel([Animated.timing(drawerX, { toValue: -310, duration: 190, easing: Easing.in(Easing.cubic), useNativeDriver: true }), Animated.timing(scrimOpacity, { toValue: 0, duration: 170, useNativeDriver: true })]).start(({ finished }) => { if (finished) { setDrawerVisible(false); setDrawerOpen(false); } }); };
  const chooseArea = (area: AreaName) => { if (area !== selected) { pageOpacity.setValue(0.35); Animated.timing(pageOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start(); } setSelected(area); if (drawerOpen) closeDrawer(); };
  const navigation = <><View style={styles.drawerHeader}><Text style={styles.brand}>Life</Text><TouchableOpacity onPress={closeDrawer} style={styles.closeButton} accessibilityLabel="Close menu"><Text style={styles.closeGlyph}>‹</Text></TouchableOpacity></View><View style={styles.divider} />{areas.map(area => <TouchableOpacity key={area} style={[styles.navItem, selected === area && styles.selected]} onPress={() => chooseArea(area)}><Text style={styles.areaIcon}>{areaIcons[area]}</Text><Text style={[styles.navText, selected === area && styles.selectedText]}>{area}</Text></TouchableOpacity>)}<TouchableOpacity style={styles.logoutItem} accessibilityRole="button" onPress={() => { signOut().then(closeDrawer).catch(() => {}); }}><MaterialCommunityIcons name="logout" size={20} color="#25D8F2" /><Text style={styles.logoutText}>Log out</Text></TouchableOpacity></>;
  return <SafeAreaView style={styles.safe}><View style={styles.shell}>
    <View style={styles.rail}><TouchableOpacity onPress={openDrawer} style={styles.railMenu} accessibilityLabel="Open menu"><Text style={styles.railMenuGlyph}>☰</Text></TouchableOpacity><View style={styles.railOptions}>{areas.map(area => <TouchableOpacity key={area} onPress={() => chooseArea(area)} style={[styles.railOption, selected === area && styles.railOptionSelected]} accessibilityLabel={area} accessibilityState={{ selected: selected === area }}><Text style={[styles.railIcon, selected === area && styles.railIconSelected]}>{areaIcons[area]}</Text></TouchableOpacity>)}</View></View>
    <View style={styles.main}><WaveHeader title={selected} /><Animated.ScrollView style={{ opacity: pageOpacity }} contentContainerStyle={styles.content}><Text style={styles.sectionLabel}>{selected === 'Events' ? 'EVENTS' : 'TASKS'}</Text>{taskError ? <Text style={styles.taskError}>{taskError}</Text> : null}{tasks[selected].map((task, index) => { const isEvent = selected === 'Events'; const pastEvent = isEvent && isPastDate(task.dueDate); const taskIcon = isEvent ? 'calendar-star' : task.id.includes('-water-') ? 'cup-water' : task.id.endsWith('-walk') ? 'walk' : null; return <Pressable key={task.id} accessibilityRole="button" accessibilityLabel={`${isEvent ? 'Edit event' : 'Edit task'} ${task.title}`} onPress={() => router.push({ pathname: '/create-task', params: { area: selected, taskId: task.id } })} style={[styles.task, pastEvent && styles.pastEvent]}>{!isEvent && <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`Mark ${task.title} ${task.completed ? 'incomplete' : 'complete'}`} onPress={event => { event.stopPropagation(); handleToggleTask(task); }} style={[styles.taskMarker, { borderColor: index % 2 === 0 ? colors.magenta : colors.blue }, task.completed && styles.taskMarkerComplete]}><Animated.View style={{ transform: [{ scale: animatingTaskId === task.id ? checkScale : 1 }] }}>{task.completed && <Text style={styles.checkMark}>✓</Text>}</Animated.View></TouchableOpacity>}{taskIcon && <MaterialCommunityIcons name={taskIcon} size={22} color={pastEvent || task.completed ? colors.muted : colors.blue} style={styles.taskIcon} accessibilityLabel={isEvent ? 'Event' : taskIcon === 'cup-water' ? 'Water' : 'Walking'} />}<View style={{ flex: 1 }}><Text style={[styles.taskText, task.completed && styles.taskTextComplete, pastEvent && styles.pastEventText]}>{task.title}</Text>{task.description ? <Text style={[styles.taskDescription, task.completed && styles.taskTextComplete, pastEvent && styles.pastEventText]}>{task.description}</Text> : null}{task.dueDate ? <Text style={[styles.taskDate, task.completed && styles.taskTextComplete, pastEvent && styles.pastEventText]}>{taskDateLabel(task.dueDate)}</Text> : null}</View></Pressable>; })}</Animated.ScrollView>{taskNotice ? <Animated.View accessibilityRole="alert" style={[styles.taskNotice, { opacity: noticeOpacity, transform: [{ translateY: noticeY }] }]}><MaterialCommunityIcons name={taskNotice.endsWith('completed') ? 'check-circle' : 'checkbox-blank-circle-outline'} size={20} color="#FFFFFF" /><Text style={styles.taskNoticeText} numberOfLines={1}>{taskNotice}</Text></Animated.View> : null}<TouchableOpacity accessibilityLabel={selected === 'Events' ? 'Add event' : 'Create task'} style={styles.fab} onPress={() => router.push({ pathname: '/create-task', params: { area: selected } })}><Text style={styles.fabPlus}>＋</Text></TouchableOpacity></View>
    {drawerVisible && <View style={styles.drawerLayer}><Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}><TouchableOpacity accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={closeDrawer} /></Animated.View><Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>{navigation}</Animated.View></View>}
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, shell: { flex: 1, flexDirection: 'row' },
  rail: { width: 70, backgroundColor: '#EAF3FF', borderRightWidth: 1, borderColor: colors.line, alignItems: 'center', paddingTop: 20, paddingHorizontal: 9 }, railMenu: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', marginBottom: 25 }, railMenuGlyph: { color: colors.ink, fontSize: 18 }, railOptions: { gap: 16 },
  railOption: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, shadowColor: '#47577E', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, railOptionSelected: { backgroundColor: colors.blue }, railIcon: { color: colors.blue, fontSize: 19, fontWeight: '700' }, railIconSelected: { color: colors.white },
  drawerHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, brand: { fontSize: 24, fontWeight: '700', color: colors.white, letterSpacing: -0.5 }, closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, closeGlyph: { color: '#24D8F2', fontSize: 32, lineHeight: 34 }, divider: { height: 1, backgroundColor: 'rgba(134,218,255,0.24)', marginBottom: 12 },
  navItem: { minHeight: 49, paddingVertical: 12, paddingHorizontal: 13, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 16 }, selected: { backgroundColor: 'rgba(255,255,255,0.10)' }, navText: { fontSize: 15, color: '#F2F4FF' }, selectedText: { color: colors.white, fontWeight: '700' }, areaIcon: { width: 21, color: '#25D8F2', fontSize: 19, fontWeight: '700', textAlign: 'center' }, logoutItem: { minHeight: 52, marginTop: 'auto', marginHorizontal: -25, paddingHorizontal: 38, borderTopWidth: 1, borderTopColor: 'rgba(134,218,255,0.24)', flexDirection: 'row', alignItems: 'center', gap: 15 }, logoutText: { color: colors.white, fontSize: 15 }, main: { flex: 1 },
  content: { padding: 24, paddingTop: 18, paddingBottom: 110, maxWidth: 800, width: '100%', alignSelf: 'center' }, fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: colors.blue, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, fabPlus: { color: colors.white, fontSize: 34, fontWeight: '300', lineHeight: 38 }, sectionLabel: { fontSize: 10, letterSpacing: 1.5, color: colors.muted, fontWeight: '700', marginBottom: 12 },
  task: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 13, shadowColor: '#465780', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }, pastEvent: { opacity: 0.58 }, pastEventText: { color: colors.muted }, taskMarker: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, taskMarkerComplete: { backgroundColor: colors.blue, borderColor: colors.blue }, checkMark: { color: colors.white, fontSize: 12, lineHeight: 15, fontWeight: '700' }, taskIcon: { width: 23 }, taskText: { color: colors.ink, fontSize: 14 }, taskTextComplete: { textDecorationLine: 'line-through', color: colors.muted }, taskDescription: { color: '#596585', fontSize: 12, marginTop: 5, lineHeight: 17 }, taskDate: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 5 }, taskError: { color: '#B23E58', marginBottom: 12, fontSize: 12 }, taskNotice: { position: 'absolute', left: 20, right: 96, bottom: 31, minHeight: 48, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.navy, shadowColor: '#162653', shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }, taskNoticeText: { color: colors.white, fontSize: 13, fontWeight: '600', flex: 1 }, drawerLayer: { ...StyleSheet.absoluteFill, flexDirection: 'row', zIndex: 5 }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11,24,62,0.42)' }, drawer: { width: 300, maxWidth: '82%', backgroundColor: colors.navy, paddingHorizontal: 25, paddingTop: 34, gap: 8, zIndex: 1, elevation: 6 },
});
