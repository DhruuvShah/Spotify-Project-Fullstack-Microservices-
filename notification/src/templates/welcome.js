export function welcomeTemplate({ firstName, role }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Spotify</title>
</head>
<body style="margin:0;padding:0;background-color:#121212;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121212;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#181818;border-radius:12px;overflow:hidden;max-width:600px;">

          <tr>
            <td align="center" style="background-color:#1DB954;padding:32px 40px;">
              <h1 style="margin:0;color:#000000;font-size:28px;font-weight:800;letter-spacing:-0.5px;">&#9654; Spotify</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 24px;">
              <h2 style="margin:0 0 16px;color:#FFFFFF;font-size:22px;font-weight:700;">Welcome, ${firstName}! &#127881;</h2>
              <p style="margin:0 0 16px;color:#B3B3B3;font-size:15px;line-height:1.6;">
                Your account has been successfully created. You're now part of the Spotify community — millions of songs, podcasts, and playlists are waiting for you.
              </p>
              <p style="margin:0 0 24px;color:#B3B3B3;font-size:15px;line-height:1.6;">
                You've joined as a <span style="color:#1DB954;font-weight:600;">${role.charAt(0).toUpperCase() + role.slice(1)}</span>. Start exploring, building playlists, and discovering new music today.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#1DB954;border-radius:50px;padding:14px 36px;">
                    <a href="#" style="color:#000000;font-size:15px;font-weight:700;text-decoration:none;display:inline-block;">Start Listening</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #282828;margin:8px 0;" />
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 36px;">
              <p style="margin:0 0 4px;color:#535353;font-size:13px;">
                If you didn't create this account, you can safely ignore this email.
              </p>
              <p style="margin:0;color:#535353;font-size:13px;">
                &copy; ${new Date().getFullYear()} Spotify Clone &mdash; Built with &#10084; by Dhruv Shah
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
