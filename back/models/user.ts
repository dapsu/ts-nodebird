import { 
    BelongsToManyAddAssociationMixin,
    BelongsToManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin, 
    DataTypes, HasManyGetAssociationsMixin, Model 
} from 'sequelize';
import { dbType } from '.';
import Post from './post';
import { sequelize } from './sequelize';

class User extends Model {
    public readonly id!: number;   // !를 붙이는 이유? 반드시 존재한다는 것을 시퀄라이즈에 확신시키는 것
    public nickname!: string;
    public userId!: string;
    public password!: string;
    public readonly createAt!: Date;    // 시퀄라이즈 내에서 자체적으로 수정하기 때문에 readonly로
    public readonly updateAt!: Date;

    public readonly Posts?: Post[];
    public readonly Followers?: User[];
    public readonly Followings?: User[];

    static addFollowing: BelongsToManyAddAssociationMixin<User, number>;
    static getFollowings: BelongsToManyGetAssociationsMixin<User>;     // ??
    static removeFollowings: BelongsToManyRemoveAssociationMixin<User, number>;     // remove는 제네릭이 두 개 필요함
    static getFollowers: BelongsToManyGetAssociationsMixin<User>;
    static removeFollowers: BelongsToManyRemoveAssociationMixin<User, number>;
    static getPost: HasManyGetAssociationsMixin<Post>;
}

User.init({
    nickname: {
        type: DataTypes.STRING(20),
    },
    userId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {    // 시퀄라이즈로 모델과 연동
    sequelize,
    modelName: 'User',
    tableName: 'user',
    charset: 'utf8',    // 한글 인식 가능하도록
    collate: 'utf8_general_ci'
});

// 모델간 관계 형성
export const associate = (db: dbType) => {
    db.User.hasMany(db.Post, { as: 'Posts' });
    db.User.belongsToMany(db.User, { through: 'Follow', as: 'Followings', foreignKey: 'followerId' });  // as가 가리키는 것과 foreignKey가 가리키는 것은 서로 반대
    db.User.belongsToMany(db.User, { through: 'Follow', as: 'Followers', foreignKey: 'followingId' });
}

export default User;