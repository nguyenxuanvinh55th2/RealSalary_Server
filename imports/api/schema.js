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
  type Status {
    _id:String
    name:String
    statusSalary:Float
  }
  type Activity {
    _id:String
    bargeId:String
    positionId:String
    dateStart:String
    dateEnd:String
    totalDate:Float
    coefficientPosition:Float
    statusId:String
    statusName:String
    statusSalary:Float
    total:Float
  }
  type Detail {
    _id:String
    activityId:String
    memberId:String
    positionId:String
  }
  type Member {
    _id:String
    name:String
  }
  type ListPositionOFBarge {
    positionId:String
    name:String
    listBarges:[String]
    barges:[Barge]
  }
  type Barge{
    _id:String
    dateStart:String
    dateEnd:String
    product:String
    coefficientBarge:Float
    positionId:String
    activities:[Activity]
  }
  type ListMemberOFBarge {
    memberId:String
    name:String
    listBargeId:[String]
    listBarges:[BargeMember]
  }
  type BargeMember {
    _id:String
    coefficientBarge:Float
    memberId:String
    salaryActive:[SalaryActivity]
  }
  type SalaryActivity {
    statusName:String
    dateStart:Float
    dateEnd:Float
    position:String
    totalSalary:Float
  }

  # the schema allows the following query:
  type Query {
    posts(offset: Int, limit: Int): [Post],
    comments(postId: String, offset: Int, limit: Int): [Comment],
    notification(userId: String): [Note],
    listBarge(dateStart:Float,dateEnd:Float):[ListPositionOFBarge],
    listMember(dateStart:Float,dateEnd:Float):[ListMemberOFBarge],
    status:[Status],
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
