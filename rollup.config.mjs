import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'auto', // default와 named export 자동 감지
        },
        {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true,
            exports: 'auto',
        },
    ],
    plugins: [
        resolve({
            browser: true,
        }),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: './dist',
        }),
    ],
    external: ['socket.io-client'],
};
