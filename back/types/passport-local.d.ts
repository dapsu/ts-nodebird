/**
 * 남들에게 배포하는 용은 아님. 이건 개발용
 * 배포할 때는 리덕스 따라가면서 알려드림..?
 * 모든 부분을 타이핑할 필요 전혀 없음. 내가 사용하는 코드 부분만 작성
 * local.ts 코드 보면서 적합한 타입 직접 정의하기
 */
declare module "passport-local" {       // delcare module은 실제 모듈의 이름과 같게 해야 에러나지 않음
    import { Request } from 'express';
    import { Strategy as PassportStrategy } from 'passport';

    // 인터페이스 이름은 실제 모듈과 이름을 같게 만듦
    export interface IVerifyOptions {       // export로 확장성 고려
        [key: string]: any;
    }
    export interface IStrategyOptions {
        usernameField: string;
        passwordField: string;
        session?: boolean;
        passReqToCallback?: false;
    }
    export interface IStrategyOptionsWithRequest {
        usernameField: string;
        passwordField: string;
        session?: boolean;
        passReqToCallback: true;
    }
    export interface Done {
        (error: any, user?: any, options?: IVerifyOptions): void;
    }
    export interface VerifyFunction {
        (username: string, password: string, done: Done): void | Promise<any>;
    }
    // req를 가장 앞 매개변수에 사용해야 하는 경우가 필요할 때, 오버로딩할 수 있는 인터페이스 생성
    export interface VerifyFunctionWithRequest {
        (req: Request, username: string, password: string, done: Done): void | Promise<any>;
    }

    export class Strategy extends PassportStrategy {
        // constructor(options: IStrategyOptions | IStrategyOptionsWithRequest, verify: VerifyFunction | VerifyFunctionWithRequest) // | 연산자 사용하면 에러 발생 가능함
        constructor(options: IStrategyOptions, verify: VerifyFunction)
        constructor(options: IStrategyOptionsWithRequest, verify: VerifyFunctionWithRequest)
    }
}