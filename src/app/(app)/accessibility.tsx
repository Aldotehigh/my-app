import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '../../context/PreferencesContext';

const guideSections = [
  {
    title: 'Enable VoiceOver',
    body: 'On iPhone, open Settings, Accessibility, VoiceOver. Enable it there.',
  },
  {
    title: 'Move between controls',
    body: 'Swipe right or left with one finger to move to the next or previous element. Double-tap anywhere to activate the selected control.',
  },
  {
    title: 'Explore the menu',
    body: 'In the menu, each dish is announced with its name, price and availability. Activate a dish to open its details.',
  },
  {
    title: 'Search and filter',
    body: 'Select Search dishes, type a name and activate Search. Open Category to select a section. All categories removes the category filter.',
  },
  {
    title: 'Save your favorites',
    body: 'In the dish details, activate Save to favorites or Remove from favorites. Open My favorites from the menu to review your list.',
  },
  {
    title: 'Scroll and go back',
    body: 'Swipe up or down with three fingers to scroll. Use the back button in the navigation bar to return to the previous screen.',
  },
  {
    title: 'Display and movement',
    body: 'For larger text on iPhone, open Settings, Accessibility, Display & Text Size, Larger Text. For fewer animations, open Settings, Accessibility, Motion, Reduce Motion.',
  },
];

export default function AccessibilityScreen() {
  const { colors, t } = usePreferences();
  const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, gap: 20, backgroundColor: colors.background },
    heading: { fontSize: 28, color: colors.text, fontWeight: '700' },
    section: { padding: 20, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    title: { color: colors.text, fontSize: 21, fontWeight: '700' },
    body: { color: colors.muted, fontSize: 17 },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>{t('VoiceOver navigation guide')}</Text>
      <Text style={styles.body}>{t('VoiceOver uses the iPhone voice and pronunciation settings.')}</Text>
      {guideSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text accessibilityRole="header" style={styles.title}>{t(section.title)}</Text>
          <Text style={styles.body}>{t(section.body)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
