import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
};

export interface StaticServerHandle {
  readonly port: number;
  close(): Promise<void>;
}

function createServer(rootDir: string): http.Server {
  const resolvedRoot = path.resolve(rootDir);

  return http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const urlPath = (req.url ?? '/').split('?')[0] ?? '/';
    const requestedPath = urlPath === '/' ? '/index.html' : urlPath;
    const candidatePaths = new Array<string>();
    candidatePaths.push(requestedPath);
    if (requestedPath.endsWith('/')) {
      candidatePaths.unshift(`${requestedPath}index.html`);
    } else if (path.extname(requestedPath).length === 0) {
      candidatePaths.push(`${requestedPath}/index.html`);
    }

    let filePath: string | null = null;
    for (let i = 0; i < candidatePaths.length; i += 1) {
      const candidatePath = candidatePaths[i] ?? requestedPath;
      const resolvedPath = path.resolve(resolvedRoot, `.${candidatePath}`);
      if (!resolvedPath.startsWith(resolvedRoot)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        filePath = resolvedPath;
        break;
      }
    }

    if (filePath === null) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${urlPath}`);
      return;
    }

    fs.readFile(filePath, (error: NodeJS.ErrnoException | null, data: Buffer) => {
      if (error !== null) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not found: ${urlPath}`);
        return;
      }

      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Type': MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      });
      res.end(data);
    });
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    server.close((error: Error | undefined) => {
      if (error !== undefined) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function reservePort(server: http.Server, host: string, initialPort: number, maxPort: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const tryListen = (candidatePort: number): void => {
      const probe = http.createServer();

      probe.once('error', (error: NodeJS.ErrnoException) => {
        if ((error.code === 'EADDRINUSE' || error.code === 'EACCES') && candidatePort < maxPort) {
          tryListen(candidatePort + 1);
          return;
        }
        reject(error);
      });

      probe.once('listening', () => {
        probe.close((probeError: Error | undefined) => {
          if (probeError !== undefined) {
            reject(probeError);
            return;
          }

          server.listen(candidatePort, host, () => {
            resolve(candidatePort);
          });
        });
      });

      probe.listen(candidatePort, host);
    };

    tryListen(initialPort);
  });
}

export async function startStaticServer(
  rootDir: string,
  initialPort: number,
  maxPort = 11_400,
): Promise<StaticServerHandle> {
  const server = createServer(rootDir);
  const host = '127.0.0.1';
  const port = await reservePort(server, host, initialPort, maxPort);

  return {
    port,
    close: () => closeServer(server),
  };
}
