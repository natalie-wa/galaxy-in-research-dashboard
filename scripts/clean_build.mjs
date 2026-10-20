// Remove only the generated project output before each Framework build. This
// also recovers safely from incomplete builds that left untracked output files.
import {rm} from 'node:fs/promises';
await rm(new URL('../dist/',import.meta.url),{recursive:true,force:true});
