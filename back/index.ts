import * as express from "express";
import * as morgan from "morgan";
import * as cors from "cors";
import * as cookieParser from "cookie-parser";
import * as expressSession from "express-session";
import * as dotenv from "dotenv";
import * as passport from "passport";
import * as hpp from "hpp";
import helmet from "helmet";

import { sequelize } from './models';
import userRouter from './routes/user';
import postRouter from './routes/post';
import postsRouter from './routes/posts';
import hashtagRouter from './routes/hashtag';

dotenv.config();
const app = express();
// 환경변수 설정
const prod: boolean = process.env.NODE_ENV === 'production'; // 배포용

app.set('port', prod ? process.env.PORT : 3065);    // 배포용이면 포트 자유자재로 바꿀 수 있도록, 개발용이면 3065로 고정

// 시퀄라이즈
sequelize.sync({ force: false })    // true면 서버 재시작할 때마다 db 초기화됨(배포 때 재앙;;). 나중에 개발할 때 테이블 컬럼 등 수정요소 있으면 true
    .then(() => {
        console.log('데이터베이스 연결 성공!');
    })
    .catch((err: Error) => {
        console.error(err);
    });

// 미들웨어 장착
if (prod) {
    app.use(hpp());
    app.use(helmet());
    app.use(morgan('combined'));
    app.use(cors({
        origin: /nodebird\.com$/,
        credentials: true
    }));
} else {
    app.use(morgan('dev'));
    app.use(cors({
        origin: true,
        credentials: true
    }));
}

app.use('/', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET!,    // 타입스크립트에서는 dotenv 인식 못 함. ! 를 통해 에러 없앰
    cookie: {
        httpOnly: true, // //자바스크립트를 통해 세션 쿠키를 사용할 수 없도록 함
        secure: false,  // true일 시 https 환경에서만 세션 처리 가능
        domain: prod ? '.nodebird.com' : undefined
        // domain: prod && '.nodebird.com'  // domain은 string | undefined 타입 형식으로 에러남(js에서는 문제 없음)
    },
    name: 'rnbck'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/posts', postsRouter);
app.use('/hashtage', hashtagRouter);
app.get('/', (req, res) => {
    res.send('nodebird 백엔드 정상 동작!');
});

app.listen(app.get('port'), () => {
    console.log(`server is running on ${app.get('port')}`);
});