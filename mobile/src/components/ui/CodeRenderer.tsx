import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import Highlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { IconCopy, IconCheck } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';

interface CodeRendererProps {
  code: string;
  language?: string;
}

const FONT_FAMILY = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const FONT_SIZE = 13;
const LINE_HEIGHT = 20;

export default function CodeRenderer({ code, language }: CodeRendererProps) {
  const [copied, setCopied] = useState(false);

  // Clean styles to remove any web-only or conflicting properties
  const cleanStylesheet = useMemo(() => {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(atomOneDark)) {
      if (typeof value === 'object' && value !== null) {
        const { display, overflowX, ...rest } = value as Record<string, any>;
        clean[key] = rest;
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }, []);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const renderNode = (nodes: any[], key = '0'): any => {
    return nodes.reduce((acc: any[], node: any, idx: number) => {
      const nodeKey = `${key}.${idx}`;

      if (node.children) {
        const classNames: string[] = node.properties?.className || [];
        const matchedStyles = classNames.map((c) => cleanStylesheet[c]).filter(Boolean);

        const childElement = (
          <Text
            key={nodeKey}
            style={[
              {
                color: cleanStylesheet.hljs?.color || '#abb2bf',
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE,
                lineHeight: LINE_HEIGHT,
              },
              ...matchedStyles,
            ]}
          >
            {renderNode(node.children, nodeKey)}
          </Text>
        );
        acc.push(childElement);
      } else if (node.value) {
        acc.push(node.value);
      }

      return acc;
    }, []);
  };

  const nativeRenderer = ({ rows }: { rows: any[] }) => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.codeContent}
      >
        <Text
          style={[
            styles.baseCodeText,
            { color: cleanStylesheet.hljs?.color || '#abb2bf' },
          ]}
        >
          {renderNode(rows)}
        </Text>
      </ScrollView>
    );
  };

  const normalizedLanguage = (language || '').toLowerCase().trim();

  return (
    <View style={styles.container}>
      <View style={styles.langBar}>
        <Text style={styles.langLabel}>{normalizedLanguage || 'code'}</Text>
        <Pressable onPress={handleCopy} style={styles.copyBtn} hitSlop={8}>
          {copied ? (
            <View style={styles.copyRow}>
              <IconCheck size={14} color="#1F9D55" />
              <Text style={[styles.copyText, { color: '#1F9D55' }]}>Copied</Text>
            </View>
          ) : (
            <View style={styles.copyRow}>
              <IconCopy size={14} color="#8B8BA0" />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.codeWrap}>
        <Highlighter
          language={normalizedLanguage || 'plaintext'}
          style={cleanStylesheet}
          customStyle={{ padding: 0, margin: 0, backgroundColor: 'transparent' }}
          CodeTag={View}
          PreTag={View}
          renderer={nativeRenderer}
        >
          {code}
        </Highlighter>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: '#1E1E2A',
  },
  langBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  langLabel: {
    color: '#8B8BA0',
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  copyBtn: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    color: '#8B8BA0',
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.xs,
  },
  codeWrap: {
    width: '100%',
    paddingVertical: spacing.sm,
  },
  codeContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  baseCodeText: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  },
});
