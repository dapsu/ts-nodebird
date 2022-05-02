import { dbType } from ".";
import { sequelize } from "./sequelize";
import { BelongsToManyAddAssociationsMixin, DataTypes, HasManyAddAssociationMixin, HasManyAddAssociationsMixin, Model } from "sequelize";
import Hashtag from "./hashtag";
import Image from "./image";

class Post extends Model {
    public readonly id!: number;
    public content!: string;
    public readonly createAt!: Date;
    public readonly updateAt!: Date;

    public addHashTags!: BelongsToManyAddAssociationsMixin<Hashtag, number>;
    public addImages!: HasManyAddAssociationsMixin<Image, number>;
    public addImage!: HasManyAddAssociationMixin<Image, number>;
}

Post.init({
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'Post',
    tableName: 'post',
    charset: 'utf8mb4', // 이모티콘 등의 문자들도 많이 사용하기 때문에
    collate: 'utf8mb4_general_ci'   // 텍스트 정렬할 때 a 다음에 b 가 나타나야 한다는 생각으로 나온 정렬방식. 일반적으로 널리 사용
});

// 모델간 관계 형성
export const associate = (db: dbType) => {
    db.Post.belongsTo(db.User);     // 게시글을 작성한 사람
    db.Post.hasMany(db.Comment);    // 게시글은 여러 개의 댓글 가지고 있음
    db.Post.hasMany(db.Image);      // 게시글은 여러 개의 이미지를 가지고 있음
    db.Post.belongsTo(db.Post, { as: 'Retweet' });      // 하나의 게시글은 다른 게시글에 리트윗이 될 수 있음
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });           // 해시태그와 다대다 관계
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' });       // 게시글은 좋아요를 누른 사용자와 다대다 관계
};
// 관계에 대한 코드 작성하였다면, 이에 맞는 라우트 작성하기 (routes/post.ts)

export default Post;