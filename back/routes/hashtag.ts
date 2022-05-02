import * as express from 'express';
import { Op, Sequelize } from 'sequelize';
import Hashtag from '../models/hashtag';
import Image from '../models/image';
import Post from '../models/post';
import User from '../models/user';

const router = express.Router();

router.get('/:tag', async (req, res, next) => {
    try {
        let where = {};
        if (parseInt(req.query.lastId as string, 10)) {
            where = {
                id: {
                    [Op.lt]: parseInt(req.query.lastId as string, 10),
                },
            };
        }
        const posts = await Post.findAll({
            where,
            include: [{
                model: Hashtag,
                where: { name: decodeURIComponent(req.params.tag) },
            }, {
                model: User,
                attributes: ['id', 'nickname'],
            }, {
                model: Image,
            }, {
                model: User,
                as: 'Likers',
                attributes: ['id'],
            }, {
                model: Post,
                as: 'Retweet',
                include: [{
                    model: User,
                    attributes: ['id', 'nickname'],
                }, {
                    model: Image,
                }]
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(req.query.limit as string, 10),
        });
        res.json(posts);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});

export default router;