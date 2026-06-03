export function welcomeTemplate({ firstName, role }) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Lumina</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f6;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:14px;overflow:hidden;max-width:600px;border:1px solid #eeecee;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#c84b31;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;">&#9835; Lumina</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Premium Music Experience</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 28px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">Welcome, ${firstName}!</h2>
              <p style="margin:0 0 16px;color:#555555;font-size:15px;line-height:1.7;">
                Your account has been successfully created. You're now part of the Lumina community — a premium music experience built for those who value great sound and beautiful design.
              </p>
              <p style="margin:0 0 28px;color:#555555;font-size:15px;line-height:1.7;">
                You've joined as a <span style="color:#c84b31;font-weight:600;">${roleLabel}</span>.${
    role === "artist"
      ? " Start uploading your music, building playlists, and connecting with your audience."
      : " Start exploring, building playlists, and discovering music that moves you."
  }
              </p>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#c84b31;border-radius:8px;padding:14px 36px;">
                    <a href="#" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;letter-spacing:0.02em;">Start Listening</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #eeecee;margin:4px 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 36px;">
              <p style="margin:0 0 4px;color:#aaaaaa;font-size:13px;line-height:1.6;">
                If you didn't create this account, you can safely ignore this email.
              </p>
              <p style="margin:0;color:#aaaaaa;font-size:13px;">
                &copy; ${new Date().getFullYear()} Lumina &mdash; Built with &#10084; by Dhruv Shah
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
