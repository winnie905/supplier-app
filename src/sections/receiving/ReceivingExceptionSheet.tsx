import { Text } from 'design-system-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { CornerCheckOption } from '@/components/CornerCheckOption';
import { FlatButton } from '@/components/FlatButton';
import { DrawerModal } from '@/components/SelectionModal';

interface ReceivingExceptionSheetProps {
  visible: boolean;
  title?: string;
  tags: string[];
  types: readonly string[];
  selectedType: string;
  description: string;
  maxDescriptionLength?: number;
  onClose: () => void;
  onTypeChange: (type: string) => void;
  onDescriptionChange: (text: string) => void;
  onSubmit: () => void;
}

export const ReceivingExceptionSheet = ({
  visible,
  title = '异常上报',
  tags,
  types,
  selectedType,
  description,
  maxDescriptionLength = 50,
  onClose,
  onTypeChange,
  onDescriptionChange,
  onSubmit,
}: ReceivingExceptionSheetProps) => (
  <DrawerModal
    visible={visible}
    title={title}
    onClose={onClose}
    height="auto"
    footer={
      <FlatButton onPress={onSubmit} style={styles.submit} textStyle={styles.submitText}>
        提交
      </FlatButton>
    }
  >
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

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        异常类型<Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.typeWrap}>
        {types.map((type) => (
          <CornerCheckOption
            key={type}
            label={type}
            selected={type === selectedType}
            onPress={() => onTypeChange(type)}
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
