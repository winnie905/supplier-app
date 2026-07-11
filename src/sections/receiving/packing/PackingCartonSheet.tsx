import { Pressable, StyleSheet, Text, View } from 'react-native';

import CheckIcon from '@/assets/icons/check.svg';
import { FlatButton } from '@/components/FlatButton';
import { ReceivingBottomSheet } from '@/sections/receiving/ReceivingBottomSheet';
import type { CartonSpec } from '@/types/receiving';

import { formatCartonDim } from './utils';

export const PackingCartonSheet = ({
  visible,
  cartonSpecs,
  pendingCartonId,
  onSelect,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  cartonSpecs: CartonSpec[];
  pendingCartonId: string | undefined;
  onSelect: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <ReceivingBottomSheet
    visible={visible}
    title="更换箱子"
    onClose={onClose}
    footer={
      <FlatButton
        disabled={!pendingCartonId}
        onPress={onConfirm}
        style={styles.sheetSubmit}
        textStyle={styles.sheetSubmitText}
      >
        提交
      </FlatButton>
    }
  >
    <View style={styles.cartonList}>
      {cartonSpecs.map((spec) => {
        const selected = spec.id === pendingCartonId;
        return (
          <Pressable
            key={spec.id}
            accessibilityRole="button"
            onPress={() => onSelect(spec.id)}
            style={[styles.cartonOption, selected && styles.cartonOptionSelected]}
          >
            {spec.tag ? (
              <View
                style={[
                  styles.cartonTag,
                  spec.tag === '最常用' ? styles.cartonTagHot : styles.cartonTagCommon,
                ]}
              >
                <Text
                  style={[
                    styles.cartonTagText,
                    spec.tag === '最常用' ? styles.cartonTagTextHot : styles.cartonTagTextCommon,
                  ]}
                >
                  {spec.tag}
                </Text>
              </View>
            ) : null}
            <Text style={styles.cartonName}>
              {spec.name}({formatCartonDim(spec)})
            </Text>
            {selected ? (
              <View style={styles.cartonCorner}>
                <View style={styles.cartonCornerTriangle} />
                <View style={styles.cartonCornerCheck}>
                  <CheckIcon color="#FFFFFF" height={8} width={8} />
                </View>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  </ReceivingBottomSheet>
);

const styles = StyleSheet.create({
  cartonList: {
    gap: 10,
  },
  cartonOption: {
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EBF3',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cartonOptionSelected: {
    borderColor: '#0958D9',
    backgroundColor: '#EEF5FF',
  },
  cartonTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomRightRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cartonTagHot: {
    backgroundColor: '#E8F8EF',
  },
  cartonTagCommon: {
    backgroundColor: '#FFF3E6',
  },
  cartonTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cartonTagTextHot: {
    color: '#1A9F5C',
  },
  cartonTagTextCommon: {
    color: '#F79009',
  },
  cartonName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#021626',
  },
  cartonCorner: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
  },
  cartonCornerTriangle: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderBottomWidth: 24,
    borderLeftWidth: 24,
    borderBottomColor: '#0958D9',
    borderLeftColor: 'transparent',
  },
  cartonCornerCheck: {
    position: 'absolute',
    right: 2,
    bottom: 2,
  },
  sheetSubmit: {
    height: 45,
    borderRadius: 8,
  },
  sheetSubmitText: {
    fontSize: 18,
  },
});
