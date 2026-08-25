import { Text } from 'design-system-native';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import { CornerCheckOption } from '@/components/CornerCheckOption';
import { FlatButton } from '@/components/FlatButton';
import { DrawerModal } from '@/components/SelectionModal';

interface ReceivingExceptionSheetProps {
  visible: boolean;
  title?: string;
  tags: string[];
  types: readonly string[];
  selectedTypes: string[];
  description: string;
  maxDescriptionLength?: number;
  /** 默认多选；物料 / 裁床异常上报为单选 */
  selectionMode?: 'single' | 'multiple';
  onClose: () => void;
  onTypesChange: (types: string[]) => void;
  onDescriptionChange: (text: string) => void;
  onSubmit: () => void;
}

export const ReceivingExceptionSheet = ({
  visible,
  title = '异常上报',
  tags,
  types,
  selectedTypes,
  description,
  maxDescriptionLength = 50,
  selectionMode = 'multiple',
  onClose,
  onTypesChange,
  onDescriptionChange,
  onSubmit,
}: ReceivingExceptionSheetProps) => {
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    onSubmit();
  };

  const toggleType = (type: string) => {
    if (selectionMode === 'single') {
      onTypesChange(selectedTypes.includes(type) ? [] : [type]);
      return;
    }
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((item) => item !== type));
      return;
    }
    onTypesChange([...selectedTypes, type]);
  };

  return (
    <DrawerModal
      visible={visible}
      title={title}
      onClose={handleClose}
      height="auto"
      footer={
        <FlatButton onPress={handleSubmit} style={styles.submit} textStyle={styles.submitText}>
          提交
        </FlatButton>
      }
    >
      {tags.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>异常内容</Text>
          <View style={styles.tagWrap}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          异常类型<Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.typeWrap}>
          {types.map((type) => (
            <CornerCheckOption
              key={type}
              label={type}
              selected={selectedTypes.includes(type)}
              onPress={() => toggleType(type)}
              style={styles.typeItem}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.optionalTitle}>问题描述（可选）</Text>
        <View style={styles.textareaWrap}>
          <TextInput
            maxLength={maxDescriptionLength}
            multiline
            onChangeText={onDescriptionChange}
            placeholder="请输入"
            placeholderTextColor="#A8BBD4"
            style={styles.textarea}
            value={description}
          />
          <Text style={styles.counter}>
            ({description.length}/{maxDescriptionLength})
          </Text>
        </View>
      </View>
    </DrawerModal>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#021626',
  },
  required: {
    color: '#E5484D',
  },
  optionalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A98AD',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E8F8EF',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#1A9F5C',
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeItem: {
    width: '48%',
    flexGrow: 1,
    maxWidth: '48.5%',
  },
  textareaWrap: {
    minHeight: 100,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
  },
  textarea: {
    minHeight: 72,
    fontSize: 14,
    color: '#021626',
    textAlignVertical: 'top',
    padding: 0,
  },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    fontSize: 12,
    color: '#8A98AD',
  },
  submit: {
    height: 45,
    borderRadius: 8,
  },
  submitText: {
    fontSize: 18,
  },
});
