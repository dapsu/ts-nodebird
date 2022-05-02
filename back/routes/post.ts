import * as express from 'express';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import * as AWS from 'aws-sdk';
import { isLoggedIn } from './middleware';
import * as path from 'path';
import Post from '../models/post';
import Hashtag from '../models/hashtag';
import Image from '../models/image';
import User from '../models/user';
// import * as BlueBird from 'bluebird';    // 버전6부터 블루버드 제거. 모든 메소드 async/await 사용

const router = express.Router();

// AWS 설정
AWS.config.update({
    region: 'ap-northeast-2',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const upload = multer({
    storage: multerS3({
        s3: new AWS.S3(),
        bucket: 'ts-nodebird',
        key(req, file, cb) {
            cb(null, `orginal/${+new Date()}${path.basename(file.originalname)}`);
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
    try {
        const hashtags: string[] = req.body.content.match(/#[^\s]+/g);
        const newPost = await Post.create({
            content: req.body.content,
            UserId: req.user!.id,
        });
        if (hashtags) {
            const promises = hashtags.map((tag) => Hashtag.findOrCreate({
                where: { name: tag.slice(1).toLowerCase() },
            }));
            const result = await Promise.all(promises);
            await newPost.addHashTags(result.map(r => r[0]));
        }
        if (req.body.image) {
            if (Array.isArray(req.body.image)) {    // 이미지가 여러 장일 때
                const promises = req.body.image.map((image: string) => Image.create({ src: image }));
                const images = await Promise.all(promises);
                await newPost.addImages(images);
            }
            else {
               const image = await Image.create({ src: req.body.image });
               await newPost.addImage(image);       // 시퀄라이즈에서는 단수, 복수도 신경써야 함
            }
        }
        const fulllPost = await Post.findOne({      // 게시글 가져오기
            where: { id: newPost.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Image,
            }, {
                model: User,
                as: 'Likers',
                attributes: ['id'],
            }],
        });
        return res.json(fulllPost);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});

export default router;