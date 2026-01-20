import { render } from '@react-email/components';
import PasswordResetEmail from './PasswordResetEmail';
import WelcomeEmail from './WelcomeEmail';

export const renderPasswordResetEmail = (resetUrl: string): string => {
  return render(PasswordResetEmail({ resetUrl }));
};

export const renderWelcomeEmail = (userName: string, loginUrl: string): string => {
  return render(WelcomeEmail({ userName, loginUrl }));
};