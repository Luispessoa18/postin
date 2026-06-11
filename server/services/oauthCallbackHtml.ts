export function renderOAuthCallbackHtml(profiles: unknown[], state?: string): string {
  const profilesB64 = Buffer.from(JSON.stringify(profiles)).toString('base64');
  const stateJson = JSON.stringify(state || '');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Autenticação Meta</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #334155; }
    .ok { color: #059669; }
    .err { color: #dc2626; }
    button { margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer; }
  </style>
</head>
<body data-profiles="${profilesB64}">
  <p id="status">Autenticação concluída. Redirecionando...</p>
  <button id="close-btn" style="display:none" onclick="window.close()">Fechar esta janela</button>
  <script>
    (function () {
      var statusEl = document.getElementById('status');
      var closeBtn = document.getElementById('close-btn');
      var oauthState = ${stateJson};

      function showCloseHint() {
        if (closeBtn) closeBtn.style.display = 'inline-block';
        if (statusEl) {
          statusEl.textContent = 'Conectado! Você pode fechar esta janela.';
          statusEl.className = 'ok';
        }
      }

      try {
        var raw = document.body.getAttribute('data-profiles') || 'W10=';
        var profilesData = JSON.parse(atob(raw));
        var payload = {
          type: 'OAUTH_AUTH_SUCCESS',
          platform: 'facebook',
          profiles: profilesData,
          state: oauthState || undefined
        };

        try {
          var bc = new BroadcastChannel('meta_oauth');
          bc.postMessage(payload);
          bc.close();
        } catch (e) {}

        if (window.opener && !window.opener.closed) {
          try { window.opener.postMessage(payload, '*'); } catch (e) {}
        }

        if (statusEl) {
          statusEl.textContent = 'Conectado! Fechando...';
          statusEl.className = 'ok';
        }

        window.close();
        setTimeout(function () {
          if (!window.closed) showCloseHint();
        }, 800);
      } catch (e) {
        console.error('OAuth callback error:', e);
        if (statusEl) {
          statusEl.textContent = 'Erro ao processar autenticação.';
          statusEl.className = 'err';
        }
        if (closeBtn) closeBtn.style.display = 'inline-block';
      }
    })();
  </script>
</body>
</html>`;
}
