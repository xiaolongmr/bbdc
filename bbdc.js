const express = require('express');
const { get } = require('axios');
const cloneDeep = require('lodash.clonedeep')
const isHexColor = require('../utils/isHexColor')
const baseURL = require('../baseURL')
const COLORS = require('../theme')
const { Error400 } = require('../error_pages')
const bbdcRouter = express.Router();

function handleTheme(COLORS, theme) {
    // 没有主题或者主题不存在
    if (theme === undefined || COLORS[theme] === undefined) {
        return 'default'
    }
    return theme
}

function render(COLORS, theme, data) {
    function handleColorField(param, field) {
        if (data[param] !== undefined) {
            return isHexColor(data[param]) ? '#' + data[param] : data[param]
        }
        return COLORS[theme][field]
    }
    const renderColor = cloneDeep(COLORS)
    renderColor[theme].BORDER = data.hide_border === 'true' ? 0 : COLORS[theme].BORDER
    renderColor[theme].TITLE = handleColorField('title_color', 'TITLE')
    renderColor[theme].TEXT = handleColorField('text_color', 'TEXT')

    return `function yan(){document.write("<div class='webinfo'>
    <!-- <div class='title'>${data.nickname}'s不背单词仪表盘</div> -->
     <div class='webinfo-item'>
       <div class='item-name'>今日学习</div>
       <div class='item-count'>${data.totalLearn} words</div>
     </div>
     <div class='webinfo-item'>
       <div class='item-name'>今日复习</div>
       <div class='item-count'>${data.totalReview} words</div>
     </div>
     <div class='webinfo-item'>
       <div class='item-name'>今日学习时长</div>
       <div class='item-count'>${data.totalDuration} mins</div>
     </div>
    </div>");}
`
}

bbdcRouter.get('/bbdc', async (req, res) => {
    const { userId, theme, nickname, hide_border, title_color, text_color } = req.query
    // 如果没有userId，返回404
    if (userId === undefined) {
        return res.status(400).send(new Error400('没有userId').render())
    }
    let totalDuration = 0
    let totalLearn = 0
    let totalReview = 0
    const { data } = await get(`profile/search`, {
        baseURL,
        params: { userId }
    })
    // 不正确的userId
    if (data.result_code === 20000) {
        return res.status(400).send(new Error400('userId不正确').render())
    }
    const { learnList, durationList } = data.data_body
    for (let i = 0, len = learnList.length; i < len; i++) {
        totalDuration += durationList[i].duration
        totalLearn += learnList[i].learnNum
        totalReview += learnList[i].reviewNum
    }
    // res.header("Content-Type", "text/html",)
    res.header("Content-Type", "application/javascript",)
    res.send(render(COLORS, handleTheme(COLORS, theme), { totalDuration, totalLearn, totalReview, nickname: nickname === undefined ? 'leftover' : nickname, hide_border, title_color, text_color }))
})
module.exports = bbdcRouter