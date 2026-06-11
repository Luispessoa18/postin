import { spawn, ChildProcess } from 'child_process';
import { updatePlatformIntegrations } from '../db/integrations.js';

let tunnelProcess: ChildProcess | null = null;
let tunnelUrl: string | null = null;

// cloudflared prints URL in box or inline: https://xxx.trycloudflare.com
const URL_REGEX = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi;

export function getTunnelStatus() {
  return {
    running: tunnelProcess !== null && tunnelProcess.exitCode === null && !tunnelProcess.killed,
    url: tunnelUrl,
  };
}

export function startCloudflareTunnel(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (tunnelProcess && tunnelProcess.exitCode === null && !tunnelProcess.killed) {
      if (tunnelUrl) return resolve(tunnelUrl);
      return reject(new Error('Tunnel já está em execução'));
    }

    tunnelUrl = null;
    let settled = false;
    let outputBuffer = '';

    const finish = (err: Error | null, url?: string) => {
      if (settled) return;
      settled = true;
      if (err) {
        if (tunnelProcess && !tunnelProcess.killed) {
          tunnelProcess.kill();
        }
        tunnelProcess = null;
        reject(err);
      } else if (url) {
        tunnelUrl = url;
        try {
          updatePlatformIntegrations({
            app_url: url,
            cloudflare_tunnel_active: 1,
          });
        } catch (dbErr) {
          console.warn('Tunnel URL obtida, mas falha ao salvar no banco:', dbErr);
        }
        resolve(url);
      }
    };

    const tryExtractUrl = (chunk: string) => {
      outputBuffer += chunk;
      const matches = outputBuffer.match(URL_REGEX);
      if (matches && matches.length > 0) {
        finish(null, matches[matches.length - 1]);
      }
    };

    const proc = spawn('cloudflared', ['tunnel', '--url', `http://127.0.0.1:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });

    tunnelProcess = proc;

    proc.stdout?.on('data', (chunk: Buffer) => tryExtractUrl(chunk.toString()));
    proc.stderr?.on('data', (chunk: Buffer) => tryExtractUrl(chunk.toString()));

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        finish(new Error('cloudflared não encontrado. Instale com: brew install cloudflared'));
      } else {
        finish(err);
      }
    });

    proc.on('exit', (code) => {
      if (!settled) {
        finish(new Error(
          code === 0
            ? 'cloudflared encerrou antes de gerar a URL'
            : `cloudflared encerrou com código ${code}. Verifique se a porta ${port} está correta.`
        ));
      } else {
        tunnelProcess = null;
        tunnelUrl = null;
        try {
          updatePlatformIntegrations({ cloudflare_tunnel_active: 0 });
        } catch {
          /* ignore */
        }
      }
    });

    setTimeout(() => {
      finish(new Error('Timeout ao aguardar URL do Cloudflare tunnel (45s). Tente novamente.'));
    }, 45000);
  });
}

export function stopCloudflareTunnel(): void {
  if (tunnelProcess && !tunnelProcess.killed) {
    tunnelProcess.kill();
  }
  tunnelProcess = null;
  tunnelUrl = null;
  try {
    updatePlatformIntegrations({ cloudflare_tunnel_active: 0 });
  } catch {
    /* ignore */
  }
}
