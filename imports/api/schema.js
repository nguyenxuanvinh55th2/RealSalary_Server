import { makeExecutableSchema } from 'graphql-tools';

import resolvers from './resolvers';

const schema = [`
  type Post {
    _id:String
    caption:String
    likes: Int
    display_src: String
    commentsCount: Int,
    userId: String,
    user: User
  }

  type Note {
  	_id: String,
  	userId: String,
  	sendId: String,
  	sender: User,
  	note: String,
  	date: String,
    read: Boolean
  }

  type User {
    _id: String
    name: String
    image: String
  }

  type Comment {
    _id: String
    text:String
    userId: String
    user:User
  }
  type MemberPositionBarge {
    _id:String
    membersId:[String]
    positionsId:[String]
    documentsId:[String]
    statusId:[String]
    status:[Status]
    documents:[Document]
    salarymembers:[MemberSalary]
  }
  type MemberSalary {
    _id:String
    name:String
    documentsId:[String]
    documents:[DocumentActivity]
  }
  type DocumentActivity {
    _id:String
    memberId:String
    salaryActive:[SalaryActivity]
  }
  type SalaryActivity {
    _id:String
   statusName:String
   timeStart:Float
   timeEnd:Float
   statusSalary:Float
   coefficientBarge:Float
   memberId:String
   salary:[SalaryMemberDocument]
 }
 type SalaryMemberDocument {
   positionName:String
   totalSalary:Float
 }
  type Status {
    _id:String,
    name:String
  }
  type Document {
    _id:String
    timeStart:Float
    timeEnd:Float
    product:String
    activities:[Activity]
  }
  type Activity {
    _id:String
    timeStart:Float
    timeEnd:Float
    totalTime:Float
    statusId:String
    statusName:String
    statusSalary:Float
    coefficientBarge:Float
  }
  # the schema allows the following query:
  type Query {
    posts(offset: Int, limit: Int): [Post],
    comments(postId: String, offset: Int, limit: Int): [Comment],
    notification(userId: String): [Note],
    bargerSalary(bargeId:String,timeStart:Float,timeEnd:Float):MemberPositionBarge
  }
  # this schema allows the following mutation:
  type Mutation {
    insertPost(caption: String, display_src: String, userId: String): String,
    deletePost(userId: String, postId:String):String,
    insertComment(text: String, userId: String, postId: String): String,
    deleteComment(commentId: String, userId: String): String,
    deleteNotification(noteId: String): String,
    readNotification(userId: String): String,
    updateLikePost:String
  }

  type Subscription {
    postUpvoted  (author:String): Post
    newComment(comment: String): Comment
    newNotification(note: String): Note
    subscriptPost : Post
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`];
export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
