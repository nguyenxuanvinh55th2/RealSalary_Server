import { Meteor } from 'meteor/meteor';
import express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';

//collection
import  '../imports/api/task'
import {Posts} from '../imports/api/post'
import {Comments} from '../imports/api/comments'
//Collection for Barge Salary
import {CalendarActivities} from '../imports/api/calendarActivities.js'
import {Members} from '../imports/api/members'
import {Positions} from '../imports/api/positions'
import {PositionBarges} from '../imports/api/positionBarges'
import {MemberBarges} from '../imports/api/memberBarges'
import {SalaryDetails} from '../imports/api/salaryDetails'
import {Status} from '../imports/api/status'
import {Documents} from '../imports/api/documents'
import { subscriptionManager } from '../imports/api/subscription';
import schema from '../imports/api/schema';

import { createApolloServer } from 'meteor/apollo';
const GRAPHQL_PORT = 8080;
const WS_PORT = 8090;

const graphQLServer = express().use('*', cors());

//config graphql
graphQLServer.use('/graphql', bodyParser.json(), graphqlExpress({
  schema,
  context: {},
}));

graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`
));

// WebSocket server for subscriptions
const websocketServer = createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

websocketServer.listen(WS_PORT, () => console.log( // eslint-disable-line no-console
  `Websocket Server is now running on http://localhost:${WS_PORT}`
));

new SubscriptionServer(
  { subscriptionManager },
  websocketServer
);

Meteor.methods({
  loginFbGgUser: (user) => {
    let checkId = Meteor.users.find({$or: [{googleId: user.googleId}, {id: user.id}]}).count();
    if(checkId === 0)
      Meteor.users.insert(user);
    return Meteor.users.findOne({$or: [{googleId: user.googleId}, {id: user.id}]})
  }
});

// Comments.insert({
//   _id: 'abcd',
//   text: 'example comment',
//   userId: 'Fa95rus5uidB7f7j3',
//   postId: '5823e984dd532814bafdac4a'
// })
Meteor.methods({
   insertImage: function (fileInfo, fileData) {
      console.log("received file " + fileInfo.name + " data: " + fileData);
      // fs.writeFile(fileInfo.name, fileData);
   }
});
Meteor.methods({
  test:function(){
     console.log("test");

  }
});
