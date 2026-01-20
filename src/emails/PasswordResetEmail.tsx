import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => {
  return (
    <Html className="light" lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>Restablecer tu contraseña | Nettidev</title>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script id="tailwind-config">
          {`
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            "primary": "#0c4a6e",
                            "accent-green": "#89c540",
                            "background-light": "#ffffff",
                            "background-dark": "#1a1a1a",
                        },
                        fontFamily: {
                            "display": ["Manrope", "sans-serif"]
                        },
                        borderRadius: {
                            "DEFAULT": "0.25rem",
                            "lg": "0.5rem",
                            "xl": "0.75rem",
                            "full": "9999px"
                        },
                    },
                },
            }
          `}
        </script>
        <style>
          {`
            body {
                font-family: 'Manrope', sans-serif;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
            }
          `}
        </style>
      </Head>
      <Body className="bg-slate-50 dark:bg-background-dark min-h-screen py-12 px-4">
        <Container className="email-container bg-background-light dark:bg-[#242424] border-t-4 border-t-[#89c540] shadow-sm rounded-xl overflow-hidden">
          {/* Header / Logo */}
          <Section className="pt-12 pb-8 flex flex-col items-center">
            <div className="flex items-center gap-3 text-primary dark:text-white">
              <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_6_535)">
                    <path
                      clipRule="evenodd"
                      d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Nettidev</h2>
            </div>
          </Section>

          {/* Content Area */}
          <Section className="px-8 md:px-12">
            {/* Headline */}
            <Text className="text-slate-900 dark:text-white text-3xl font-bold text-center mb-6">
              Restablecer tu contraseña
            </Text>

            {/* Body Copy */}
            <Section className="space-y-4 text-center">
              <Text className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                ¡Hola!
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                Hemos recibido una solicitud para restablecer tu contraseña de Nettidev. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              </Text>
            </Section>

            {/* Primary Action */}
            <Section className="flex justify-center py-10">
              <Link
                href={resetUrl}
                className="inline-flex items-center justify-center bg-primary hover:bg-[#0a3a5a] text-white text-base font-bold px-10 py-4 rounded-lg shadow-lg shadow-primary/20 transition-all no-underline"
              >
                Restablecer contraseña
              </Link>
            </Section>

            {/* Meta/Expiry Info */}
            <Text className="text-slate-400 dark:text-slate-500 text-sm font-normal text-center mb-10">
              <span className="material-symbols-outlined align-middle text-base mr-1">schedule</span>
              Este enlace expirará en 1 hora por razones de seguridad.
            </Text>

            {/* Divider */}
            <Hr className="border-t border-slate-100 dark:border-slate-800 my-8" />

            {/* Fallback Section */}
            <Section className="pb-10">
              <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mb-3">
                Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:
              </Text>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <Text className="text-primary dark:text-sky-400 text-xs break-all text-center select-all">
                  {resetUrl}
                </Text>
              </div>
            </Section>
          </Section>

          {/* Footer */}
          <Section className="bg-slate-50 dark:bg-[#1e1e1e] px-8 py-10 text-center border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-center gap-4 mb-6">
              <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer">chat_bubble</span>
              <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer">help_center</span>
              <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer">language</span>
            </div>
            <Text className="text-slate-500 dark:text-slate-400 text-xs leading-5">
              © 2024 Nettidev<br />
              Sistema de gestión universitaria<br />
              <span className="mt-2 block font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Enviado por Nettidev</span>
            </Text>
            <div className="mt-6 flex justify-center items-center gap-2">
              <div className="h-1 w-1 bg-accent-green rounded-full" />
              <Text className="text-[11px] text-slate-400">Mensaje automático seguro</Text>
            </div>
          </Section>
        </Container>

        {/* Decorative Bottom Shadow */}
        <Container className="email-container mt-4 flex justify-center opacity-30">
          <div className="bg-slate-300 h-1 w-4/5 blur-md rounded-full" />
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;