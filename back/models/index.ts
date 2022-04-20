import User, { associate as associateUser } from './user';
import Post, { associate as associatePost } from './post';
import Comment, { associate as associateComment } from './comment';
import Image, { associate as associateImage} from './image';
import Hashtag, { associate as associateHashTag} from './hashtag';
export * from './sequelize';

// db객체에 전부 삽입
const db = {
    User,
    Post,
    Comment,
    Image,
    Hashtag
};
export type dbType = typeof db;

// 모델들 관계 설정
associateUser(db);
associatePost(db);
associateComment(db);
associateImage(db);
associateHashTag(db);