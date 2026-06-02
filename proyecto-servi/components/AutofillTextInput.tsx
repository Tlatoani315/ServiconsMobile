import { forwardRef, useCallback, type ReactNode } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputChangeEventData,
  type TextInputEndEditingEventData,
  type TextInputProps,
} from 'react-native';

import { getAuthAutofillProps, type AuthAutofillRole } from '../lib/authAutofill';

type Props = TextInputProps & {
  autofillRole?: AuthAutofillRole;
};

/**
 * TextInput que sincroniza el autofill nativo (Google / iCloud) con el estado de React.
 * Sin onChange, Android rellena el campo visualmente pero React lo borra al re-renderizar.
 */
export const AutofillTextInput = forwardRef<TextInput, Props>(function AutofillTextInput(
  { autofillRole, value, onChangeText, onChange, onEndEditing, ...rest },
  ref,
) {
  const autofillProps = autofillRole ? getAuthAutofillProps(autofillRole) : {};

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText?.(text);
    },
    [onChangeText],
  );

  const handleChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      onChange?.(event);
      const text = event.nativeEvent.text;
      if (typeof value === 'string' && text !== value) {
        onChangeText?.(text);
      }
    },
    [onChange, onChangeText, value],
  );

  const handleEndEditing = useCallback(
    (event: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      onEndEditing?.(event);
      const text = event.nativeEvent.text;
      if (typeof value === 'string' && text !== value) {
        onChangeText?.(text);
      }
    },
    [onEndEditing, onChangeText, value],
  );

  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={handleChangeText}
      onChange={handleChange}
      onEndEditing={handleEndEditing}
      {...autofillProps}
      {...rest}
    />
  );
});

type LoginFormProps = {
  children: ReactNode;
};

/** Agrupa correo + contraseña para que Google Autofill los detecte como un mismo formulario. */
export function LoginAutofillForm({ children }: LoginFormProps) {
  return <View>{children}</View>;
}
