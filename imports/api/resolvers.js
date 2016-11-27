import { pubsub } from './subscription';
import {Posts} from './post'
import {Notification} from './notification'
import {Comments} from './comments'
import {Meteor} from 'meteor/meteor'
//Collection for Barge Salary
import {CalendarActivities} from './calendarActivities'
import {Members} from './members'
import {Positions} from './positions'
import {SalaryDetails} from './salaryDetails'
import {Status} from './status'
import {Documents} from './documents'
import {PositionBarges} from './positionBarges'
import {MemberBarges} from './memberBarges'
import {Ships} from './ship'
import {Barges} from './barge'
import __ from 'lodash'

getUserInfo = (userId) => {
  let query = Meteor.users.findOne({_id: userId});
    let user = {
      _id: query._id,
      name: query.profileObj? query.profileObj.name : query.name,
      image: query.profileObj? query.profileObj.imageUrl : query.picture.data.url
    }
    return user;
}

getTimeString = (time) => {
  return time.getHours() + ':' + time.getMinutes() + ' ' + time.getDate() + '/' + (time.getMonth() + 1).toString();
}

sendNotification = (sendId, postId, note) => {
  let post = Posts.findOne({_id: postId});
  let userId = post.userId;
  if(sendId !== userId) {
    let _id = (Math.floor(Math.random()*90000) + 10000).toString();
    let date = new Date();

    let user = getUserInfo(sendId)

    Notification.insert({
      _id,
      userId,
      sendId,
      note,
      date,
      read: false,
    });

    let notification = {
      _id,
      userId,
      sendId,
      sender: {
        _id: user._id,
        name: user.name,
        image: user.image
      },
      note,
      date,
      read: false
    }

    pubsub.publish('newNotification', notification);
  }
}

