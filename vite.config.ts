import { defineConfig, type Plugin } from 'vite';
import { textPage } from './src/text';
function accessiblePortfolio(): Plugin {
  return {
    name: 'static-accessible-portfolio',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/text.html') return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(textPage());
      });
    },
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'text.html', source: textPage() }); }
  };
}
export default defineConfig({ base: './', plugins: [accessiblePortfolio()] });
