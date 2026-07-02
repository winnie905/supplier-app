const path = require('path');

const srcPath = path.resolve(__dirname, 'src');

module.exports = {
  '@': srcPath,
  '@/app': path.join(srcPath, 'app'),
  '@/components': path.join(srcPath, 'components'),
  '@/config': path.join(srcPath, 'config'),
  '@/constants': path.join(srcPath, 'constants'),
  '@/hooks': path.join(srcPath, 'hooks'),
  '@/navigation': path.join(srcPath, 'navigation'),
  '@/pages': path.join(srcPath, 'pages'),
  '@/sections': path.join(srcPath, 'sections'),
  '@/services': path.join(srcPath, 'services'),
  '@/store': path.join(srcPath, 'store'),
  '@/theme': path.join(srcPath, 'theme'),
  '@/types': path.join(srcPath, 'types'),
  '@/utils': path.join(srcPath, 'utils'),
};
