import { z } from 'zod';

export const utcDateSchema = z.iso.datetime({ offset: false, local: false });
