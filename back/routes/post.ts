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
import Comment from '../models/comment';
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

router.post('/images', upload.array('image'), (req, res) => {
    console.log(req.files);
    if (Array.isArray(req.files)) {
        res.json((req.files as Express.MulterS3.File[]).map((v) => v.location));
        /**
         * location이라는 메소드는 MulterS3 네임스페이스에만 존재하기 때문에 Multer를 MulterS3로 강제 형변환
         */
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id },
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
        return res.json(post);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});

router.delete('/:id', isLoggedIn, async (req, res, next) => {       // 권한 체크는 미들웨어에서!
    try {
        // 작업 대상이 있는지 없는지 먼저 검사하는 습관 가지기
        const post = await Post.findOne({ where: { id: req.params.id } });
        if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
        await Post.destroy({ where: { id: req.params.id } });

        return res.send(req.params.id);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});
  
router.get('/:id/comments', async (req, res, next) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.id } });
        if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
        const comments = await Comment.findAll({
            where: {
                PostId: req.params.id,
            },
            order: [['createdAt', 'ASC']],
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }],
        });
        return res.json(comments);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});
  
router.post('/:id/comment', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.id } });
        if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
        const newComment = await Comment.create({
            PostId: post.id,
            UserId: req.user!.id,
            content: req.body.content,
        });
        const comment = await Comment.findOne({
            where: {
                id: newComment.id,
            },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }],
        });
        return res.json(comment);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});
  
router.post('/:id/like', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.id } });
        if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
        await post.addLiker(req.user!.id);
        return res.json({ userId: req.user!.id });
    } catch (err) {
        console.error(err);
        next(err);
    }
});
  
router.delete('/:id/like', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.id } });
        if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
        await post.removeLiker(req.user!.id);
        return res.json({ userId: req.user!.id });
    } catch (err) {
        console.error(err);
        next(err);
    }
});
  
router.post('/:id/retweet', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id },
            include: [{
                model: Post,
                as: 'Retweet',
            }],
        });
        if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
        if (req.user!.id === post.UserId || (post.Retweet && post.Retweet.UserId === req.user!.id)) {
            return res.status(403).send('자신의 글은 리트윗할 수 없습니다.');
        }
        const retweetTargetId = post.RetweetId || post.id;
        const exPost = await Post.findOne({
            where: {
                UserId: req.user!.id,
                RetweetId: retweetTargetId,
            },
        });
        if (exPost) return res.status(403).send('이미 리트윗했습니다.');
        const retweet = await Post.create({
            UserId: req.user!.id,
            RetweetId: retweetTargetId,
            content: 'retweet',
        });
        const retweetWithPrevPost = await Post.findOne({
            where: { id: retweet.id },
            include: [{
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Post,
                as: 'Retweet',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }, {
                    model: Image,
                }],
            }],
        });
        return res.json(retweetWithPrevPost);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

export default router;