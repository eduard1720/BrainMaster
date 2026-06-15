# Correo de confirmación al crear un alumno

Cuando el admin crea un alumno, el código llama a `signUp` de Supabase. Para que **llegue un correo
real** al Gmail del alumno confirmando su acceso, hay que activar el envío de correos en Supabase.

## 1) Activar la confirmación por correo
Supabase → **Authentication** → **Providers** → **Email** → activa **"Confirm email"** → Save.

A partir de ahí, cada vez que se crea un alumno, Supabase le envía un correo con un enlace para
confirmar su acceso. Al hacer clic, vuelve a tu plataforma (el código ya manda `emailRedirectTo`).

## 2) Personalizar el mensaje (opcional pero recomendado)
Supabase → **Authentication** → **Emails** → plantilla **"Confirm signup"**. Edítala, por ejemplo:

```
Asunto: Bienvenido a Brain Master English

Hola,
Tu acceso a la plataforma Brain Master English ha sido creado.
Confirma tu cuenta haciendo clic aquí: {{ .ConfirmationURL }}

Luego inicia sesión con la contraseña temporal que te compartió tu profesor.
```

## 3) IMPORTANTE: correo confiable (SMTP propio)
El correo **gratis de Supabase tiene límites muy bajos** (pocos por hora) y suele caer en SPAM.
Para producción, configura un SMTP propio (gratis hasta cierto volumen):

- Crea cuenta en **Resend** (resend.com) o **Brevo/SendGrid**.
- Supabase → **Project Settings** → **Authentication** → **SMTP Settings** → activa **Custom SMTP**
  y pega los datos (host, puerto, usuario, contraseña/API key, correo remitente).

Con SMTP propio los correos llegan bien y sin límites bajos.

## Cómo cambia el flujo del alumno
Con "Confirm email" activado:
1. Admin crea al alumno (con su Gmail + contraseña temporal).
2. El alumno recibe el correo y hace clic en el enlace → confirma su cuenta.
3. Inicia sesión con la contraseña temporal → el sistema le pide cambiarla.

> Si NO activas "Confirm email", el alumno puede entrar de una con la contraseña temporal,
> pero **no se enviará ningún correo**.

## "Olvidé mi contraseña" (recuperación)
El botón del login llama a `resetPasswordForEmail`. Para que funcione:

1. **Email activado** en Supabase (mismo SMTP del punto 3 de arriba — sin esto no llega el correo).
2. **URL de redirección permitida**: Supabase → **Authentication → URL Configuration**:
   - **Site URL**: la URL donde está publicada tu plataforma (ej: `https://tudominio.com`).
   - **Redirect URLs**: agrega esa misma URL.
   (Si no, el enlace del correo dará error "redirect not allowed".)
3. (Opcional) Personaliza la plantilla **"Reset Password"** en Authentication → Emails.

Flujo: el alumno escribe su correo → toca "¿Olvidaste tu contraseña?" → recibe el correo →
hace clic → vuelve a la plataforma y se le abre la ventana para poner su nueva contraseña.

## ¿Quieres un correo 100% personalizado sin obligar a confirmar?
Eso requiere una **Edge Function** de Supabase + un proveedor de correo (Resend). Es más trabajo,
pero permite enviar un "Bienvenido" con tu diseño sin el enlace de confirmación obligatorio.
Avísame y lo preparamos.
