import * as dotenv from 'dotenv';
dotenv.config();

// 객체 config에 대한 타입 정의
type Config = {
  username: string,
  password: string,
  database: string,
  host: string,
  [key: string]: string,
}
interface IConfigGroup {  // 인터페이스 네임 앞에 I 붙이는 방식은 타입스크립트에서 자주 사용된다고 함
  development: Config;
  test: Config;
  production: Config;
}

const config: IConfigGroup = {
  // 이번 프로젝트에서는 사실상 development 부분만 사용할 예정
  "development": {
    "username": "root",
    "password": process.env.DB_PASSWORD!,
    "database": "ts-nodeBird",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": process.env.DB_PASSWORD!,
    "database": "ts-nodeBird",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": process.env.DB_PASSWORD!,
    "database": "ts-nodeBird",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}

export default config;