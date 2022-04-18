import * as express from "express"; 

const app = express();
// 환경변수 설정
const prod = process.env.NODE_ENV === 'production'; // 배포용

app.get('/', (req, res) => {
    res.send('nodebird 백엔드 정상 동작!');
});

app.listen(prod ? process.env.PORT : 3065, () => {  // 배포용이면 포트 자유자재로 바꿀 수 있도록, 개발용이면 3065로 고정
    console.log(`server is running on ${process.env.PORT}`);
});