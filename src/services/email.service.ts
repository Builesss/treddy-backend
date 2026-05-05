import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/verify?token=${token}`;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verifica tu cuenta en Treddy",
      html: getVerificationEmailTemplate(name, verificationUrl),
    });
  },
};

function getVerificationEmailTemplate(name: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Arial', sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; border: 1px solid #e4e4e7; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">TREDDY</h1>
            </td>
          </tr>
          

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #18181b; margin-top: 0; margin-bottom: 20px; font-size: 24px; font-weight: 600;">Verificación de Cuenta</h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hola <strong>${name}</strong>,
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Gracias por registrarte en Treddy. Para poder acceder a todas las funcionalidades, por favor verifica tu correo electrónico haciendo clic en el botón de abajo.
              </p>
              

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${url}" style="background-color: #00E6F6; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                      Verificar Mi Cuenta
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                O copia y pega el siguiente enlace en tu navegador:
              </p>
              
              <p style="margin-bottom: 0;">
                <a href="${url}" style="color: #00E6F6; text-decoration: underline; word-break: break-all; font-size: 14px;">
                  ${url}
                </a>
              </p>
            </td>
          </tr>
          

          <tr>
            <td style="background-color: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Treddy. Todos los derechos reservados.
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 5px 0 0 0;">
                Este enlace expirará en 24 horas por seguridad.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
