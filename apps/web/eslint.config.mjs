import base from '../../eslint.config.mjs';
import next from 'eslint-config-next/core-web-vitals';

const config = [...next.filter((entry) => entry.name !== 'next/typescript'), ...base];
export default config;
