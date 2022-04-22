import * as passport from 'passport';
import User from '../models/user';      // 클래스는 그 자체로 타입으로 정의할 수도 있음
import local from './local';

export default () => {
    passport.serializeUser<User | number>((user, done) => {      // 로그인할 때 한 번 실행됨
        done(null, user.id);    // user의 id 정보를 메모리에 저장(user로 저장하면 용량 크기 때문)
    });

    passport.deserializeUser<User | number>(async(id, done) => {    // 모든 요청이 있을 때마다 실행됨
        try {
            const user = await User.findOne({
                where: { id },
            });
            if (!user) return done(new Error('No user!'));
            return done(null, user);    // req.user
        } catch (err) {
            console.error(err);
            return done(err);
        }
    });

    local();
}