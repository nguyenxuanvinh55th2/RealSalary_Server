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
    listBarge(root,{dateStart,dateEnd}){
      var arr=[]
      let query = Documents.find( { $and: [ { dateStart: { $gte: dateStart } }, { dateEnd: { $lte: dateEnd } } ]},{_id:0}).map((item) => item._id)
      let list = PositionBarges.find({"bargeId":{$in:query}}).fetch()
      let value = __.uniqBy(list, 'positionId');
      __.forEach(value,(item)=>item.listBarges=query)
      return value;
    },
    listMember(root,{dateStart,dateEnd}){
      var arr=[]
      let query = Documents.find( { $and: [ { dateStart: { $gte: dateStart } }, { dateEnd: { $lte: dateEnd } } ]},{_id:0}).map((item) => item._id)
      let list = MemberBarges.find({"bargeId":{$in:query}}).fetch()
      let value = __.uniqBy(list, 'memberId');
      __.forEach(value,(item)=>item.listBarges=query)
      return value;
    },
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
  ListPositionOFBarge:{
    barges(root){
      let query = Documents.find({"_id":{$in:root.listBarges}}).fetch();
      __.forEach(query,(item)=>{
        item.positionId = root.positionId
      })
      return query;
    }
  },
  Barge:{
    activities(root){
      let query = CalendarActivities.find({"bargeId":root._id}).fetch();
      let list =[]
      __.forEach(query,(item,idx)=>{
        let cp = SalaryDetails.findOne({$and:[{activityId:item._id},{positionId:root.positionId}]});
        if(!cp)
        {
            query.splice(idx,1)
        }
          else {
            item.totalDate = item.dateEnd - item.dateStart
            item.coefficientPosition = cp.coefficientPosition
            item.positionId = root.positionId
            item.total = item.totalDate * item.coefficientPosition * root.coefficientBarge * item.statusSalary;
          }
      })
      return query;
    }
  }
};

export default resolveFunctions;