subscriptPostFunction = (post,userId) => {
  query = Meteor.users.findOne({_id: post.userId});
  let postResult = {
    _id: post._id,
    caption: post.caption,
    userId: post.userId,
    likes: post.likes,
    display_src:post.display_src
  }
  pubsub.publish('subscriptPost', postResult);
}
const resolveFunctions = {
  Query: {
    posts(_, {offset, limit}) {
      query = Posts.find().fetch();
      let end = offset + limit >= query.length ? query.length : offset + limit;
      return query.slice(offset, end);
    },

    comments(_, {postId, offset, limit}) {
      query = Comments.find({postId: postId}).fetch();
      let end = offset + limit >= query.length ? query.length : offset + limit;
      return query.slice(offset, end);
    },

    notification(root, {userId}) {
			result = [];
      // console.log(Notification.notification);
			query = Notification.find({userId: userId}, {date: -1}).fetch();
			query.forEach(item => {
				let classCode = item.classCode;
				var note = {
					_id: item._id,
					userId: item.userId,
					sendId: item.sendId,
					note: item.note,
					date: getTimeString(item.date),
          read: item.read
				}
				result.push(note);
			})
			return result;
		},
    // real hack : Barge Salary
    bargerSalary(root,{bargeId,timeStart,timeEnd}){
      let query = Barges.findOne({_id:bargeId});
      let activities = CalendarActivities.find({$and:[{timeStart:{$gte:timeStart}}, {timeEnd:{$lte:timeEnd}}, {bargeId:bargeId}]}).fetch();
      let value = __.uniqBy(activities, 'documentId');
      let iddocument = value.map((item) => item.documentId);
      query.documentsId = Documents.find({$and:[{"_id":{$in:iddocument}},{"timeEnd":{$lte:timeEnd}}]}).map((item) => item._id)
      let status = CalendarActivities.find({documentId:{$in:query.documentsId}}).fetch();
      let distinctStatus = __.uniqBy(status,'statusId')
      query.statusId =distinctStatus.map((item) => item.statusId);
      query.status =[]
      __.forEach(distinctStatus,(item)=>{
        let ob ={
          _id:item.statusId,
          name:item.statusName
        }
        query.status.push(ob)
      })
      return query
    }
  },

  Mutation: {
    insertPost(_,{caption,display_src, userId}){
      let _id = (Math.floor(Math.random()*90000) + 10000).toString();
      Posts.insert({
        _id,
        caption,
        display_src,
        userId,
        likes: 0,
      });
      return ;
    },

    deletePost(_,{userId, postId}) {
      let post = Posts.findOne({_id: postId});
      if(post.userId === userId) {
        Posts.remove({_id: post._id},()=>{
          subscriptPostFunction(post,userId)
          Comments.remove({postId:postId});
        });
      }
      return;
    },

    insertComment(_,{text, userId, postId}) {
      let _id = (Math.floor(Math.random()*90000) + 10000).toString();

      Comments.insert({
        _id,
        text,
        userId,
        postId
      }, () => {
        query = Meteor.users.findOne({_id: userId});
        let comment = {
          _id,
          text,
          userId,
          postId,
          user: {
            _id: query._id,
            name: query.profileObj? query.profileObj.name : query.name,
            image: query.profileObj? query.profileObj.imageUrl : query.picture.data.url
          }
        }
        sendNotification(userId, postId, 'Đã bình luận ảnh của bạn');
        pubsub.publish('newComment', comment);
        subscriptPostFunction(Posts.findOne({_id:postId}),userId);
      });
      return text;
    },

    deleteComment(_,{commentId, userId}) {
      let comment = Comments.findOne({_id: commentId});
      if(comment.userId === userId) {
        Comments.remove({_id: commentId});

        query = Meteor.users.findOne({_id: userId});
        let commentResult = {
          _id: comment._id,
          text: comment.text,
          userId: comment.userId,
          postId: comment.postId,
          user: {
            _id: query._id,
            name: query.profileObj? query.profileObj.name : query.name,
            image: query.profileObj? query.profileObj.imageUrl : query.picture.data.url
          }
        }
        subscriptPostFunction(Posts.findOne({_id:comment.postId}),userId);
        pubsub.publish('newComment', commentResult);
      }
      return commentId;
    },

    updateLikePost(_,{userId, postId}){
      Posts.update({_id:postId}, {$inc:{
          likes:1
      }},()=>{
        let post = Posts.findOne({_id:postId});
        query = Meteor.users.findOne({_id: post.userId});
        resultPost = {
          _id: post._id,
          caption: post.caption,
          userId: post.userId,
          likes: post.likes,
          commentsCount: Comments.find({postId: post._id}).count(),
          user: {
            _id: query._id,
            name: query.profileObj? query.profileObj.name : query.name,
            image: query.profileObj? query.profileObj.imageUrl : query.picture.data.url
          }
        }
        pubsub.publish('subscriptPost', resultPost)
        sendNotification(userId, postId, 'Đã thích ảnh của bạn')
        subscriptPostFunction(post,userId)
      });
      return ;
    },

    deleteNotification(_, { noteId }) {
      query = Notification.findOne({_id: noteId});
      Notification.remove(noteId);
      note = {
          _id: query._id,
          userId: query.userId,
          sendId: query.sendId,
          sender: {
            _id: '',
            name: '',
            image: ''
          },
          note: query.note,
          date: query.date,
          read: query.read
        }
      pubsub.publish('newNotification', note);
      return noteId;
    },

    readNotification(_, { userId }) {
      Notification.update( { userId, read: false }, { $set: { read: true } }, { upsert: false, multi: true });
      return
    }
  },

  Subscription: {
    postUpvoted(post) {
      return post;
    },
    newComment(comment) {
      return comment;
    },
    newNotification(note) {
      return note;
    },
    subscriptPost(post) {
      return post;
    }
  },
  Post :{
    commentsCount(root){
      let count = Comments.find({"postId":root._id}).count();
      if(count ===0)
        return null;
      return count;
   },
    user(root) {
      return getUserInfo(root.userId)
    }
  },
  Comment :{
    async  user(root){
      return getUserInfo(root.userId)
    }
  },
  Note: {
    sender(root) {
      return getUserInfo(root.sendId)
    }
  },
  //for Barge salary
  MemberPositionBarge:{
    documents(root){
      let query = Documents.find({_id:{$in:root.documentsId}}).fetch();
      return query;
    },
    salarymembers(root)
    {
      let query = Members.find({_id:{$in:root.membersId}}).fetch();
      __.forEach(query,(item)=>{
        item.documentsId = root.documentsId
      })
      return query;
    }
  },
  Document:{
    activities(root){
      let query = CalendarActivities.find({documentId:root._id}).fetch()
      __.forEach(query,(item)=>{
        item.totalTime = item.timeEnd - item.timeStart
      })
      return query;
    }
  },
  MemberSalary:{
    documents(root){
      let query = Documents.find({_id:{$in:root.documentsId}}).fetch()
      __.forEach(query,(item)=>{
        item.memberId = root._id;
      })
      return query;
    }
  },
  DocumentActivity :{
    salaryActive(root){
      let query = CalendarActivities.find({"documentId":root._id}).fetch();
      __.forEach(query,(item,idx)=>{
        let cp = SalaryDetails.findOne({$and:[{activityId:item._id},{memberId:root.memberId}]});
        if(!cp)
          query.splice(idx,1)
          else {
            item.memberId=root.memberId
          }
      })
     return query;
   }
 },
 SalaryActivity:{
   salary(root){
     let query = SalaryDetails.find({$and:[{activityId:root._id},{memberId:root.memberId}]}).fetch()
     __.forEach(query,(item)=>{
       item.totalSalary = (root.timeEnd - root.timeStart) * item.coefficientPosition * root.coefficientBarge * root.statusSalary;
     })
     return query;
   }
 }

};

export default resolveFunctions;
