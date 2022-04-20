import { DataTypes, Model } from "sequelize";
import { dbType } from ".";
import { sequelize } from "./sequelize";

class Post extends Model {
    public readonly id!: number;
    public content!: string;
    public readonly createAt!: Date;
    public readonly updateAt!: Date;
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
    collate: 'utf8mb4_general_ci'
});

// 모델간 관계 형성
export const associate = (db: dbType) => {

};

export default Post;