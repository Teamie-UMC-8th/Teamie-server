import { Provider } from '@nestjs/common';
import { createClient } from 'redis';

export const RedisProvider: Provider = {
    provide: 'REDIS_CLIENT',
    useFactory: async () => {
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        return client;
    },
};
