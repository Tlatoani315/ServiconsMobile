import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, type TextInputProps } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { type AuthAutofillRole } from '../lib/authAutofill';
import { AutofillTextInput } from './AutofillTextInput';
import {
  getPasswordRules,
  getPasswordStrengthFromRules,
  type ValidationRule,
} from '../lib/authValidation';
import { ValidationChecklist } from './ValidationChecklist';

type Props = TextInputProps & {
  label: string;
  autofillRole?: AuthAutofillRole;
  showToggle?: boolean;
  showPasswordRules?: boolean;
  validationRules?: ValidationRule[];
  validationTitle?: string;
  showValidation?: boolean;
  isValid?: boolean;
  delay?: number;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function AuthTextField({
  label,
  autofillRole,
  showToggle,
  showPasswordRules,
  validationRules,
  validationTitle,
  showValidation = false,
  isValid,
  delay = 0,
  value,
  onChangeText,
  secureTextEntry,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(showToggle ? true : Boolean(secureTextEntry));
  const focus = useSharedValue(0);
  const entrance = useSharedValue(0);

  const text = typeof value === 'string' ? value : '';
  const passwordRules = showPasswordRules ? getPasswordRules(text) : [];
  const strength = showPasswordRules ? getPasswordStrengthFromRules(passwordRules) : null;
  const rulesToShow = showPasswordRules ? passwordRules : (validationRules ?? []);
  const checklistVisible = showValidation && (focused || text.length > 0) && rulesToShow.length > 0;

  const fieldValid = isValid ?? (showPasswordRules ? strength?.isValid : rulesToShow.every((r) => r.met));

  useEffect(() => {
    entrance.value = withDelay(
      delay,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, entrance]);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, focus]);

  const containerStyle = useAnimatedStyle(() => {
    const focusColor = '#F97316';
    const idleColor = '#2D5A45';
    const errorColor = '#DC2626';
    const okColor = '#1B7A4E';
    const target =
      focused ? focusColor : text.length > 0 && !fieldValid && showValidation ? errorColor : text.length > 0 && fieldValid ? okColor : idleColor;

    return {
      opacity: entrance.value,
      transform: [{ translateY: (1 - entrance.value) * 12 }],
      borderColor: interpolateColor(focus.value, [0, 1], [target, focusColor]),
      borderWidth: 1 + focus.value * 0.5,
    };
  });

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-servi-suave">{label}</Text>

      <AnimatedView
        className="flex-row items-center rounded-xl bg-servi-superficie"
        style={containerStyle}
      >
        <AutofillTextInput
          className="flex-1 px-4 py-3.5 text-base text-servi-texto"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          placeholderTextColor="#A7C4B5"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autofillRole={autofillRole}
          {...rest}
        />

        {showToggle ? (
          <Pressable
            className="px-4 py-3"
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={focused ? '#F97316' : '#A7C4B5'}
            />
          </Pressable>
        ) : null}
      </AnimatedView>

      {showPasswordRules && text.length > 0 && strength ? (
        <View className="mt-2">
          <View className="h-1.5 overflow-hidden rounded-full bg-servi-borde">
            <View
              className="h-full rounded-full"
              style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
            />
          </View>
          <Text className="mt-1 text-xs" style={{ color: strength.color }}>
            Nivel: {strength.label}
          </Text>
        </View>
      ) : null}

      <ValidationChecklist
        title={validationTitle ?? (showPasswordRules ? 'Requisitos de contrasena' : 'Requisitos')}
        rules={rulesToShow}
        visible={checklistVisible}
      />
    </View>
  );
}
