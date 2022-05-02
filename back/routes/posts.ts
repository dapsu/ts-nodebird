/**
 * 단수, 복수 구분하는 이유?
 * restAPI에서는 단수만 사용함. 하지만 대부분 사람들 restAPI를 정확히 지키지 못 함
 * 그렇게 고치지 못 할 바에는 내가 편한대로 쓰자.
 * 데이터를 하나만 가져올 때는 단수로 쓰고, 여러 개를 가져올 때는 복수 사용
 */

import * as express from 'express';
import { Op, Sequelize } from 'sequelize';
import Image from '../models/image';
import Post from '../models/post';
import User from '../models/user';

const router = express.Router();

router.get('/', async (req, res, next) => {
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
            order: [['createAt', 'DESC']],  // 정렬 방법
            limit: parseInt(req.query.limit as string, 10),
        });
        return res.json(posts);
    } catch (err) {
        console.error(err);
        return next(err);
    }
});

export default router;