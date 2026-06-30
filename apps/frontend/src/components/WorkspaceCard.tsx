import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@reos/ui';
import { useStore } from '../store/useStore';

interface WorkspaceCardProps {
  title: string;
  icon: string; // label or emoji for visual simplicity
  status?: 'PASS' | 'WARNING' | 'ERROR' | 'PENDING';
  summaryText: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  title,
  icon,
  status = 'PENDING',
  summaryText,
  expanded,
  onToggle,
  children,
}) => {
  const theme = useStore((state) => state.theme);
  const activeColors = Colors[theme];

  // Get status color matching design token semantics
  const getStatusBorderColor = () => {
    switch (status) {
      case 'PASS':
        return activeColors.success;
      case 'WARNING':
        return activeColors.warning;
      case 'ERROR':
        return activeColors.error;
      case 'PENDING':
      default:
        return activeColors.border;
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'PASS':
        return activeColors.successLight;
      case 'WARNING':
        return activeColors.warningLight;
      case 'ERROR':
        return activeColors.errorLight;
      case 'PENDING':
      default:
        return activeColors.divider;
    }
  };

  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: activeColors.card,
      borderColor: getStatusBorderColor(),
      borderWidth: 1.5,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      ...Shadows[theme].md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      backgroundColor: getStatusBgColor(),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    iconText: {
      fontSize: 16,
    },
    title: {
      color: activeColors.textPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    arrow: {
      color: activeColors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    summaryText: {
      color: activeColors.textSecondary,
      fontSize: 13,
      marginTop: Spacing.xs,
    },
    body: {
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: activeColors.divider,
    }
  });

  return (
    <View style={cardStyles.card}>
      <TouchableOpacity style={cardStyles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={cardStyles.headerLeft}>
          <View style={cardStyles.iconContainer}>
            <Text style={cardStyles.iconText}>{icon}</Text>
          </View>
          <View>
            <Text style={cardStyles.title}>{title}</Text>
            {!expanded && <Text style={cardStyles.summaryText}>{summaryText}</Text>}
          </View>
        </View>
        <Text style={cardStyles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={cardStyles.body}>
          {children}
        </View>
      )}
    </View>
  );
};
