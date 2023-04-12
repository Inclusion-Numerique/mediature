import { adminRouter } from '@mediature/main/src/server/routers/admin';
import { agentRouter } from '@mediature/main/src/server/routers/agent';
import { authRouter } from '@mediature/main/src/server/routers/auth';
import { authorityRouter } from '@mediature/main/src/server/routers/authority';
import { caseRouter } from '@mediature/main/src/server/routers/case';
import { messengerRouter } from '@mediature/main/src/server/routers/messenger';
import { systemRouter } from '@mediature/main/src/server/routers/system';
import { userRouter } from '@mediature/main/src/server/routers/user';
import { mergeRouters } from '@mediature/main/src/server/trpc';

export const appRouter = mergeRouters(adminRouter, agentRouter, authRouter, authorityRouter, caseRouter, messengerRouter, systemRouter, userRouter);
export type AppRouter = typeof appRouter;
