import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AreaName, areas, colors } from '../constants/theme';
import { useTasks } from '../hooks/useTasks';
import { WaveHeader } from '../components/WaveHeader';
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function toDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function fromDateKey(key: string) { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day); }
function displayDate(key: string) { return fromDateKey(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
export default function CreateTask() {
  const { area: param, taskId } = useLocalSearchParams<{ area?: AreaName; taskId?: string }>();
  const area = param && areas.includes(param) ? param : 'Health';
  const isEvent = area === 'Events';
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const task = taskId ? tasks[area].find(item => item.id === taskId) : undefined;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (deleteTimer.current) clearTimeout(deleteTimer.current); }, []);
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    if (task.dueDate) setMonth(() => { const date = fromDateKey(task.dueDate!); return new Date(date.getFullYear(), date.getMonth(), 1); });
  }, [task?.id]);
  const save = async () => {
    if (!title.trim()) { setError('Enter a task name.'); return; }
    setSaving(true); setError('');
    try {
      if (task) await updateTask(task, title.trim(), description.trim(), dueDate);
      else await addTask(area, title.trim(), description.trim(), dueDate);
      router.back();
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this task.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!task) return;
    setSaving(true); setError('');
    try {
      await deleteTask(task);
      setSuccess('Task deleted successfully');
      deleteTimer.current = setTimeout(() => router.back(), 1400);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete this task.'); }
    finally { setSaving(false); }
  };
  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const changeMonth = (amount: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const monthTitle = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <WaveHeader title={task ? (isEvent ? 'Edit event' : 'Edit task') : (isEvent ? 'Create event' : 'Create task')} left={<TouchableOpacity onPress={() => router.back()} style={s.closeIconButton} accessibilityRole="button" accessibilityLabel="Close"><MaterialCommunityIcons name="close" size={23} color={colors.white} /></TouchableOpacity>} right={task ? <TouchableOpacity disabled={saving} onPress={remove} style={s.deleteIconButton} accessibilityRole="button" accessibilityLabel={isEvent ? 'Delete event' : 'Delete task'}><MaterialCommunityIcons name="trash-can-outline" size={23} color="#B23E58" /></TouchableOpacity> : null} />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {success ? <View accessibilityRole="alert" style={s.successMessage}><MaterialCommunityIcons name="check-circle" size={19} color="#198754" /><Text style={s.successText}>{success}</Text></View> : null}
      <Text style={s.label}>{isEvent ? 'Event name' : 'Task name'}</Text><TextInput autoFocus value={title} onChangeText={setTitle} placeholder={isEvent ? 'Enter an event name' : 'Enter a task'} style={s.input} onSubmitEditing={() => setCalendarOpen(true)} returnKeyType="next" />
      <Text style={[s.label, { marginTop: 20 }]}>Description</Text><TextInput value={description} onChangeText={setDescription} placeholder="Add details (optional)" placeholderTextColor="#9AA4BB" style={s.descriptionInput} multiline textAlignVertical="top" />
      <Text style={[s.label, { marginTop: 20 }]}>Date</Text>
      <TouchableOpacity onPress={() => setCalendarOpen(open => !open)} style={s.dateField} accessibilityRole="button"><Text style={[s.dateText, !dueDate && s.placeholder]}>{dueDate ? displayDate(dueDate) : 'Choose a date'}</Text><Text style={s.calendarIcon}>▦</Text></TouchableOpacity>
      {calendarOpen && <View style={s.calendar}>
        <View style={s.monthRow}><TouchableOpacity onPress={() => changeMonth(-1)} style={s.monthArrow}><Text style={s.arrowText}>‹</Text></TouchableOpacity><Text style={s.monthTitle}>{monthTitle}</Text><TouchableOpacity onPress={() => changeMonth(1)} style={s.monthArrow}><Text style={s.arrowText}>›</Text></TouchableOpacity></View>
        <View style={s.weekRow}>{weekdays.map(day => <Text key={day} style={s.weekday}>{day}</Text>)}</View>
        <View style={s.daysGrid}>{days.map((day, index) => { if (day === null) return <View key={`empty-${index}`} style={s.dayCell} />; const date = new Date(month.getFullYear(), month.getMonth(), day); const key = toDateKey(date); const selected = key === dueDate; return <TouchableOpacity key={key} onPress={() => { setDueDate(key); setCalendarOpen(false); }} style={[s.dayCell, selected && s.daySelected]}><Text style={[s.dayText, selected && s.dayTextSelected]}>{day}</Text></TouchableOpacity>; })}</View>
      </View>}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TouchableOpacity disabled={saving} style={[s.button, saving && { opacity: 0.65 }]} onPress={save}><Text style={s.buttonText}>{saving ? 'Saving…' : task ? 'Save changes' : isEvent ? 'Create Event' : 'Create task'}</Text></TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, container: { flex: 1, maxWidth: 620, width: '100%', alignSelf: 'center' },
  closeIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, deleteIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFF0F2' },
  content: { padding: 22, paddingBottom: 32 }, label: { fontSize: 14, color: colors.ink, marginBottom: 9, fontWeight: '600' }, input: { height: 48, borderWidth: 1, borderColor: '#B9D5FF', borderRadius: 10, backgroundColor: colors.white, paddingHorizontal: 12, fontSize: 14, color: colors.ink },
  descriptionInput: { minHeight: 92, borderWidth: 1, borderColor: '#B9D5FF', borderRadius: 10, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.ink },
  dateField: { minHeight: 48, borderWidth: 1, borderColor: '#B9D5FF', borderRadius: 10, backgroundColor: colors.white, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dateText: { fontSize: 13, color: colors.ink }, placeholder: { color: colors.muted }, calendarIcon: { color: colors.blue, fontSize: 20 },
  calendar: { marginTop: 10, padding: 14, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line }, monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, monthTitle: { fontSize: 14, color: colors.ink, fontWeight: '700' }, monthArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, arrowText: { fontSize: 24, lineHeight: 28, color: colors.ink },
  weekRow: { flexDirection: 'row' }, weekday: { width: '14.2857%', textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '600', paddingVertical: 7 }, daysGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }, dayText: { color: colors.ink, fontSize: 13 }, daySelected: { backgroundColor: colors.blue }, dayTextSelected: { color: colors.white, fontWeight: '700' },
  successMessage: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F7EE', borderRadius: 9, padding: 12, marginBottom: 18 }, successText: { color: '#176C3A', fontSize: 13, fontWeight: '600' }, error: { color: '#B23E58', marginTop: 14, fontSize: 12 }, button: { backgroundColor: colors.blue, borderRadius: 8, padding: 13, alignItems: 'center', marginTop: 20 }, buttonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
