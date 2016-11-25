import { PubSub, SubscriptionManager } from 'graphql-subscriptions';
import schema from './schema';

const pubsub = new PubSub();
const subscriptionManager = new SubscriptionManager({
  schema,
  pubsub,
  setupFunctions: {
    newComment: (options, args) => ({
      newComment: {
        filter: item => true,
      }
    }),
    newNotification: (options, args) => ({
      newNotification: {
        filter: note => note.userId === args.note,
      }
    }),
  },
});

export { subscriptionManager, pubsub };
