import { render } from '@react-email/render';
import PasswordResetEmail from './PasswordResetEmail';
import WelcomeEmail from './WelcomeEmail';

export const renderPasswordResetEmail = async (resetUrl: string): Promise<string> => {
  return await render(PasswordResetEmail({ resetUrl }));
};

export const renderWelcomeEmail = async (userName: string, loginUrl: string): Promise<string> => {
  return await render(WelcomeEmail({ userName, loginUrl }));
};