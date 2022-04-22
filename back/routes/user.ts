import * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as passport from 'passport';

import { isLoggedIn, isNotLoggedIn } from './middleware';
import User from '../models/user';
import Post from '../models/post';

const router = express.Router();

// 사용자 정보 불러오기
router.get('/', isLoggedIn, (req, res) => {     // get은 req, res에 타입 정의가 되어있기 때문에 따로 타입핑 안해도 됨
    const user = req.user!.toJSON();
    delete user.password;
    return res.json(user);
});

// 회원가입
router.post('/', async(req, res, next) => {
    try {
        const exUser = await User.findOne({      // 먼저 회원이 가입되어 있는지 여부 확인
            where: {
                userId: req.body.userId,
            }
        });
        if (exUser) return res.status(403).send('이미 사용 중인 아이디입니다.');    // 아이디 중복 체크
        const hashedPassword = await bcrypt.hash(req.body.password, 12);    // 두 번째 매개변수 숫자 클수록 암호화 보안↑, 그러나 암호화 시간↑ 컴퓨터 성능에 따라 조절 잘해야 함
        const newUser = await User.create({     // 중복된 아이디 아니라면 새로운 유저 생성
            nickname: req.body.nickname,
            userId: req.body.userId,
            password: hashedPassword,
        });
        return res.status(200).json(newUser);
    } catch(err) {
        console.error(err);
        next(err);
    }
});

// 로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (err: Error, user: User, info: { message: string }) => {   // 타입추론이 any라면 직접 정의하는 것이 좋음
        if (err) {
            console.error(err);
            return next(err);
        }
        if (info) {
            return res.status(401).send(info.message);
        }
        return req.login(user, async(loginErr: Error) => {
            try {
                if (loginErr) return next(loginErr);
                const fullUser = await User.findOne({
                    where: { id: user.id },
                    include: [{
                        model: Post,
                        as: 'Posts',
                        attributes: ['id'],
                    }, {
                        model: User,
                        as: 'Followings',
                        attributes: ['id']
                    }, {
                        model: User,
                        as: 'Followers',
                        attributes: ['id']
                    }],
                    attributes: {
                        exclude: ['password'],      // 내 정보 불러오는 것이기 때문에 비밀번호 제외한 정보 다 불러오기
                    }
                });
                return res.json(fullUser);
            } catch (e) {
                console.error(e);
                return next(e);
            }
        });
    })(req, res, next);
});

// 로그아웃
router.post('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session!.destroy(() => {
        res.send('logout 성공!');
    });
});

// 특정 사용자 정보 불러오기
interface IUser extends User {      // 한 번만 쓰이는 경우 그 파일에만, 여러번 사용되면 type 파일에 모아두기(개인 코딩 스타일대로!)
    PostCount: number;
    FollowingCount: number;
    FollowerCount: number;
}
router.get('/:id', async(req, res, next) => {   
    /**
     * 왜 '/:id' 이런 식?
     * :id처럼 주소에 넣어주면 나중에 로그를 볼 때 주소만 보고도 어떤 데이터에 작업을 했는지 알아볼 수 있기 때문
     */
    try {
        const user = await User.findOne({
            where: { id: parseInt(req.params.id, 10)},
            include: [{
                model: Post,
                as: 'Posts',
                attributes: ['id'],
            }, {
                model: User,
                as: 'Followings',
                attributes: ['id']
            }, {
                model: User,
                as: 'Followers',
                attributes: ['id']
            }],
            attributes: ['id', 'nickname'],     // 남의 정보 가져오는 것이기 때문에 아이디와 닉네임만
        });
        if (!user) return res.status(404).send('No user!');
        const jsonUser = user.toJSON() as IUser;
        jsonUser.PostCount = jsonUser.Posts ? jsonUser.Posts.length : 0;
        jsonUser.FollowingCount = jsonUser.Followings ? jsonUser.Followings.length : 0;
        jsonUser.FollowerCount = jsonUser.Followers ? jsonUser.Followers.length : 0;
        return res.json(jsonUser);
    } catch(err) {
        console.error(err);
        return next(err);
    }
});

router.get('/:id/followings', isLoggedIn, async(req, res, next) => {
    try {
        // 항상 먼저 해당 사용자가 존재하는지 먼저 찾아보기! 탈퇴했을수도 있으니까
        const user = await User.findOne({
            where: { id: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0 },
        });
        if (!user) return res.status(404).send('No user');
        // 그러고 나서 팔로워 찾기
        const followings = await User.getFollowings({
            attributes: ['id', 'nickname'],
        })
    } catch (err) {
        console.error(err);
        return next(err);
    }
});