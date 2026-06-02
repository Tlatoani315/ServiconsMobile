import { Platform, type TextInputProps } from 'react-native';

export type AuthAutofillRole =
  | 'name'
  | 'email'
  | 'loginIdentifier'
  | 'password'
  | 'newPassword'
  | 'confirmPassword';

const PASSWORD_RULES =
  'minlength: 8; required: lower; required: upper; required: digit; required: special;';

export function getAuthAutofillProps(role: AuthAutofillRole): TextInputProps {
  switch (role) {
    case 'name':
      return {
        textContentType: 'name',
        autoComplete: 'name',
        importantForAutofill: 'yes',
        autoCapitalize: 'words',
      };
    case 'email':
      return {
        textContentType: 'emailAddress',
        autoComplete: 'email',
        importantForAutofill: 'yes',
        autoCapitalize: 'none',
        autoCorrect: false,
        keyboardType: 'email-address',
      };
    case 'loginIdentifier':
      return Platform.select({
        ios: {
          textContentType: 'username',
          autoComplete: 'username',
          importantForAutofill: 'yes',
          autoCapitalize: 'none',
          autoCorrect: false,
          keyboardType: 'email-address',
        },
        android: {
          autoComplete: 'email',
          importantForAutofill: 'yes',
          autoCapitalize: 'none',
          autoCorrect: false,
          keyboardType: 'email-address',
        },
        default: {
          autoComplete: 'email',
          importantForAutofill: 'yes',
          autoCapitalize: 'none',
          autoCorrect: false,
          keyboardType: 'email-address',
        },
      }) as TextInputProps;
    case 'password':
      return {
        textContentType: 'password',
        autoComplete: 'current-password',
        importantForAutofill: 'yes',
      };
    case 'newPassword':
      return {
        textContentType: 'newPassword',
        autoComplete: 'new-password',
        importantForAutofill: 'yes',
        passwordRules: PASSWORD_RULES,
      };
    case 'confirmPassword':
      return {
        textContentType: 'newPassword',
        autoComplete: 'new-password',
        importantForAutofill: 'yes',
      };
    default:
      return {};
  }
}
