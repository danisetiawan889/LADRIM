import { app } from './app';
import { env } from './config/env';
app.listen(env.PORT, () => console.log(`LADRIM API on :${env.PORT}`));
