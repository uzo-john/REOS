import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@reos/ui';
import { useStore } from '../store/useStore';
import { generateDesignPdf } from '../store/pdfGenerator';

interface DownloadReportButtonProps {
  compact?: boolean; // if true, show a smaller icon-only version
}

export const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({ compact = false }) => {
  const { theme, inputs, results } = useStore();
  const activeColors = Colors[theme];
  const [isGenerating, setIsGenerating] = useState(false);

  const hasResults = !!results.load && !!results.solar && !!results.battery && !!results.inverter;

  const styles = StyleSheet.create({
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hasResults ? activeColors.primary : activeColors.divider,
      borderRadius: BorderRadius.sm,
      paddingVertical: compact ? 6 : Spacing.sm,
      paddingHorizontal: compact ? 10 : Spacing.md,
      gap: 6,
      borderWidth: hasResults ? 0 : 1,
      borderColor: activeColors.border,
    },
    btnText: {
      color: hasResults ? '#fff' : activeColors.textSecondary,
      fontWeight: '700',
      fontSize: compact ? 12 : 14,
    },
    icon: {
      fontSize: compact ? 14 : 16,
    },
    hintText: {
      color: activeColors.textSecondary,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 4,
    }
  });

  const handleDownload = async () => {
    if (!hasResults || isGenerating) return;

    // jsPDF only works in web (browser) context
    if (Platform.OS !== 'web') {
      alert('PDF download is only available in the web browser version of REOS.');
      return;
    }

    setIsGenerating(true);
    try {
      // Small delay to allow spinner to render before blocking PDF generation
      await new Promise(r => setTimeout(r, 100));
      await generateDesignPdf({ inputs, results });
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={handleDownload} disabled={!hasResults || isGenerating}>
        {isGenerating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.icon}>📄</Text>
        )}
        {!compact && (
          <Text style={styles.btnText}>
            {isGenerating ? 'Generating PDF...' : 'Download Design Report'}
          </Text>
        )}
        {compact && (
          <Text style={styles.btnText}>PDF</Text>
        )}
      </TouchableOpacity>
      {!hasResults && !compact && (
        <Text style={styles.hintText}>Run calculations first to enable download</Text>
      )}
    </View>
  );
};
